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

# Constants for retries and delays
MAX_RETRIES = 5
RETRY_DELAY = 10  # seconds
COOLDOWN_PERIOD = 60  # seconds

# Model configuration with tiers based on OpenRouter rankings and Groq rate limits
MODEL_TIERS = [
    {
        'name': 'groq:llama-3.1-70b-versatile',  # Primary model (highest ranked)
        'rpm': 30,  # Requests per minute
        'tpm': 6000,  # Tokens per minute
        'retry_after': 60,  # Default retry after in seconds
        'priority': 1,
        'context_window': 128000,
        'daily_limit': 200000  # Tokens per day
    },
    {
        'name': 'groq:llama-3.1-8b-instant',  # Secondary model (fast, efficient)
        'rpm': 30,
        'tpm': 20000,
        'retry_after': 45,
        'priority': 2,
        'context_window': 128000,
        'daily_limit': 500000
    },
    {
        'name': 'groq:mixtral-8x7b-32768',  # Fallback model (large context)
        'rpm': 30,
        'tpm': 5000,
        'retry_after': 30,
        'priority': 3,
        'context_window': 32768,
        'daily_limit': 500000
    }
]

# Initial model configuration - start with highest ranked model
MODEL = MODEL_TIERS[0]['name']

# Cache for opportunities to avoid duplicates
opportunity_cache = {}

async def wait_for_rate_limit():
    """Global rate limit function that can be imported by other modules"""
    await model_state.wait_for_rate_limit()

class ModelState:
    def __init__(self):
        self.last_request_time = 0.0
        self.request_counts = {model['name']: 0 for model in MODEL_TIERS}
        self.token_counts = {model['name']: 0 for model in MODEL_TIERS}
        self.daily_token_counts = {model['name']: 0 for model in MODEL_TIERS}  # Track daily token usage
        self.rate_limit_hits = {}  # Track rate limits per model
        self.current_model_index = 0
        self.last_model_switch_time = time.time()
        self.day_start = time.time()  # Track start of the day for token limits
        
    def reset_daily_counts(self):
        """Reset daily token counts if a new day has started"""
        current_time = time.time()
        if current_time - self.day_start >= 86400:  # 24 hours in seconds
            self.daily_token_counts = {model['name']: 0 for model in MODEL_TIERS}
            self.day_start = current_time
        
    def can_use_model(self, model_config: dict) -> bool:
        """Check if a model can be used based on rate limits and daily quotas"""
        current_time = time.time()
        model_name = model_config['name']
        
        # Reset daily counts if needed
        self.reset_daily_counts()
        
        # Check daily token limit
        if self.daily_token_counts[model_name] >= model_config['daily_limit']:
            logger.warning(f"Daily token limit reached for {model_name}")
            return False
        
        # Check if model is rate limited
        if model_name in self.rate_limit_hits:
            rate_limit = self.rate_limit_hits[model_name]
            if current_time < rate_limit['retry_after']:
                return False
            
            # Clear rate limit if enough time has passed
            if current_time >= rate_limit['retry_after']:
                del self.rate_limit_hits[model_name]
        
        return True

    def update_token_counts(self, model_name: str, token_count: int):
        """Update token counts for rate limiting and daily quotas"""
        self.token_counts[model_name] += token_count
        self.daily_token_counts[model_name] += token_count
        
        # Log if approaching daily limit
        model_config = next(m for m in MODEL_TIERS if m['name'] == model_name)
        daily_limit = model_config['daily_limit']
        usage_percent = (self.daily_token_counts[model_name] / daily_limit) * 100
        if usage_percent >= 80:
            logger.warning(f"{model_name} at {usage_percent:.1f}% of daily token limit")

    def get_current_model(self) -> dict:
        """Get current model configuration"""
        return MODEL_TIERS[self.current_model_index]
        
    def update_rate_limits(self, model_name: str, headers: dict):
        """Update rate limit tracking based on API response headers"""
        current_time = time.time()
        
        if 'x-ratelimit-remaining-requests' in headers:
            remaining_requests = int(headers['x-ratelimit-remaining-requests'])
            if remaining_requests <= 0:
                reset_time = float(headers.get('x-ratelimit-reset-requests', '60').rstrip('s'))
                self.rate_limit_hits[model_name] = {
                    'hit_time': current_time,
                    'retry_after': current_time + reset_time
                }
                
        if 'x-ratelimit-remaining-tokens' in headers:
            remaining_tokens = int(headers['x-ratelimit-remaining-tokens'])
            if remaining_tokens <= 0:
                reset_time = float(headers.get('x-ratelimit-reset-tokens', '60').rstrip('s'))
                self.rate_limit_hits[model_name] = {
                    'hit_time': current_time,
                    'retry_after': current_time + reset_time
                }
    
    def handle_rate_limit(self, model_name: str, retry_after: int):
        """Handle rate limit for a specific model"""
        current_time = time.time()
        self.rate_limit_hits[model_name] = {
            'hit_time': current_time,
            'retry_after': current_time + retry_after
        }
        logger.warning(f"Rate limit hit for {model_name}, retry after {retry_after} seconds")
        return self.switch_model()
        
    def switch_model(self) -> str:
        """Switch to next available model based on priority"""
        current_time = time.time()
        original_index = self.current_model_index
        
        # Try each model in order of priority
        for i in range(len(MODEL_TIERS)):
            next_index = (self.current_model_index + i) % len(MODEL_TIERS)
            next_model = MODEL_TIERS[next_index]
            
            if self.can_use_model(next_model):
                self.current_model_index = next_index
                self.last_model_switch_time = current_time
                logger.info(f"Switching to model: {next_model['name']}")
                return next_model['name']
        
        # If no models available, wait and return current model
        logger.warning("No models available, keeping current model")
        return MODEL_TIERS[original_index]['name']
        
    async def wait_for_rate_limit(self) -> str:
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        current_model = self.get_current_model()
        
        # If current model is rate limited, try switching
        if not self.can_use_model(current_model):
            new_model_name = self.switch_model()
            current_model = next(m for m in MODEL_TIERS if m['name'] == new_model_name)
        
        # Calculate wait time based on RPM
        elapsed = current_time - self.last_request_time
        min_interval = 60.0 / current_model['rpm']
        
        if elapsed < min_interval:
            wait_time = min_interval - elapsed
            logger.info(f"Rate limiting: waiting {wait_time:.2f} seconds")
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()
        self.request_counts[current_model['name']] += 1
        return current_model['name']

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

