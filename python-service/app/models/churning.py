from typing import List, Dict, Any
from pydantic import BaseModel

class RedditContent(BaseModel):
    thread_title: str
    thread_content: str
    comments: List[str]

class Opportunity(BaseModel):
    id: str
    type: str
    title: str
    description: str
    value: str
    requirements: List[str]
    expiration: str
    risk_level: int
    status: str
    source: str

class CreditCardOpportunity(Opportunity):
    issuer: str
    card_name: str
    signup_bonus: str
    spend_requirement: str
    time_limit: str
    category_bonuses: Dict[str, str]
    annual_fee: str
    benefits: List[str]

class BankAccountOpportunity(Opportunity):
    bank_name: str
    account_type: str
    bonus_amount: str
    direct_deposit_required: bool
    minimum_balance: str
    monthly_fees: str
    avoidable_fees: bool

class ChurningAnalysis(BaseModel):
    opportunities: List[Opportunity]
    summary: Dict[str, Any]
    risk_assessment: Dict[str, Any] 