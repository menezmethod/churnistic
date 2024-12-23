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
import json

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
    system_prompt="""You are an expert in credit card churning and bank account bonuses. Your task is to analyze Reddit content and identify valuable opportunities.

For each opportunity you find, provide:

1. Basic Information:
   - Title: Clear, concise title describing the opportunity
   - Type: Either 'credit_card' or 'bank_account'
   - Bank: The financial institution offering the bonus
   - Value: The total potential value (in USD)
   - Description: Brief overview of the opportunity
   - Requirements: List of specific requirements to earn the bonus
   - Source: Where this information came from
   - Posted Date: When the information was shared
   - Expiration Date: When the offer expires (if known)

2. Type-Specific Details:
   For Credit Cards:
   - Signup bonus amount and type (points/miles/cashback)
   - Minimum spend requirement and timeframe
   - Annual fee and if it's waived first year
   - Category bonuses or rewards structure
   - Notable benefits or perks
   
   For Bank Accounts:
   - Bonus amount
   - Direct deposit requirements (amount and frequency)
   - Minimum balance requirements
   - Monthly fees and how to avoid them
   - Account type (checking/savings)
   - Early termination fees

3. Confidence Score (0.0 to 1.0):
   Increase confidence for:
   - Multiple recent data points confirming the same terms
   - Official sources or direct links
   - Clear, specific requirements
   - Detailed user experiences
   - Recent successful completions
   
   Decrease confidence for:
   - Single or old data points
   - Ambiguous terms or requirements
   - Conflicting information
   - Missing key details
   - Reports of difficulties

4. Risk Factors:
   - Bank sensitivity to churning
   - Complexity of requirements
   - Time commitment needed
   - Potential issues from user reports
   - Historical success rates

Focus on actionable opportunities with clear terms and requirements. Ignore vague or speculative discussions. Prioritize higher-value opportunities with reasonable requirements.

Respond with a JSON array of opportunities, each following this structure:
{
    "title": string,
    "type": "credit_card" | "bank_account",
    "value": string (e.g., "$500"),
    "bank": string,
    "description": string,
    "requirements": string[],
    "source": string,
    "source_link": string,
    "posted_date": string (ISO date),
    "expiration_date": string (ISO date) | null,
    "confidence": float (0.0 to 1.0),
    "metadata": {
        // For credit cards:
        "signup_bonus": string,
        "spend_requirement": string,
        "annual_fee": string,
        "category_bonuses": object,
        "benefits": string[],
        
        // For bank accounts:
        "account_type": string,
        "bonus_amount": string,
        "direct_deposit_required": boolean,
        "minimum_balance": string,
        "monthly_fees": string,
        "avoidable_fees": boolean
    }
}"""
)

class OpportunityRanker:
    def __init__(self):
        self.weights = {
            "value": 0.35,           # Higher value opportunities rank higher
            "confidence": 0.25,      # Well-verified opportunities rank higher
            "urgency": 0.15,         # Time-sensitive opportunities get boosted
            "sentiment": 0.15,       # Positive experiences boost ranking
            "reliability": 0.10      # Well-documented opportunities rank higher
        }
    
    def calculate_score(self, opportunity: Dict) -> float:
        """Calculate a composite score for ranking opportunities."""
        score = 0.0
        
        # Value score (normalized based on typical bonus ranges)
        try:
            value = float(opportunity["value"].replace("$", "").replace(",", ""))
            value_score = min(value / 1000.0, 1.0)  # Normalize to [0,1], capping at $1000
        except:
            value_score = 0.0
        
        # Get other component scores
        confidence_score = opportunity["confidence"]
        urgency_score = opportunity.get("metadata", {}).get("urgency", 0.0)
        sentiment_score = (opportunity.get("metadata", {}).get("sentiment", 0.0) + 1) / 2  # Convert [-1,1] to [0,1]
        reliability_score = opportunity.get("metadata", {}).get("reliability", 0.0)
        
        # Calculate weighted sum
        score = (
            self.weights["value"] * value_score +
            self.weights["confidence"] * confidence_score +
            self.weights["urgency"] * urgency_score +
            self.weights["sentiment"] * sentiment_score +
            self.weights["reliability"] * reliability_score
        )
        
        # Bonus multipliers for special cases
        if opportunity.get("metadata", {}).get("is_all_time_high", False):
            score *= 1.2  # 20% boost for all-time high offers
        if opportunity.get("metadata", {}).get("easy_requirements", False):
            score *= 1.1  # 10% boost for easy requirements
        
        return score

