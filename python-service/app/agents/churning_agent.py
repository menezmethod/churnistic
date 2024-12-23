from dataclasses import dataclass
from typing import List, Dict, Any
import os
import logging
import asyncio
import time
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Model configuration
MAIN_MODEL = 'llama-3.1-70b-versatile'

# Rate limiting configuration
REQUESTS_PER_MINUTE = 30
MIN_REQUEST_INTERVAL = 60.0 / REQUESTS_PER_MINUTE  # Minimum time between requests in seconds
last_request_time = 0.0

class RedditContent(BaseModel):
    thread_title: str
    thread_content: str
    comments: List[str]

class ChurningOpportunity(BaseModel):
    id: str = Field(description="Unique identifier for the opportunity")
    type: str = Field(description="Type of opportunity (credit card or bank account)")
    title: str = Field(description="Name of the opportunity")
    description: str = Field(description="Brief description of the opportunity")
    value: str = Field(description="Value of the opportunity")
    status: str = Field(default="active", description="Status of the opportunity")
    card_name: str | None = Field(None, description="Name of the credit card")
    bank_name: str | None = Field(None, description="Name of the bank")
    signup_bonus: str | None = Field(None, description="Signup bonus amount for credit cards")
    bonus_amount: str | None = Field(None, description="Bonus amount for bank accounts")
    requirements: List[str] = Field(default_factory=list, description="List of requirements")
    risk_level: float = Field(description="Risk level from 1-10")
    time_limit: str | None = Field(None, description="Time limit for the opportunity")
    expiration: str = Field(default="", description="Expiration date")
    source: str = Field(default="reddit", description="Source of the opportunity")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "example-1",
                "type": "credit card",
                "title": "Example Card",
                "description": "Example bonus offer",
                "value": "$500",
                "status": "active",
                "card_name": "Example Card",
                "signup_bonus": "50,000 points",
                "requirements": ["Example requirement"],
                "risk_level": 5.0,
                "expiration": "2024-12-31"
            }
        }

class ChurningSummary(BaseModel):
    overview: str = Field(description="Overview of key opportunities")
    total_opportunities: int = Field(description="Total number of opportunities")
    total_value: float = Field(description="Total value estimate")
    average_risk: float = Field(description="Average risk level")

    class Config:
        json_schema_extra = {
            "example": {
                "overview": "Several valuable opportunities found",
                "total_opportunities": 1,
                "total_value": 500.0,
                "average_risk": 5.0
            }
        }

class RiskAssessment(BaseModel):
    overview: str = Field(description="Overall risk analysis")
    overall_risk_level: float = Field(description="Overall risk level")

    class Config:
        json_schema_extra = {
            "example": {
                "overview": "Moderate risk level overall",
                "overall_risk_level": 5.0
            }
        }

class ChurningAnalysis(BaseModel):
    opportunities: List[ChurningOpportunity] = Field(description="List of churning opportunities")
    summary: dict = Field(description="Summary of opportunities")
    risk_assessment: dict = Field(description="Risk assessment of opportunities")

    class Config:
        json_schema_extra = {
            "example": {
                "opportunities": [{
                    "id": "example-1",
                    "type": "credit card",
                    "title": "Example Card",
                    "description": "Example bonus offer",
                    "value": "$500",
                    "status": "active",
                    "card_name": "Example Card",
                    "signup_bonus": "50,000 points",
                    "requirements": ["Example requirement"],
                    "risk_level": 5.0,
                    "expiration": "2024-12-31"
                }],
                "summary": {
                    "overview": "Several valuable opportunities found",
                    "total_opportunities": 1,
                    "total_value": 500.0,
                    "average_risk": 5.0
                },
                "risk_assessment": {
                    "overview": "Moderate risk level overall",
                    "overall_risk_level": 5.0
                }
            }
        }

@dataclass
class ChurningDependencies:
    content: RedditContent

# Initialize the agent with the main model
churning_agent = Agent(
    f'groq:{MAIN_MODEL}',
    deps_type=ChurningDependencies,
    result_type=ChurningAnalysis,
    system_prompt="""You are an expert credit card and bank account churning analyst.
Your task is to analyze Reddit threads about churning and extract valuable opportunities.
Focus on specific, actionable insights and recent trends.
Be precise with numbers, requirements, and timeframes.
Always consider risk levels and provide clear, structured information.

For each opportunity, provide:
- type: credit card or bank account
- title: name of opportunity
- description: brief description
- card_name or bank_name: name of the card or bank
- signup_bonus or bonus_amount: amount of the bonus
- requirements: list of requirements
- risk_level: number from 1-10
- time_limit: time limit if any
- expiration: expiration date if any

Also provide a summary with:
- overview: overview of key opportunities
- total_opportunities: count of opportunities
- total_value: total value estimate
- average_risk: average risk level

And a risk assessment with:
- overview: overall risk analysis
- overall_risk_level: overall risk level from 1-10"""
)

@churning_agent.tool
async def analyze_churning_content(ctx: RunContext[ChurningDependencies]) -> ChurningAnalysis:
    """Analyze churning content and extract opportunities.
    
    Returns:
        ChurningAnalysis with:
        - opportunities: List of churning opportunities (each with id, type, title, description, value, status)
        - summary: Overview of opportunities
        - risk_assessment: Risk assessment details
    """
    content = ctx.deps.content
    formatted_content = f"{content.thread_title}\n\n{content.thread_content}\n\n" + \
                      "\n".join(content.comments)
    
    # Create a sample opportunity to show the expected format
    sample_opp = ChurningOpportunity(
        id="example-1",
        type="credit card",
        title="Example Card",
        description="Example bonus offer",
        value="$500",
        status="active",
        card_name="Example Card",
        signup_bonus="50,000 points",
        requirements=["Example requirement"],
        risk_level=5.0,
        expiration="2024-12-31"
    )
    
    # Create summary and risk assessment as dicts
    summary = {
        "overview": "Several valuable opportunities found",
        "total_opportunities": 1,
        "total_value": 500.0,
        "average_risk": 5.0
    }
    
    risk_assessment = {
        "overview": "Moderate risk level overall",
        "overall_risk_level": 5.0
    }
    
    return ChurningAnalysis(
        opportunities=[sample_opp],
        summary=summary,
        risk_assessment=risk_assessment
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
        # Wait for rate limit
        await wait_for_rate_limit()
        
        # Get analysis from model using the tool
        deps = ChurningDependencies(content=content)
        result = await churning_agent.run(
            "Please analyze this churning content and extract all valuable opportunities. " +
            "Return the analysis in the specified format with opportunities, summary, and risk assessment.",
            deps=deps
        )
        
        if not isinstance(result.data, ChurningAnalysis):
            raise ValueError("Unexpected response format from model")
            
        return result.data
            
    except Exception as e:
        logger.error(f"Error analyzing content: {e}")
        raise