from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
import logging

logger = logging.getLogger(__name__)

class ValidationResult(BaseModel):
    is_valid: bool
    confidence: float
    validation_sources: List[str]
    enriched_data: Dict
    warnings: List[str] = []
    action_items: List[str] = []

class ValidationDependencies:
    opportunity: Dict
    historical_data: Optional[List[Dict]] = None

validation_agent = Agent(
    'groq:llama-3.1-70b-versatile',
    deps_type=ValidationDependencies,
    result_type=ValidationResult,
    system_prompt="""You are an expert in validating and enriching churning opportunities.
Your task is to verify the accuracy of opportunity details and add valuable context.

For each opportunity, verify:
1. Bonus amount accuracy
2. Requirement completeness
3. Timeline feasibility
4. Historical context
5. Risk factors

Add enrichment data:
1. Historical comparison
2. Success strategies
3. Known pitfalls
4. Alternative methods
5. Optimization tips

Flag any inconsistencies, missing information, or potential risks.
Provide specific action items for users to verify or optimize the opportunity."""
)

class OpportunityValidator:
    def __init__(self):
        self.required_fields = {
            "credit_card": [
                "signup_bonus",
                "spend_requirement",
                "annual_fee",
                "expiration_date"
            ],
            "bank_account": [
                "bonus_amount",
                "direct_deposit_required",
                "minimum_balance",
                "account_type"
            ]
        }
        
        self.warning_patterns = {
            "high_risk": [
                "multiple reports of denial",
                "recent negative changes",
                "unusual requirements",
                "inconsistent data points"
            ],
            "time_sensitive": [
                "expires soon",
                "limited time",
                "few spots remaining",
                "targeted offer"
            ],
            "verification_needed": [
                "unconfirmed details",
                "conflicting reports",
                "missing key information",
                "unusual terms"
            ]
        }
    
    async def validate_opportunity(self, opportunity: Dict, historical_data: Optional[List[Dict]] = None) -> ValidationResult:
        """Validate and enrich an opportunity."""
        try:
            deps = ValidationDependencies(
                opportunity=opportunity,
                historical_data=historical_data
            )
            
            result = await validation_agent.run(
                "Please validate this churning opportunity and provide enrichment data.",
                deps=deps
            )
            
            if not isinstance(result.data, ValidationResult):
                raise ValueError("Invalid validation result")
            
            # Enhance validation with additional checks
            enhanced_result = self._enhance_validation(result.data, opportunity)
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Error in opportunity validation: {e}")
            raise
    
    def _enhance_validation(self, result: ValidationResult, opportunity: Dict) -> ValidationResult:
        """Enhance validation result with additional checks."""
        # Check required fields
        opp_type = opportunity.get("type")
        if opp_type in self.required_fields:
            missing_fields = []
            for field in self.required_fields[opp_type]:
                if field not in opportunity.get("metadata", {}):
                    missing_fields.append(field)
            
            if missing_fields:
                result.warnings.append(f"Missing required fields: {', '.join(missing_fields)}")
                result.action_items.append(f"Verify and add missing {opp_type} details: {', '.join(missing_fields)}")
        
        # Check for warning patterns
        for category, patterns in self.warning_patterns.items():
            for pattern in patterns:
                if any(pattern.lower() in str(v).lower() for v in opportunity.values()):
                    result.warnings.append(f"{category.replace('_', ' ').title()}: {pattern}")
        
        # Validate value ranges
        try:
            value = float(opportunity["value"].replace("$", "").replace(",", ""))
            if value > 5000:  # Unusually high bonus
                result.warnings.append("Unusually high bonus amount - verify accuracy")
            elif value < 100:  # Unusually low bonus
                result.warnings.append("Low bonus amount - consider opportunity cost")
        except:
            result.warnings.append("Could not validate bonus amount")
        
        # Validate dates
        if opportunity.get("expiration_date"):
            try:
                exp_date = datetime.fromisoformat(opportunity["expiration_date"])
                if exp_date < datetime.now():
                    result.warnings.append("Opportunity may have expired")
                elif (exp_date - datetime.now()).days < 7:
                    result.warnings.append("Opportunity expires soon")
            except:
                result.warnings.append("Invalid expiration date format")
        
        return result
    
    async def batch_validate(self, opportunities: List[Dict]) -> Dict[str, ValidationResult]:
        """Validate multiple opportunities in batch."""
        results = {}
        
        for opp in opportunities:
            opp_key = f"{opp['bank']}_{opp['title']}"
            result = await self.validate_opportunity(opp)
            results[opp_key] = result
        
        return results
    
    def generate_validation_summary(self, results: Dict[str, ValidationResult]) -> Dict:
        """Generate a summary of validation results."""
        summary = {
            "total_opportunities": len(results),
            "valid_opportunities": sum(1 for r in results.values() if r.is_valid),
            "high_confidence": sum(1 for r in results.values() if r.confidence > 0.8),
            "warnings": sum(len(r.warnings) for r in results.values()),
            "action_items": sum(len(r.action_items) for r in results.values()),
            "categories": {
                "high_risk": sum(1 for r in results.values() if any("high risk" in w.lower() for w in r.warnings)),
                "time_sensitive": sum(1 for r in results.values() if any("expires" in w.lower() for w in r.warnings)),
                "needs_verification": sum(1 for r in results.values() if any("verify" in a.lower() for a in r.action_items))
            }
        }
        
        return summary 