class OpportunityCache:
    def __init__(self):
        self.opportunities = {}  # key: opportunity signature, value: opportunity details
        self.last_updated = {}  # key: opportunity signature, value: last update timestamp
        self.ttl = 7 * 24 * 60 * 60  # 7 days in seconds
    
    def add_opportunity(self, opportunity: Dict):
        """Add or update an opportunity in the cache."""
        signature = f"{opportunity['bank']}_{opportunity['title']}"
        current_time = time.time()
        
        if signature in self.opportunities:
            # Update existing opportunity
            existing_opp = self.opportunities[signature]
            
            # Merge data points and update confidence
            existing_data_points = existing_opp.get("metadata", {}).get("data_points", [])
            new_data_points = opportunity.get("metadata", {}).get("data_points", [])
            merged_data_points = list(set(existing_data_points + new_data_points))
            
            # Update confidence based on new information
            new_confidence = max(
                existing_opp["confidence"],
                opportunity["confidence"]
            )
            
            # Update the opportunity with merged information
            self.opportunities[signature] = {
                **existing_opp,
                "confidence": new_confidence,
                "metadata": {
                    **existing_opp.get("metadata", {}),
                    "data_points": merged_data_points,
                    "last_confirmed": current_time
                }
            }
        else:
            # Add new opportunity
            self.opportunities[signature] = {
                **opportunity,
                "metadata": {
                    **opportunity.get("metadata", {}),
                    "first_seen": current_time,
                    "last_confirmed": current_time
                }
            }
        
        self.last_updated[signature] = current_time
    
    def get_active_opportunities(self) -> List[Dict]:
        """Get all non-expired opportunities."""
        current_time = time.time()
        active_opps = []
        
        for signature, opp in self.opportunities.items():
            last_update = self.last_updated.get(signature, 0)
            if current_time - last_update <= self.ttl:
                active_opps.append(opp)
            else:
                # Clean up expired opportunities
                del self.opportunities[signature]
                del self.last_updated[signature]
        
        return active_opps
    
    def get_top_opportunities(self, limit: int = 10) -> List[Dict]:
        """Get top opportunities based on ranking."""
        ranker = OpportunityRanker()
        active_opps = self.get_active_opportunities()
        
        # Calculate scores for all opportunities
        scored_opps = [
            (opp, ranker.calculate_score(opp))
            for opp in active_opps
        ]
        
        # Sort by score and return top N
        scored_opps.sort(key=lambda x: x[1], reverse=True)
        return [opp for opp, score in scored_opps[:limit]]

# Initialize global cache
opportunity_cache = OpportunityCache()

