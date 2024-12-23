from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import asyncio
from datetime import datetime

from app.models.churning import BaseOpportunity
from app.agents.churning_agent import analyze_churning_content
from app.services.reddit_service import RedditCollector

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Reddit collector
reddit_collector = RedditCollector(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))

class Content(BaseModel):
    thread_id: str
    thread_title: str
    thread_content: str
    thread_permalink: str
    comments: List[str]

class AnalysisResponse(BaseModel):
    opportunities: List[BaseOpportunity]

@app.on_event("startup")
async def startup_event():
    # Start background task for periodic collection
    asyncio.create_task(periodic_collection())

@app.on_event("shutdown")
async def shutdown_event():
    await reddit_collector.close()

async def periodic_collection():
    """Run Reddit collection every hour."""
    while True:
        try:
            print(f"Starting Reddit collection at {datetime.now()}")
            
            # Collect threads first
            await reddit_collector.collect_threads()
            
            # Then collect comments for threads that need them
            await reddit_collector.collect_comments()
            
            print(f"Completed Reddit collection at {datetime.now()}")
            
            # Clean up old data
            await reddit_collector.cleanup_old_data()
            
            # Get and log collection stats
            stats = await reddit_collector.get_collection_stats()
            print(f"Collection stats: {stats}")
            
        except Exception as e:
            print(f"Error during periodic collection: {str(e)}")
        
        # Wait for 1 hour before next run
        await asyncio.sleep(3600)

@app.post("/collect")
async def trigger_collection(background_tasks: BackgroundTasks):
    """Manually trigger Reddit collection."""
    background_tasks.add_task(reddit_collector.collect_threads)
    background_tasks.add_task(reddit_collector.collect_comments)
    return {"message": "Collection started in background"}

@app.get("/collection/stats")
async def get_collection_stats():
    """Get statistics about collected data."""
    return await reddit_collector.get_collection_stats()

@app.get("/threads")
async def get_threads():
    """Get recently collected threads."""
    cursor = reddit_collector.db.reddit_threads.find(
        {},
        {'_id': 0}
    ).sort('created_utc', -1).limit(50)
    
    threads = await cursor.to_list(length=50)
    return {"threads": threads}

@app.get("/threads/{thread_id}/comments")
async def get_thread_comments(thread_id: str):
    """Get comments for a specific thread."""
    cursor = reddit_collector.db.reddit_comments.find(
        {'thread_id': thread_id},
        {'_id': 0}
    )
    comments = await cursor.to_list(length=None)
    return {"comments": comments}

# Note: Opportunities endpoint will be moved to a separate service
@app.get("/opportunities/recent")
async def get_recent_opportunities():
    """Get recently found opportunities."""
    cursor = reddit_collector.db.opportunities.find(
        {},
        {'_id': 0}
    ).sort('created_at', -1).limit(20)
    
    opportunities = await cursor.to_list(length=20)
    return {"opportunities": opportunities} 