class OpportunityQuality(BaseModel):
    """Track quality metrics for opportunities"""
    model_name: str
    processing_date: datetime
    confidence: float
    verification_count: int = 0
    verified_by_models: List[str] = []
    metadata_completeness: float = 0.0
    contradictions: List[str] = []

# Update the system prompt to be more specific about metadata
SYSTEM_PROMPT = """You are a churning opportunities analyzer. Your task is to analyze content from Reddit and identify bank account and credit card churning opportunities.

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
- Metadata: Additional details including:
  * Minimum Spend: Required spending amount if any
  * Time Period: Time window for meeting requirements
  * Credit Score: Minimum credit score if mentioned
  * Hard Pull: Whether a hard credit pull is required
  * Direct Deposit: Whether direct deposit is required
  * Geographic Restrictions: Any location requirements
  * Previous Customer: Rules about previous customers
  * Maximum Bonus: Any caps on the bonus amount
  * Opportunity Type: "New Account", "Referral", "Upgrade", etc.
  * Additional Requirements: Any other specific conditions

DO NOT use any external search or functions. Only analyze the content provided.
Return opportunities in the exact format specified by the ChurningAnalysis model.
"""

# Update the churning agent with new system prompt
churning_agent = Agent(
    MODEL,
    deps_type=ChurningDependencies,
    result_type=ChurningAnalysis,
    system_prompt=SYSTEM_PROMPT
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
    """Main function to analyze churning content with improved rate limiting"""
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
                
                # Update rate limits from response headers if available
                if hasattr(result, 'headers'):
                    model_state.update_rate_limits(current_model, result.headers)
                
                if not isinstance(result.data, ChurningAnalysis):
                    raise ValueError("Unexpected response format from model")
                
                # Update metrics
                if result.data.opportunities:
                    metrics.opportunities_found = len(result.data.opportunities)
                    metrics.total_value = sum(
                        float(str(opp.value).replace('$', '').replace(',', ''))
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
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    # Extract retry-after if available
                    retry_after = 60  # Default to 60 seconds
                    if hasattr(e, 'headers'):
                        retry_after = int(e.headers.get('retry-after', retry_after))
                    current_model = model_state.handle_rate_limit(churning_agent.model, retry_after)
                    churning_agent.model = current_model
                    logger.warning(f"Rate limit hit, switched to {current_model}")
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
        logger.info(f"Analysis metrics: {metrics.model_dump()}")

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

async def reprocess_opportunity(opportunity: Dict[str, Any], model_name: str = None) -> Optional[Dict[str, Any]]:
    """Reprocess an opportunity using a higher quality model for verification"""
    if not model_name:
        model_name = MODEL_TIERS[0]['name']  # Use highest quality model by default
    
    # Create a simplified content object focusing on the opportunity
    content = {
        'title': opportunity['title'],
        'content': opportunity['description'],
        'source': opportunity['source'],
        'source_link': opportunity['sourceLink'],
        'requirements': opportunity['requirements'],
        'metadata': opportunity.get('metadata', {})
    }
    
    # Force use of specific model
    original_model = churning_agent.model
    churning_agent.model = model_name
    
    try:
        result = await analyze_content(content)
        if result and result.opportunities:
            verified_opp = result.opportunities[0].model_dump()
            
            # Compare and merge metadata
            original_metadata = opportunity.get('metadata', {})
            new_metadata = verified_opp.get('metadata', {})
            merged_metadata = {**original_metadata, **new_metadata}
            
            # Update quality metrics
            quality = OpportunityQuality(
                model_name=model_name,
                processing_date=datetime.now(),
                confidence=verified_opp['confidence'],
                verification_count=opportunity.get('verification_count', 0) + 1,
                verified_by_models=[*opportunity.get('verified_by_models', []), model_name],
                metadata_completeness=calculate_metadata_completeness(merged_metadata)
            )
            
            # Check for contradictions
            contradictions = find_contradictions(opportunity, verified_opp)
            if contradictions:
                quality.contradictions.extend(contradictions)
                logger.warning(f"Found contradictions in opportunity: {contradictions}")
            
            # Merge and return updated opportunity
            return {
                **opportunity,
                'metadata': merged_metadata,
                'confidence': max(opportunity['confidence'], verified_opp['confidence']),
                'quality': quality.model_dump(),
                'last_verified': datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Error reprocessing opportunity: {str(e)}")
        return None
    finally:
        churning_agent.model = original_model

def calculate_metadata_completeness(metadata: Dict) -> float:
    """Calculate how complete the metadata is"""
    required_fields = {
        'minimum_spend', 'time_period', 'credit_score', 'hard_pull',
        'direct_deposit', 'geographic_restrictions', 'previous_customer',
        'maximum_bonus', 'opportunity_type', 'additional_requirements'
    }
    
    if not metadata:
        return 0.0
    
    present_fields = sum(1 for field in required_fields if metadata.get(field))
    return present_fields / len(required_fields)

def find_contradictions(original: Dict, verified: Dict) -> List[str]:
    """Find contradictions between original and verified opportunities"""
    contradictions = []
    
    # Check numerical values
    if abs(float(original['value']) - float(verified['value'])) > 0.01:
        contradictions.append(f"Value mismatch: ${original['value']} vs ${verified['value']}")
    
    # Check categorical fields
    if original['type'] != verified['type']:
        contradictions.append(f"Type mismatch: {original['type']} vs {verified['type']}")
    
    if original['bank'] != verified['bank']:
        contradictions.append(f"Bank mismatch: {original['bank']} vs {verified['bank']}")
    
    # Check requirements
    orig_reqs = set(original['requirements'])
    new_reqs = set(verified['requirements'])
    if orig_reqs != new_reqs:
        contradictions.append("Requirements mismatch")
    
    return contradictions

async def reprocess_all_opportunities(opportunities: List[Dict], min_confidence: float = 0.8) -> List[Dict]:
    """Reprocess all opportunities that need verification"""
    results = []
    
    for opp in opportunities:
        # Skip if already verified by high quality model with good confidence
        if (opp.get('quality', {}).get('model_name') == MODEL_TIERS[0]['name'] and 
            opp['confidence'] >= min_confidence):
            results.append(opp)
            continue
        
        # Reprocess with highest quality model
        updated_opp = await reprocess_opportunity(opp)
        if updated_opp:
            results.append(updated_opp)
        else:
            # Keep original if reprocessing failed
            results.append(opp)
    
    return results