from typing import List, Dict, Optional
from datetime import datetime, timedelta
import statistics
import logging
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
import asyncio

logger = logging.getLogger(__name__)

from app.agents.churning_agent import churning_agent, ChurningDependencies
from app.models.churning import RedditContent, ChurningAnalysis

class ChurningEvals:
    def __init__(self):
        self.scoring_weights = {
            "value_accuracy": 0.3,        # Correct bonus amount
            "requirements_match": 0.3,     # Accurate requirements
            "expiration_accuracy": 0.2,    # Correct expiration dates
            "metadata_completeness": 0.2   # Complete metadata fields
        }
        
        # Load known good opportunities for validation
        self.known_opportunities = self._load_known_opportunities()
    
    def _load_known_opportunities(self) -> List[Dict]:
        """Load verified opportunities from our database for comparison."""
        # TODO: Replace with actual database query
        return []
    
    async def evaluate_opportunity_detection(self, content: RedditContent) -> Dict:
        """Evaluate the accuracy of opportunity detection."""
        # Run the analysis
        deps = ChurningDependencies(content=content)
        result = await churning_agent.run(
            "Analyze this content for churning opportunities.",
            deps=deps
        )
        
        if not isinstance(result.data, ChurningAnalysis):
            raise ValueError("Invalid analysis result")
        
        # Compare against known opportunities
        scores = []
        for detected_opp in result.data.opportunities:
            best_match_score = 0
            for known_opp in self.known_opportunities:
                score = self._calculate_match_score(detected_opp, known_opp)
                best_match_score = max(best_match_score, score)
            scores.append(best_match_score)
        
        # Calculate overall metrics
        avg_score = statistics.mean(scores) if scores else 0.0
        precision = len([s for s in scores if s > 0.8]) / len(scores) if scores else 0.0
        recall = len([s for s in scores if s > 0.8]) / len(self.known_opportunities) if self.known_opportunities else 0.0
        
        return {
            "average_score": avg_score,
            "precision": precision,
            "recall": recall,
            "total_opportunities": len(result.data.opportunities),
            "valid_opportunities": len([s for s in scores if s > 0.8])
        }
    
    def _calculate_match_score(self, detected: Dict, known: Dict) -> float:
        """Calculate how well a detected opportunity matches a known one."""
        score = 0.0
        
        # Value accuracy (exact match with some tolerance)
        try:
            detected_value = float(detected["value"].replace("$", "").replace(",", ""))
            known_value = float(known["value"].replace("$", "").replace(",", ""))
            value_diff = abs(detected_value - known_value)
            value_score = 1.0 if value_diff == 0 else max(0, 1 - (value_diff / known_value))
            score += self.scoring_weights["value_accuracy"] * value_score
        except:
            pass
        
        # Requirements match
        req_matches = sum(1 for r in detected["requirements"] if any(r.lower() in kr.lower() for kr in known["requirements"]))
        req_score = req_matches / max(len(detected["requirements"]), len(known["requirements"]))
        score += self.scoring_weights["requirements_match"] * req_score
        
        # Expiration accuracy
        if detected.get("expiration_date") and known.get("expiration_date"):
            try:
                detected_date = datetime.fromisoformat(detected["expiration_date"])
                known_date = datetime.fromisoformat(known["expiration_date"])
                date_diff = abs((detected_date - known_date).days)
                date_score = 1.0 if date_diff == 0 else max(0, 1 - (date_diff / 30))  # 30 days tolerance
                score += self.scoring_weights["expiration_accuracy"] * date_score
            except:
                pass
        
        # Metadata completeness
        required_metadata = {
            "credit_card": ["signup_bonus", "spend_requirement", "annual_fee"],
            "bank_account": ["account_type", "direct_deposit_required", "minimum_balance"]
        }
        
        opp_type = detected.get("type")
        if opp_type in required_metadata:
            metadata = detected.get("metadata", {})
            fields_present = sum(1 for field in required_metadata[opp_type] if field in metadata)
            metadata_score = fields_present / len(required_metadata[opp_type])
            score += self.scoring_weights["metadata_completeness"] * metadata_score
        
        return score

    async def run_continuous_eval(self, hours: int = 24):
        """Run continuous evaluation over a period of time."""
        start_time = datetime.now()
        end_time = start_time + timedelta(hours=hours)
        
        results = []
        while datetime.now() < end_time:
            # Get recent content for evaluation
            content = await self._get_recent_content()
            
            # Run evaluation
            eval_result = await self.evaluate_opportunity_detection(content)
            results.append(eval_result)
            
            # Log results
            avg_score = statistics.mean([r["average_score"] for r in results])
            avg_precision = statistics.mean([r["precision"] for r in results])
            avg_recall = statistics.mean([r["recall"] for r in results])
            
            print(f"Current Performance Metrics:")
            print(f"Average Score: {avg_score:.2f}")
            print(f"Average Precision: {avg_precision:.2f}")
            print(f"Average Recall: {avg_recall:.2f}")
            
            # Save results for analysis
            self._save_eval_results(results)
            
            # Wait before next evaluation
            await asyncio.sleep(3600)  # Wait 1 hour
    
    async def _get_recent_content(self) -> RedditContent:
        """Get recent content for evaluation."""
        # TODO: Implement fetching recent content
        pass
    
    def _save_eval_results(self, results: List[Dict]):
        """Save evaluation results for analysis."""
        # TODO: Implement saving results
        pass 