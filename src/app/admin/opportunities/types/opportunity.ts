export interface RequirementDetails {
  amount: number;
  period: number;
  count?: number;
  hold_period?: number;
}

export type RequirementType =
  | 'spending'
  | 'direct_deposit'
  | 'deposit'
  | 'hold'
  | 'debit_transactions'
  | 'account_closure'
  | 'link_account';

export interface Requirement {
  type: RequirementType;
  details: RequirementDetails;
  description: string;
  title: string;
}

export interface BonusTier {
  reward: string;
  deposit: string;
  level: string | null;
  value: number | null;
  minimum_deposit: number | null;
  requirements: string | null;
}

export interface Bonus {
  title: string;
  value: number;
  description: string;
  requirements: Requirement[];
  tiers?: BonusTier[] | null;
  additional_info?: string | null;
}

export interface Opportunity {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  bank: string;
  value: number;
  status: 'staged' | 'pending' | 'approved' | 'rejected';
  metadata: {
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    status?: string;
    environment?: string;
  };
  source: {
    name: string;
    collected_at: string;
    original_id: string;
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
  source_id: string;
  bonus: Bonus;
  details: {
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
      states: string[];
      is_nationwide: boolean;
    } | null;
    credit_inquiry?: string | null;
    expiration?: string | null;
    credit_score?: string | null;
    under_5_24?: boolean | null;
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    } | null;
    minimum_credit_limit?: string | null;
    rewards_structure?: {
      base_rewards: string;
      bonus_categories: Array<{
        category: string;
        rate: string;
      }>;
      welcome_bonus: string;
    } | null;
    household_limit?: string | null;
    early_closure_fee?: string | null;
    chex_systems?: string | null;
    options_trading?: string | null;
    ira_accounts?: string | null;
  };
  logo: {
    type: string;
    url: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string | null;
  } | null;
  offer_link: string;
  description?: string;
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
  createdAt: string;
  updatedAt: string;
}
