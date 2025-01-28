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
    original_id?: string;
    timing?: {
      bonus_posting_time: string;
    } | null;
    availability?: {
      is_nationwide: boolean;
      regions?: string[];
    } | null;
    credit?: {
      inquiry: string;
    } | null;
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
      minimum_deposit?: number | null;
    }[];
    tiers?:
      | {
          reward: string;
          deposit: string;
          level?: string | null;
          value?: number | null;
          minimum_deposit?: number | null;
          requirements?: string | null;
        }[]
      | null;
    additional_info?: string | null;
  };
  details?: {
    monthly_fees?: {
      amount: string;
      waiver_details?: string | null;
    } | null;
    annual_fees?: {
      amount: string;
      waived_first_year: boolean;
    } | null;
    account_type?: string | null;
    account_category?: string | null;
    availability?: {
      type: string;
      states?: string[];
      is_nationwide?: boolean;
    } | null;
    credit_inquiry?: string | null;
    expiration?: string | null;
    credit_score?: string | null;
    under_5_24?: {
      required: boolean;
      details: string;
    } | null;
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    } | null;
    minimum_credit_limit?: string | null;
    rewards_structure?: {
      base_rewards?: string;
      bonus_categories?: {
        category: string;
        rate: string;
      }[];
      welcome_bonus?: string;
    } | null;
    household_limit?: string | null;
    early_closure_fee?: string | null;
    chex_systems?: string | null;
    options_trading?: string | null;
    ira_accounts?: string | null;
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
