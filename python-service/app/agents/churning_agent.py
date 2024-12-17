from dataclasses import dataclass
from typing import List, Dict, Any
import os
import logging
import asyncio
import time
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry

from app.models.churning import (
    RedditContent,
    BaseOpportunity,
    CreditCardOpportunity,
    BankAccountOpportunity,
    ChurningAnalysis
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Model configuration
MAIN_MODEL = 'llama-3.1-70b-versatile'

# Rate limiting configuration
REQUESTS_PER_MINUTE = 30
MIN_REQUEST_INTERVAL = 60.0 / REQUESTS_PER_MINUTE
last_request_time = 0.0

@dataclass
class ChurningDependencies:
    content: RedditContent

churning_agent = Agent(
    f'groq:{MAIN_MODEL}',
    deps_type=ChurningDependencies,
    result_type=ChurningAnalysis,
    system_prompt="""You are an expert credit card and bank account churning analyst.
Your task is to analyze Reddit threads about churning and extract valuable opportunities.
Focus on specific, actionable insights and recent trends.

For each opportunity you find, you must provide:
- A unique id (format: 'opp_[timestamp]_[sequence]')
- An accurate title summarizing the opportunity
- The type (either 'credit_card' or 'bank_account')
- Estimated value in USD (e.g. '$500', '$1,250')
- Bank or issuer name
- Clear description
- List of specific requirements
- Source (always 'reddit' for Reddit content)
- Source link (the Reddit thread URL)
- Posted date (in YYYY-MM-DD format)
- Expiration date if mentioned (in YYYY-MM-DD format)
- Confidence score (between 0 and 1)

For credit card opportunities, also include:
- Signup bonus details
- Spend requirements
- Annual fee
- Category bonuses
- Key benefits

For bank account opportunities, also include:
- Account type
- Bonus amount
- Direct deposit requirements
- Minimum balance requirements
- Monthly fees
- Whether fees are avoidable

Provide a summary with:
- Overview of key opportunities
- Total number of opportunities
- Total estimated value
- Average risk level

And a risk assessment with:
- Overall risk analysis
- Overall risk level (1-10 scale)

Be precise with numbers, requirements, and timeframes.
Only include high-confidence opportunities with clear terms."""
)

@churning_agent.tool
async def analyze_churning_content(ctx: RunContext[ChurningDependencies]) -> ChurningAnalysis:
    """Analyze churning content and extract opportunities."""
    content = ctx.deps.content
    formatted_content = f"{content.thread_title}\n\n{content.thread_content}\n\n" + \
                      "\n".join(content.comments)
    
    # The agent will process this content and return structured opportunities
    # The format will exactly match what the frontend expects
    return ChurningAnalysis(
        opportunities=[],  # Will be populated by the AI model
        summary={
            "overview": "",
            "total_opportunities": 0,
            "total_value": 0.0,
            "average_risk": 0.0
        },
        risk_assessment={
            "overview": "",
            "overall_risk_level": 0.0
        }
    )

async def wait_for_rate_limit():
    """Ensure we don't exceed rate limits"""
    global last_request_time
    current_time = time.time()
    time_since_last_request = current_time - last_request_time
    
    if time_since_last_request < MIN_REQUEST_INTERVAL:
        wait_time = MIN_REQUEST_INTERVAL - time_since_last_request
        logger.info(f"Rate limiting: waiting {wait_time:.2f} seconds")
        await asyncio.sleep(wait_time)
    
    last_request_time = time.time()

async def analyze_content(content: RedditContent) -> ChurningAnalysis:
    """Main function to analyze churning content"""
    try:
        await wait_for_rate_limit()
        
        deps = ChurningDependencies(content=content)
        result = await churning_agent.run(
            "Please analyze this churning content and extract all valuable opportunities. " +
            "Format each opportunity exactly as specified, with all required fields.",
            deps=deps
        )
        
        if not isinstance(result.data, ChurningAnalysis):
            raise ValueError("Unexpected response format from model")
            
        return result.data
            
    except Exception as e:
        logger.error(f"Error analyzing content: {e}")
        raise