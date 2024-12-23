from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import statistics
import logging
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

logger = logging.getLogger(__name__)

class PatternMetadata(BaseModel):
    bank: str
    offer_type: str
    typical_value: float
    historical_high: float
    cycle_length: Optional[int] = None  # Days between offer cycles
    seasonal_pattern: Optional[str] = None  # e.g., "Q4 heavy", "Summer peaks"
    success_factors: List[str] = []
    risk_factors: List[str] = []

class PatternAnalysis(BaseModel):
    patterns: List[PatternMetadata]
    insights: List[str]
    recommendations: List[str]

@dataclass
class PatternDependencies:
    opportunities: List[Dict]
    timeframe_days: int

pattern_agent = Agent(
    'groq:llama-3.1-70b-versatile',
    deps_type=PatternDependencies,
    result_type=PatternAnalysis,
    system_prompt="""You are an expert in analyzing churning patterns and historical data.
Your task is to identify patterns, cycles, and trends in churning opportunities.

For each financial institution, analyze:
1. Typical bonus values and historical highs
2. Offer cycles and seasonality
3. Success and risk factors
4. Application patterns and approval trends

Look for:
- Seasonal patterns (e.g., end of quarter bonuses)
- Cyclical patterns in bonus amounts
- Correlation with market events
- Changes in requirements over time
- Success rate patterns
- Risk factor evolution

Provide specific insights and actionable recommendations."""
)

