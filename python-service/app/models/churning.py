from typing import List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class RedditContent(BaseModel):
    thread_title: str
    thread_content: str
    comments: List[str]

class BaseOpportunity(BaseModel):
    id: str = Field(description="Unique identifier for the opportunity")
    title: str = Field(description="Title of the opportunity")
    type: Literal["credit_card", "bank_account"] = Field(description="Type of opportunity")
    value: str = Field(description="Estimated value of the opportunity")
    bank: str = Field(description="Name of the bank or card issuer")
    description: str = Field(description="Detailed description of the opportunity")
    requirements: List[str] = Field(description="List of requirements to qualify")
    source: Literal["reddit", "doc"] = Field(description="Source of the opportunity")
    source_link: str = Field(description="Link to the source")
    posted_date: str = Field(description="Date when the opportunity was posted")
    expiration_date: str = Field(description="Expiration date of the opportunity")
    confidence: float = Field(description="Confidence score of the AI analysis", ge=0, le=1)
    status: str = Field(default="active", description="Status of the opportunity")

class CreditCardOpportunity(BaseOpportunity):
    type: Literal["credit_card"] = "credit_card"
    signup_bonus: str = Field(description="Signup bonus details")
    spend_requirement: str = Field(description="Spending requirement details")
    annual_fee: str = Field(description="Annual fee amount")
    category_bonuses: Dict[str, str] = Field(default_factory=dict, description="Category spending bonuses")
    benefits: List[str] = Field(default_factory=list, description="Card benefits")

class BankAccountOpportunity(BaseOpportunity):
    type: Literal["bank_account"] = "bank_account"
    account_type: str = Field(description="Type of bank account")
    bonus_amount: str = Field(description="Bonus amount")
    direct_deposit_required: bool = Field(description="Whether direct deposit is required")
    minimum_balance: str = Field(description="Minimum balance requirement")
    monthly_fees: str = Field(description="Monthly fees")
    avoidable_fees: bool = Field(description="Whether fees can be avoided")

class ChurningAnalysis(BaseModel):
    opportunities: List[BaseOpportunity] = Field(description="List of churning opportunities")
    summary: Dict[str, Any] = Field(description="Summary of opportunities")
    risk_assessment: Dict[str, Any] = Field(description="Risk assessment of opportunities") 