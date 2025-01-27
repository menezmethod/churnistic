export interface Opportunity {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  bank: string;
  value: number;
  status: 'staged' | 'pending' | 'approved' | 'rejected';
  source: {
    name: string;
    collected_at: string;
  };
  source_id?: string;
  bonus: {
    title: string;
    value: number;
    description?: string;
    requirements: {
      type: string;
      details: {
        amount: number;
        period: number;
      };
    }[];
    tiers?:
      | {
          reward: string;
          deposit: string;
        }[]
      | null;
  };
  details?: {
    monthly_fees?: {
      amount: string;
    } | null;
    annual_fees?: string | null;
    account_type?: string | null;
    availability?: {
      type: string;
      states?: string[];
    } | null;
    credit_inquiry?: string | null;
    expiration?: string | null;
    trading_requirements?: {
      min_trades?: number;
      period_days?: number;
      eligible_securities?: string[];
    } | null;
    platform_features?: {
      mobile_app?: boolean;
      research_tools?: boolean;
      paper_trading?: boolean;
      fractional_shares?: boolean;
    } | null;
  };
  logo?: {
    type: string;
    url: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  } | null;
  processing_status: {
    source_validation: boolean;
    ai_processed: boolean;
    duplicate_checked: boolean;
    needs_review: boolean;
  };
  ai_insights: {
    confidence_score: number;
    validation_warnings: string[];
    potential_duplicates: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}
