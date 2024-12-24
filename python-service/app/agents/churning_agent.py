from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import os
import logging
import asyncio
import time
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry
import json

from app.models.churning import (
    RedditContent,
    BaseOpportunity,
    ChurningAnalysis
)

# Set up logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Optional Logfire configuration (temporarily disabled)
USE_LOGFIRE = False
logger.info("Running without Logfire")

# Load environment variables
load_dotenv()

# Model configuration
MODELS = [
    'groq:llama-3.1-8b-instant',  # Primary model (faster, lower quality)
    'groq:mixtral-8x7b-32768',    # Secondary model (balanced)
    'groq:llama-2-70b-chat',      # Fallback model (slower, higher quality)
]
CURRENT_MODEL_INDEX = 0
MODEL = MODELS[CURRENT_MODEL_INDEX]
REQUESTS_PER_MINUTE = 20  # Reduced from 30 to be more conservative
MIN_REQUEST_INTERVAL = 60.0 / REQUESTS_PER_MINUTE
MAX_RETRIES = 5  # Increased from 3
RETRY_DELAY = 10  # Increased from 5 seconds
COOLDOWN_PERIOD = 60  # Reduced from 300 to 60 seconds

# Cache for opportunities to avoid duplicates
opportunity_cache = {}

async def wait_for_rate_limit():
    """Global rate limit function that can be imported by other modules"""
    await model_state.wait_for_rate_limit()

class ModelState:
    def __init__(self):
        self.last_request_time = 0.0
        self.request_count = 0
        self.error_count = 0
        self.total_tokens = 0
        self.current_model_index = 0
        self.last_model_switch_time = 0.0
        self.rate_limit_hits = {}  # Track rate limits per model
        
    def switch_model(self):
        """Switch to next available model"""
        current_time = time.time()
        
        # If we've waited long enough, try switching back to primary model
        if (current_time - self.last_model_switch_time > COOLDOWN_PERIOD and 
            self.current_model_index > 0):
            self.current_model_index = 0
            logger.info(f"Switching back to primary model: {MODELS[0]}")
        else:
            # Otherwise cycle through models
            self.current_model_index = (self.current_model_index + 1) % len(MODELS)
            logger.info(f"Switching to fallback model: {MODELS[self.current_model_index]}")
        
        self.last_model_switch_time = current_time
        return MODELS[self.current_model_index]
        
    async def wait_for_rate_limit(self):
        """Ensure we don't exceed rate limits with monitoring"""
        current_time = time.time()
        current_model = MODELS[self.current_model_index]
        
        # Check if current model is rate limited
        if current_model in self.rate_limit_hits:
            retry_after = self.rate_limit_hits[current_model].get('retry_after', 0)
            if current_time < retry_after:
                logger.info(f"Model {current_model} is rate limited, switching models")
                new_model = self.switch_model()
                return new_model
                
        elapsed = current_time - self.last_request_time
        if elapsed < MIN_REQUEST_INTERVAL:
            wait_time = MIN_REQUEST_INTERVAL - elapsed
            logger.info(f"Rate limiting: waiting {wait_time:.2f} seconds")
            await asyncio.sleep(wait_time)
            
        self.last_request_time = time.time()
        self.request_count += 1
        return MODELS[self.current_model_index]

    def handle_rate_limit(self, model: str, retry_after: int):
        """Handle rate limit for a specific model"""
        current_time = time.time()
        self.rate_limit_hits[model] = {
            'hit_time': current_time,
            'retry_after': current_time + retry_after
        }
        logger.warning(f"Rate limit hit for {model}, retry after {retry_after} seconds")
        # Immediately switch to next model
        return self.switch_model()

model_state = ModelState()

@dataclass
class ChurningDependencies:
    """Dependencies for churning analysis."""
    content: Dict[str, Any]
    max_retries: Optional[int] = MAX_RETRIES

class ChurningMetrics(BaseModel):
    """Metrics for monitoring churning analysis performance"""
    opportunities_found: int = 0
    total_value: float = 0.0
    average_confidence: float = 0.0
    processing_time: float = 0.0
    token_count: int = 0
    error_count: int = 0

