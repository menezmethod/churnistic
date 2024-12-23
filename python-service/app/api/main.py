from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import asyncio
from datetime import datetime

from app.models.churning import BaseOpportunity
from app.agents.churning_agent import analyze_churning_content
from app.services.reddit_service import RedditService

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Reddit service
reddit_service = RedditService(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))

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
    # Start background task for periodic scraping
    asyncio.create_task(periodic_scraping())

@app.on_event("shutdown")
async def shutdown_event():
    await reddit_service.close()

async def periodic_scraping():
    """Run Reddit scraping every hour."""
    while True:
        try:
            print(f"Starting Reddit scraping at {datetime.now()}")
            await reddit_service.fetch_and_process_threads()
            print(f"Completed Reddit scraping at {datetime.now()}")
            
            # Clean up old data
            await reddit_service.cleanup_old_data()
        except Exception as e:
            print(f"Error during periodic scraping: {str(e)}")
        
        # Wait for 1 hour before next run
        await asyncio.sleep(3600)

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(content: Content):
    opportunities = await analyze_churning_content(content)
    return AnalysisResponse(opportunities=opportunities)

@app.post("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """Manually trigger Reddit scraping."""
    background_tasks.add_task(reddit_service.fetch_and_process_threads)
    return {"message": "Scraping started in background"}

@app.get("/threads")
async def get_recent_threads():
    """Get recently processed Reddit threads."""
    threads = await reddit_service.get_recent_threads()
    return {"threads": threads}

@app.get("/threads/{thread_id}/comments")
async def get_thread_comments(thread_id: str):
    """Get comments for a specific thread."""
    comments = await reddit_service.get_thread_comments(thread_id)
    return {"comments": comments}

@app.get("/opportunities/recent")
async def get_recent_opportunities():
    """Get recently found opportunities."""
    opportunities = await reddit_service.get_recent_opportunities()
    return {"opportunities": opportunities} 