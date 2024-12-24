from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class RedditComment(BaseModel):
    """Model for a Reddit comment."""
    id: str
    body: str
    author: str
    created_utc: float

class RedditContent(BaseModel):
    """Model for Reddit content to be analyzed."""
    thread_id: str
    title: str
    content: str
    comments: List[Dict[str, Any]]  # Changed to accept raw comment dictionaries
    created_utc: float

class OpportunityMetadata(BaseModel):
    """Model for opportunity metadata matching frontend schema."""
    signupBonus: Optional[str] = None
    spendRequirement: Optional[str] = None
    annualFee: Optional[str] = None
    categoryBonuses: Optional[Dict[str, str]] = None
    benefits: Optional[List[str]] = None
    accountType: Optional[str] = None
    bonusAmount: Optional[str] = None
    directDepositRequired: Optional[bool] = None
    minimumBalance: Optional[str] = None
    monthlyFees: Optional[str] = None
    avoidableFees: Optional[bool] = None

class BaseOpportunity(BaseModel):
    """Base model for churning opportunities."""
    title: str
    type: str  # "credit_card" or "bank_account"
    value: float  # Changed from str to float
    bank: str
    description: str
    requirements: List[str]
    source: str = "reddit"
    sourceLink: str
    postedDate: Optional[datetime] = None
    expirationDate: Optional[datetime] = None
    confidence: float
    status: str = "active"
    metadata: Optional[Dict[str, Any]] = None

class ChurningAnalysis(BaseModel):
    """Model for churning analysis results."""
    opportunities: List[BaseOpportunity] 