# Initialize the agent first
churning_agent = Agent(
    MODEL,
    deps_type=ChurningDependencies,
    result_type=ChurningAnalysis,
    system_prompt="""You are a churning opportunities analyzer. Your task is to analyze content from Reddit and identify bank account and credit card churning opportunities.

For each opportunity you find, you should extract:
- Title: A clear, concise title for the opportunity
- Type: Either "credit_card" or "bank_account"
- Value: The numerical value of the bonus in dollars (just the number)
- Bank: The bank or financial institution offering the bonus
- Description: A clear description of the opportunity
- Requirements: List of requirements to get the bonus
- Source: Where this opportunity was found (e.g., "reddit")
- Source Link: The URL or reference to the source
- Posted Date: When the opportunity was posted (if available)
- Expiration Date: When the opportunity expires (if available)
- Confidence: Your confidence in this opportunity (0.0 to 1.0)
- Metadata: Additional details specific to the opportunity type

DO NOT use any external search or functions. Only analyze the content provided.
Return opportunities in the exact format specified by the ChurningAnalysis model.
"""
)

# Then define the system prompt decorator
@churning_agent.system_prompt
async def add_content_info(ctx: RunContext[ChurningDependencies]) -> str:
    """Add content information to the system prompt."""
    content = ctx.deps.content
    return f"""Analyzing content:
Title: {content.get('title', 'N/A')}
Content: {content.get('content', 'N/A')}
Comments: {len(content.get('comments', []))} comments
Created: {datetime.fromtimestamp(content.get('created_utc', 0)).isoformat()}
"""

async def analyze_content(content: Dict[str, Any]) -> ChurningAnalysis:
    """Main function to analyze churning content with improved monitoring and retries"""
    metrics = ChurningMetrics()
    start_time = time.time()
    retries = 0
    last_error = None
    
    try:
        while retries < MAX_RETRIES:
            try:
                # Get current model with rate limit check
                current_model = await model_state.wait_for_rate_limit()
                
                # Update agent model
                churning_agent.model = current_model
                
                # Create dependencies
                deps = ChurningDependencies(
                    content=content,
                    max_retries=MAX_RETRIES - retries
                )
                
                # Run the agent with the dependencies
                result = await churning_agent.run('Analyze this content for churning opportunities', deps=deps)
                
                if not isinstance(result.data, ChurningAnalysis):
                    raise ValueError("Unexpected response format from model")
                
                # Update metrics
                if result.data.opportunities:
                    metrics.opportunities_found = len(result.data.opportunities)
                    metrics.total_value = sum(
                        float(opp.value.replace('$', '').replace(',', ''))
                        for opp in result.data.opportunities
                    )
                    metrics.average_confidence = (
                        sum(opp.confidence for opp in result.data.opportunities) / len(result.data.opportunities)
                    )
                    logger.info(f"Analysis successful: Found {metrics.opportunities_found} opportunities")
                    return result.data
                else:
                    logger.info("No opportunities found in content")
                    return ChurningAnalysis(opportunities=[])
                    
            except Exception as e:
                last_error = e
                if "rate_limit" in str(e).lower():
                    # Extract retry-after if available
                    retry_after = 60  # Default to 60 seconds
                    if hasattr(e, 'headers'):
                        retry_after = int(e.headers.get('retry-after', retry_after))
                    current_model = model_state.handle_rate_limit(churning_agent.model, retry_after)
                    churning_agent.model = current_model
                    logger.warning(f"Rate limit hit, switched to {current_model}")
                    retries += 1
                    continue
                    
                logger.error(f"Error during analysis (attempt {retries + 1}/{MAX_RETRIES}): {str(e)}")
                retries += 1
                if retries < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * (2 ** retries))  # Exponential backoff
                
        if last_error:
            logger.error(f"Analysis failed after {MAX_RETRIES} attempts: {str(last_error)}")
        return ChurningAnalysis(opportunities=[])
        
    finally:
        metrics.processing_time = time.time() - start_time
        logger.info(f"Analysis metrics: {metrics.dict()}")

def calculate_confidence(
    base_confidence: float,
    confirmation_count: int,
    contradiction_count: int,
    data_points_count: int,
    success_rate: float
) -> float:
    """Calculate confidence score based on various factors."""
    # Base confidence from initial analysis
    confidence = base_confidence
    
    # Adjust based on confirmations vs contradictions
    if confirmation_count + contradiction_count > 0:
        confirmation_ratio = confirmation_count / (confirmation_count + contradiction_count)
        confidence *= (0.5 + 0.5 * confirmation_ratio)
    
    # Adjust based on number of data points
    data_points_factor = min(data_points_count / 5, 1.0)  # Cap at 5 data points
    confidence *= (0.7 + 0.3 * data_points_factor)
    
    # Adjust based on success rate
    confidence *= (0.7 + 0.3 * success_rate)
    
    return min(max(confidence, 0.0), 1.0)  # Ensure confidence stays between 0 and 1