@churning_agent.tool
async def analyze_churning_content(ctx: RunContext[ChurningDependencies]) -> ChurningAnalysis:
    """Analyze churning content and extract opportunities with progressive confidence building."""
    content = ctx.deps.content
    
    # Step 1: Extract potential opportunities from thread title and content
    thread_content = f"""
Thread Title: {content.thread_title}
Thread Content: {content.thread_content}
Thread ID: {content.thread_id}
Thread Permalink: {content.thread_permalink}
"""
    
    # Step 2: Group comments by topic/offer using semantic similarity
    comment_groups = {}  # key: topic signature, value: list of related comments
    
    # First, identify key topics in comments
    for comment in content.comments:
        topic_prompt = f"""
Analyze this comment for churning-related topics:
{comment}

Extract:
1. Mentioned financial institutions
2. Specific offer amounts
3. Key terms (e.g., "SUB", "DD", "MSR")
4. Time-sensitive information
5. Success/failure indicators

Return a JSON object with these extracted details.
"""
        topic_result = await ctx.model.complete(topic_prompt)
        
        # Create a topic signature based on extracted details
        topic_sig = f"{topic_result.bank}_{topic_result.offer_amount}"
        
        if topic_sig not in comment_groups:
            comment_groups[topic_sig] = []
        comment_groups[topic_sig].append(comment)
    
    # Merge similar groups using semantic similarity
    merged_groups = {}
    for sig1, comments1 in comment_groups.items():
        should_merge = False
        merge_target = sig1
        
        for sig2, comments2 in merged_groups.items():
            similarity_prompt = f"""
Compare these two groups of comments about churning opportunities:

Group 1: {chr(10).join(comments1[:2])}  # Show first 2 comments as sample
Group 2: {chr(10).join(comments2[:2])}  # Show first 2 comments as sample

Are they discussing the same opportunity? Consider:
1. Same financial institution?
2. Similar bonus amounts?
3. Similar requirements?
4. Same timeframe?

Return true if they are the same opportunity, false otherwise.
"""
            similarity_result = await ctx.model.complete(similarity_prompt)
            
            if similarity_result.are_similar:
                should_merge = True
                merge_target = sig2
                break
        
        if should_merge:
            merged_groups[merge_target].extend(comments1)
        else:
            merged_groups[sig1] = comments1
    
    comment_groups = merged_groups  # Use the merged groups for further analysis
    
    # Step 3: Build opportunity confidence progressively
    opportunities_map = {}  # key: opportunity identifier, value: opportunity details
    
    # First pass: Initial opportunity identification from thread content
    formatted_content = f"{thread_content}\nInitial Analysis - Please identify potential opportunities from the main thread content."
    initial_result = await ctx.model.complete(formatted_content)
    
    # Process initial opportunities
    for opp in initial_result.opportunities:
        key = f"{opp.bank}_{opp.title}"
        opportunities_map[key] = {
            **opp.dict(),
            "confirmation_count": 0,
            "contradiction_count": 0,
            "data_points": [],
            "success_reports": 0,
            "failure_reports": 0
        }
    
    # Second pass: Analyze comment groups to validate and enhance opportunities
    for comment_group in comment_groups.values():
        formatted_comments = "\n".join(comment_group)
        validation_prompt = f"""
Please analyze these comments about a potential opportunity:
{formatted_comments}

For each comment, determine:
1. Does it confirm or contradict any identified opportunities?
2. Does it provide specific data points (dates, amounts, requirements)?
3. Does it report success or failure?
4. Does it add new important details?

Current opportunities being tracked:
{json.dumps([opp['title'] for opp in opportunities_map.values()], indent=2)}
"""
        
        validation_result = await ctx.model.complete(validation_prompt)
        
        # Update opportunity confidence and details based on validation
        for validation in validation_result:
            if validation.opportunity_key in opportunities_map:
                opp = opportunities_map[validation.opportunity_key]
                
                # Update confirmation metrics
                if validation.confirms:
                    opp["confirmation_count"] += 1
                if validation.contradicts:
                    opp["contradiction_count"] += 1
                
                # Add data points
                if validation.data_points:
                    opp["data_points"].extend(validation.data_points)
                
                # Track success/failure reports
                if validation.reports_success:
                    opp["success_reports"] += 1
                if validation.reports_failure:
                    opp["failure_reports"] += 1
                
                # Update confidence score based on all factors
                opp["confidence"] = calculate_confidence(
                    base_confidence=opp["confidence"],
                    confirmation_count=opp["confirmation_count"],
                    contradiction_count=opp["contradiction_count"],
                    data_points_count=len(opp["data_points"]),
                    success_rate=(opp["success_reports"] / (opp["success_reports"] + opp["failure_reports"])) if (opp["success_reports"] + opp["failure_reports"]) > 0 else 0.5
                )
    
    # Final pass: Consolidate and filter opportunities
    final_opportunities = []
    for opp in opportunities_map.values():
        if opp["confidence"] >= 0.4:  # Only include opportunities with reasonable confidence
            # Clean up the opportunity object to match expected format
            final_opp = {
                "title": opp["title"],
                "type": opp["type"],
                "value": opp["value"],
                "bank": opp["bank"],
                "description": opp["description"],
                "requirements": opp["requirements"],
                "source": "reddit",
                "source_id": content.thread_id,
                "source_link": f"https://www.reddit.com{content.thread_permalink}",
                "posted_date": datetime.now().isoformat(),
                "expiration_date": opp.get("expiration_date"),
                "confidence": opp["confidence"],
                "metadata": opp.get("metadata", {})
            }
            final_opportunities.append(final_opp)
    
    # Update opportunity cache with new opportunities
    for opp in final_opportunities:
        opportunity_cache.add_opportunity(opp)
    
    # Get top opportunities from cache
    top_opportunities = opportunity_cache.get_top_opportunities(limit=20)
    
    return ChurningAnalysis(
        opportunities=top_opportunities,  # Return top opportunities instead of just new ones
        summary={
            "overview": generate_summary(top_opportunities),
            "total_opportunities": len(top_opportunities),
            "total_value": sum(float(opp["value"].replace('$', '').replace(',', '')) for opp in top_opportunities),
            "average_risk": sum(1 - opp["confidence"] for opp in top_opportunities) / len(top_opportunities) if top_opportunities else 0.0
        },
        risk_assessment={
            "overview": generate_risk_assessment(top_opportunities),
            "overall_risk_level": calculate_overall_risk(top_opportunities)
        }
    )

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