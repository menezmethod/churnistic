export interface ChurningOpportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  value: string;
  status: string;
  card_name?: string;
  bank_name?: string;
  signup_bonus?: string;
  bonus_amount?: string;
  requirements: string[];
  risk_level: number;
  time_limit?: string;
  expiration: string;
  source: string;
}

export interface ChurningSummary {
  overview: string;
  total_opportunities: number;
  total_value: number;
  average_risk: number;
}

export interface RiskAssessmentData {
  overview: string;
  overall_risk_level: number;
} 