def generate_summary(opportunities: List[Dict]) -> str:
    """Generate a summary of the opportunities found."""
    if not opportunities:
        return "No valid opportunities found in this content."
    
    total_value = sum(float(opp["value"].replace('$', '').replace(',', '')) for opp in opportunities)
    high_confidence = len([opp for opp in opportunities if opp["confidence"] > 0.8])
    
    return f"Found {len(opportunities)} valid opportunities worth ${total_value:,.2f} total. {high_confidence} opportunities have high confidence scores."

def generate_risk_assessment(opportunities: List[Dict]) -> str:
    """Generate a risk assessment based on the opportunities."""
    if not opportunities:
        return "No opportunities to assess."
    
    avg_confidence = sum(opp["confidence"] for opp in opportunities) / len(opportunities)
    risk_level = 1 - avg_confidence
    
    risk_categories = {
        0.8: "very high",
        0.6: "high",
        0.4: "moderate",
        0.2: "low",
        0.0: "very low"
    }
    
    risk_category = next(cat for threshold, cat in risk_categories.items() if risk_level >= threshold)
    
    return f"Overall risk level is {risk_category} based on confidence scores and validation data."

def calculate_overall_risk(opportunities: List[Dict]) -> float:
    """Calculate overall risk level."""
    if not opportunities:
        return 0.0
    
    return 1 - (sum(opp["confidence"] for opp in opportunities) / len(opportunities))

def analyze_comment_sentiment(comment: str) -> Dict:
    """Analyze the sentiment and reliability of a comment."""
    sentiment_indicators = {
        "positive": ["confirmed", "success", "worked", "approved", "bonus posted"],
        "negative": ["denied", "failed", "issue", "problem", "rejected"],
        "neutral": ["tried", "attempting", "applied", "waiting", "pending"]
    }
    
    reliability_factors = {
        "high": ["screenshot", "proof", "data point", "timeline", "exact amount"],
        "medium": ["personal experience", "recent", "specific date", "details"],
        "low": ["heard", "maybe", "might", "someone said", "not sure"]
    }
    
    sentiment_score = 0
    reliability_score = 0
    
    # Calculate sentiment score
    for word in comment.lower().split():
        if any(indicator in word for indicator in sentiment_indicators["positive"]):
            sentiment_score += 1
        elif any(indicator in word for indicator in sentiment_indicators["negative"]):
            sentiment_score -= 1
    
    # Calculate reliability score
    for word in comment.lower().split():
        if any(factor in word for factor in reliability_factors["high"]):
            reliability_score += 2
        elif any(factor in word for factor in reliability_factors["medium"]):
            reliability_score += 1
        elif any(factor in word for factor in reliability_factors["low"]):
            reliability_score -= 1
    
    return {
        "sentiment": max(-1, min(1, sentiment_score / 5)),  # Normalize to [-1, 1]
        "reliability": max(0, min(1, (reliability_score + 3) / 6))  # Normalize to [0, 1]
    }

def extract_time_sensitivity(comment: str) -> Dict:
    """Extract time-sensitive information from a comment."""
    time_indicators = {
        "urgent": ["expires today", "last day", "ending soon", "hurry"],
        "soon": ["this week", "this month", "limited time"],
        "standard": ["available", "ongoing", "current offer"]
    }
    
    urgency_score = 0
    expiration_mentioned = False
    
    for word in comment.lower().split():
        if any(indicator in word for indicator in time_indicators["urgent"]):
            urgency_score += 2
            expiration_mentioned = True
        elif any(indicator in word for indicator in time_indicators["soon"]):
            urgency_score += 1
            expiration_mentioned = True
    
    return {
        "urgency": min(1, urgency_score / 2),  # Normalize to [0, 1]
        "has_expiration": expiration_mentioned
    }

def _parse_value(value_str: str) -> float:
    """Parse a value string that might be a range into a float."""
    try:
        # If it's a simple number, return it
        return float(value_str)
    except ValueError:
        # If it's a range (e.g., "100-1000"), take the lower bound
        try:
            return float(value_str.split('-')[0])
        except (ValueError, IndexError):
            # If we can't parse it, return 0
            return 0.0

def _validate_analysis(analysis: ChurningAnalysis) -> bool:
    """Validate the analysis result."""
    if not analysis.opportunities:
        return True
        
    for opp in analysis.opportunities:
        # Convert value to float if it's a string
        if isinstance(opp.value, str):
            opp.value = _parse_value(opp.value)
            
        # Ensure required fields are present
        if not all([opp.title, opp.type, opp.bank, opp.description]):
            return False
            
        # Validate confidence is between 0 and 1
        if not (0 <= opp.confidence <= 1):
            return False
            
    return True