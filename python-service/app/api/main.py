from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Dict, Any

from app.models.churning import RedditContent, ChurningAnalysis
from app.agents.churning_agent import analyze_content

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Churning Analysis API",
    description="API for analyzing credit card and bank account churning opportunities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
async def test_endpoint() -> Dict[str, Any]:
    """
    Test endpoint to verify the API is working
    """
    logger.info("Test endpoint called")
    return {
        "status": "ok",
        "message": "API is running"
    }

@app.post("/analyze", response_model=ChurningAnalysis)
async def analyze_churning(content: RedditContent) -> ChurningAnalysis:
    """
    Analyze Reddit content for churning opportunities
    
    This endpoint takes Reddit thread content and comments,
    analyzes them for credit card and bank account churning opportunities,
    and returns structured analysis results using the Groq LLM.
    """
    try:
        logger.info(f"Analyzing content from thread: {content.thread_title}")
        logger.info(f"Number of comments: {len(content.comments)}")
        
        analysis = await analyze_content(content)
        
        logger.info(f"Analysis complete. Found {len(analysis.opportunities)} opportunities")
        return analysis
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error analyzing content: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing content: {str(e)}"
        ) 