class PatternDetector:
    def __init__(self):
        self.min_data_points = 5  # Minimum data points needed for pattern detection
        self.confidence_threshold = 0.7  # Minimum confidence for pattern reporting
    
    async def analyze_patterns(self, opportunities: List[Dict], days: int = 90) -> PatternAnalysis:
        """Analyze patterns in churning opportunities."""
        try:
            deps = PatternDependencies(
                opportunities=opportunities,
                timeframe_days=days
            )
            
            result = await pattern_agent.run(
                "Analyze these churning opportunities for patterns and provide insights.",
                deps=deps
            )
            
            if not isinstance(result.data, PatternAnalysis):
                raise ValueError("Invalid pattern analysis result")
            
            # Enhance patterns with additional metadata
            enhanced_patterns = []
            for pattern in result.data.patterns:
                enhanced = self._enhance_pattern(pattern, opportunities)
                if enhanced:
                    enhanced_patterns.append(enhanced)
            
            # Update the analysis with enhanced patterns
            result.data.patterns = enhanced_patterns
            
            return result.data
            
        except Exception as e:
            logger.error(f"Error in pattern analysis: {e}")
            raise
    
    def _enhance_pattern(self, pattern: PatternMetadata, opportunities: List[Dict]) -> Optional[PatternMetadata]:
        """Enhance pattern with additional analysis."""
        # Filter opportunities for this bank/type
        relevant_opps = [
            opp for opp in opportunities
            if opp["bank"].lower() == pattern.bank.lower() and
            opp["type"].lower() == pattern.offer_type.lower()
        ]
        
        if len(relevant_opps) < self.min_data_points:
            return None
        
        # Calculate success metrics
        success_count = sum(1 for opp in relevant_opps if opp.get("metadata", {}).get("success_reports", 0) > 0)
        success_rate = success_count / len(relevant_opps)
        
        # Detect value trends
        values = [float(opp["value"].replace("$", "").replace(",", "")) for opp in relevant_opps]
        avg_value = sum(values) / len(values)
        value_trend = "increasing" if values[-1] > avg_value else "decreasing"
        
        # Analyze requirements changes
        recent_reqs = set(relevant_opps[-1].get("requirements", []))
        old_reqs = set(relevant_opps[0].get("requirements", []))
        req_changes = list(recent_reqs - old_reqs)
        
        # Update pattern metadata
        pattern.success_factors.extend([
            f"Success rate: {success_rate:.1%}",
            f"Value trend: {value_trend}",
            "Recent requirement changes: " + (", ".join(req_changes) if req_changes else "None")
        ])
        
        return pattern
    
    def detect_cycles(self, opportunities: List[Dict]) -> Dict[str, int]:
        """Detect offer cycles for each bank."""
        cycles = {}
        
        # Group opportunities by bank
        bank_opps = {}
        for opp in opportunities:
            bank = opp["bank"]
            if bank not in bank_opps:
                bank_opps[bank] = []
            bank_opps[bank].append(opp)
        
        # Analyze cycles for each bank
        for bank, opps in bank_opps.items():
            if len(opps) < self.min_data_points:
                continue
            
            # Sort by date
            opps.sort(key=lambda x: datetime.fromisoformat(x["posted_date"]))
            
            # Calculate intervals between offers
            intervals = []
            for i in range(1, len(opps)):
                date1 = datetime.fromisoformat(opps[i-1]["posted_date"])
                date2 = datetime.fromisoformat(opps[i]["posted_date"])
                interval = (date2 - date1).days
                intervals.append(interval)
            
            if intervals:
                # Use mode as the most common cycle length
                cycle_length = statistics.mode(intervals)
                cycles[bank] = cycle_length
        
        return cycles
    
    def predict_next_opportunities(self, opportunities: List[Dict]) -> List[Dict]:
        """Predict likely upcoming opportunities based on patterns."""
        predictions = []
        cycles = self.detect_cycles(opportunities)
        
        for bank, cycle_length in cycles.items():
            bank_opps = [opp for opp in opportunities if opp["bank"] == bank]
            if not bank_opps:
                continue
            
            # Get most recent opportunity
            latest_opp = max(bank_opps, key=lambda x: datetime.fromisoformat(x["posted_date"]))
            latest_date = datetime.fromisoformat(latest_opp["posted_date"])
            
            # Predict next occurrence
            next_date = latest_date + timedelta(days=cycle_length)
            
            if next_date > datetime.now():
                predictions.append({
                    "bank": bank,
                    "predicted_date": next_date.isoformat(),
                    "confidence": self._calculate_prediction_confidence(bank_opps, cycle_length),
                    "expected_value": self._predict_value(bank_opps),
                    "base_opportunity": latest_opp
                })
        
        return predictions
    
    def _calculate_prediction_confidence(self, opportunities: List[Dict], cycle_length: int) -> float:
        """Calculate confidence in prediction based on historical consistency."""
        if len(opportunities) < self.min_data_points:
            return 0.0
        
        # Sort by date
        opportunities.sort(key=lambda x: datetime.fromisoformat(x["posted_date"]))
        
        # Calculate how consistently the cycle length appears
        intervals = []
        for i in range(1, len(opportunities)):
            date1 = datetime.fromisoformat(opportunities[i-1]["posted_date"])
            date2 = datetime.fromisoformat(opportunities[i]["posted_date"])
            interval = (date2 - date1).days
            intervals.append(interval)
        
        if not intervals:
            return 0.0
        
        # Calculate how many intervals are close to the cycle length
        matches = sum(1 for interval in intervals if abs(interval - cycle_length) <= 7)  # 7 days tolerance
        confidence = matches / len(intervals)
        
        return confidence
    
    def _predict_value(self, opportunities: List[Dict]) -> str:
        """Predict the value of the next opportunity."""
        if len(opportunities) < self.min_data_points:
            return "unknown"
        
        # Extract values
        values = []
        for opp in opportunities:
            try:
                value = float(opp["value"].replace("$", "").replace(",", ""))
                values.append(value)
            except:
                continue
        
        if not values:
            return "unknown"
        
        # Calculate trend
        avg_value = sum(values) / len(values)
        recent_avg = sum(values[-3:]) / len(values[-3:]) if len(values) >= 3 else avg_value
        
        # Predict next value based on trend
        predicted_value = recent_avg * 1.1 if recent_avg > avg_value else recent_avg
        
        return f"${predicted_value:,.2f}" 