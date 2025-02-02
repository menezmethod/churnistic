export type RequirementType =
  | 'spending'
  | 'direct_deposit'
  | 'debit_transactions'
  | 'deposit'
  | 'account_closure'
  | 'link_account'
  | 'minimum_deposit'
  | 'minimum_balance';

export interface Requirement {
  type: RequirementType;
  title: string;
  description: string;
  details: {
    amount: number;
    period: number;
    count?: number;
    hold_period?: number;
  };
}

export interface BonusTier {
  reward: string;
  deposit: string;
  level?: string | null;
  value?: number | null;
  minimum_deposit?: number | null;
  requirements?: string | null;
}

export interface Bonus {
  title: string;
  description: string;
  value: number;
  requirements: Requirement[];
  tiers: BonusTier[] | null;
  additional_info: string | null;
}

export interface MonthlyFees {
  amount: string;
  waiver_details?: string | null;
}

export interface AnnualFees {
  amount: string;
  waived_first_year: boolean;
}

export interface ForeignTransactionFees {
  percentage: string;
  waived: boolean;
}

export interface Availability {
  type: string;
  states?: string[] | null;
  details?: string | null;
  is_nationwide?: boolean;
}

export interface RewardsStructure {
  base_rewards: string;
  bonus_categories?: Array<{
    category: string;
    rate: string;
    limit?: string;
  }>;
  welcome_bonus?: string;
  card_perks?: string;
  cash_back?: string;
  points_multiplier?: string;
  statement_credits?: string;
}

export interface Details {
  monthly_fees: MonthlyFees | null;
  annual_fees: AnnualFees | null;
  account_type: string | null;
  account_category?: string | null;
  availability: Availability | null;
  credit_inquiry: string | null;
  expiration: string | null;
  credit_score?: string | null;
  under_5_24?: boolean | null;
  foreign_transaction_fees: ForeignTransactionFees | null;
  minimum_credit_limit?: string | null;
  rewards_structure: RewardsStructure | null;
  household_limit: string | null;
  early_closure_fee: string | null;
  chex_systems: string | null;
  options_trading: string | null;
  ira_accounts: string | null;
  minimum_deposit?: string | null;
  holding_period?: string | null;
  trading_requirements?: string | null;
  platform_features?: Array<{
    name: string;
    description: string;
  }> | null;
}

export interface CardImage {
  url: string;
  network?: string;
  color?: string;
  badge?: string | null;
}

export interface Logo {
  type: string;
  url: string;
}

export interface Source {
  name: string;
  collected_at: string;
  original_id: string;
  timing: {
    bonus_posting_time?: string;
  } | null;
  availability: {
    is_nationwide: boolean;
    regions?: string[];
  } | null;
  credit: {
    inquiry: string;
  } | null;
}

export interface ProcessingStatus {
  source_validation: boolean;
  ai_processed: boolean;
  duplicate_checked: boolean;
  needs_review: boolean;
}

export interface AIInsights {
  confidence_score: number;
  validation_warnings: string[];
  potential_duplicates: string[];
}

export interface Metadata {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  status: 'active' | 'expired' | 'staged';
  environment: string;
}

export interface Opportunity {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  bank: string;
  value: number;
  status: 'pending' | 'approved' | 'rejected' | 'staged';
  metadata: Metadata;
  source: Source;
  source_id: string;
  bonus: Bonus;
  details: Details;
  logo: Logo;
  card_image: CardImage | null;
  offer_link: string;
  description: string;
  processing_status: ProcessingStatus;
  ai_insights: AIInsights;
  createdAt: string;
  updatedAt: string;
}

// BankRewards API Types
export interface BankRewardsOffer {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  value: number;
  bonus: {
    title: string;
    description: string;
    requirements: {
      title: string;
      description: string;
      spending_requirement?: {
        amount: number;
        timeframe: string;
      };
      minimum_deposit?: number;
    };
    tiers?: {
      reward: string;
      deposit: string;
      level?: string;
      value?: number;
      minimum_deposit?: number;
      requirements?: string;
    }[];
    additional_info?: string;
  };
  details: {
    monthly_fees?: {
      amount: string;
      waiver_details?: string;
    };
    annual_fees?: {
      amount: string;
      waived_first_year: boolean;
    };
    account_type?: string;
    account_category?: string;
    availability?: {
      type: string;
      states?: string[];
      is_nationwide?: boolean;
      details?: string;
    };
    credit_inquiry?: string;
    expiration?: string;
    credit_score?: string;
    under_5_24?: boolean;
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    };
    minimum_credit_limit?: string;
    rewards_structure?: {
      base_rewards: string;
      bonus_categories: Array<{
        category: string;
        rate: string;
        limit?: string;
      }>;
      welcome_bonus?: string;
      card_perks?: string;
      cash_back?: string;
      points_multiplier?: string;
      statement_credits?: string;
    };
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    options_trading?: string;
    ira_accounts?: string;
    minimum_deposit?: string;
    holding_period?: string;
    trading_requirements?: string;
    platform_features?: Array<{
      name: string;
      description: string;
    }>;
  };
  metadata?: {
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    status?: 'active' | 'expired' | 'staged';
    timing?: {
      bonus_posting_time: string;
    };
    availability?: {
      is_nationwide: boolean;
      regions?: string[];
    };
    credit?: {
      inquiry: string;
    };
    source?: {
      original_id: string;
      name?: string;
    };
  };
  logo: {
    type: string;
    url: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  };
  offer_link: string;
  description?: string;
}

export interface BankRewardsResponse {
  data: {
    stats: {
      total: number;
      active: number;
      expired: number;
    };
    offers: BankRewardsOffer[];
  };
}
