from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from datetime import datetime
from typing import Dict, Any, List
import pathlib

from app.services.reddit_service import RedditCollector
from app.agents.opportunity_analyzer import OpportunityAnalyzer

# Set up logging
log_dir = pathlib.Path("logs")
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / "app.log"

# Configure logging with immediate flush
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Get the root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Remove any existing handlers
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# Add our handlers
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

logger = logging.getLogger(__name__)

# Load environment variables
MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017/churnistic")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
reddit_collector = RedditCollector(MONGODB_URL)
opportunity_analyzer = OpportunityAnalyzer(MONGODB_URL)

@app.on_event("shutdown")
async def shutdown_event():
    await reddit_collector.close()
    await opportunity_analyzer.close()

@app.post("/collect")
async def trigger_collection(background_tasks: BackgroundTasks):
    """Trigger Reddit data collection."""
    logger.info("Starting Reddit data collection")
    background_tasks.add_task(reddit_collector.collect_threads)
    background_tasks.add_task(reddit_collector.collect_comments)
    return {"message": "Collection started"}

@app.get("/collection/stats")
async def get_collection_stats() -> Dict[str, Any]:
    """Get statistics about collected data."""
    logger.info("Getting collection stats")
    stats = await reddit_collector.get_collection_stats()
    logger.info(f"Collection stats: {stats}")
    return stats

@app.get("/threads")
async def get_threads() -> List[Dict[str, Any]]:
    """Get collected threads."""
    logger.info("Getting threads")
    threads = await reddit_collector.db.reddit_threads.find().to_list(length=None)
    for thread in threads:
        thread.pop('_id', None)  # Remove MongoDB _id
    logger.info(f"Found {len(threads)} threads")
    return threads

@app.get("/threads/{thread_id}/comments")
async def get_thread_comments(thread_id: str) -> Dict[str, Any]:
    """Get comments for a specific thread."""
    logger.info(f"Getting comments for thread {thread_id}")
    comments = await reddit_collector.db.reddit_comments.find(
        {'thread_id': thread_id}
    ).to_list(length=None)
    
    for comment in comments:
        comment.pop('_id', None)  # Remove MongoDB _id
    
    logger.info(f"Found {len(comments)} comments for thread {thread_id}")
    return {"comments": comments}

@app.post("/analyze")
async def trigger_analysis(background_tasks: BackgroundTasks):
    """Trigger opportunity analysis."""
    background_tasks.add_task(opportunity_analyzer.analyze_threads)
    return {"message": "Analysis started"}

@app.get("/opportunities/recent")
async def get_recent_opportunities() -> List[Dict[str, Any]]:
    """Get recent opportunities in frontend-compatible format."""
    try:
        logger.info("Getting recent opportunities")
        opportunities = await opportunity_analyzer.get_opportunities()
        logger.info(f"Found {len(opportunities)} opportunities")
        return opportunities
    except Exception as e:
        logger.error(f"Error getting recent opportunities: {str(e)}")
        return []

@app.post("/threads/{thread_id}/reanalyze")
async def reanalyze_thread(thread_id: str) -> Dict[str, Any]:
    """Reanalyze a specific thread and return frontend-compatible format."""
    try:
        logger.info(f"Reanalyzing thread {thread_id}")
        analysis = await opportunity_analyzer.reanalyze_thread(thread_id)
        logger.info(f"Reanalysis complete for thread {thread_id}")
        return analysis
    except Exception as e:
        logger.error(f"Error reanalyzing thread {thread_id}: {str(e)}")
        return {"opportunities": []} 