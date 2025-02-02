export type OfferType = 'credit_card' | 'bank' | 'brokerage';

export const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const;

// This is the exact Firestore structure
export interface FirestoreOpportunity {
  id?: string;
  name: string;
  type: 'credit_card' | 'bank' | 'brokerage';
  offer_link: string;
  value: number;
  bank?: string;
  description?: string;
  title?: string;
  requirements?: string[];
  isNew?: boolean;
  expirationDate?: string;
  source_id: string;
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: string;
    status: 'active' | 'inactive';
    timing?: {
      bonus_posting_time?: string;
    };
    availability?: {
      is_nationwide?: boolean;
      regions?: string[];
    };
    credit?: {
      inquiry?: 'soft_pull' | 'hard_pull';
    };
    source?: {
      name: string;
      original_id: string;
    };
  };
  bonus?: {
    title?: string;
    description?: string;
    requirements?: {
      title?: string;
      description?: string;
      minimum_deposit?: number;
      trading_requirements?: string;
      holding_period?: string;
      spending_requirement?: {
        amount: number;
        timeframe: string;
      };
    };
    additional_info?: string;
    tiers?: Array<{
      reward: string;
      deposit: string;
      level: string;
      value: number;
      minimum_deposit: number;
      requirements: string;
    }>;
  };
  details?: {
    monthly_fees?: {
      amount?: string;
      waiver_details?: string;
    };
    account_type?: string;
    account_category?: 'personal' | 'business';
    availability?: {
      type: 'Nationwide' | 'State';
      states?: string[];
      details?: string;
    };
    credit_inquiry?: string;
    credit_score?: {
      min?: number;
      recommended?: number;
    };
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    expiration?: string;
    under_5_24?: {
      required: boolean;
      details?: string;
    };
    annual_fees?: {
      amount: string;
      waived_first_year: boolean;
    };
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    };
    minimum_credit_limit?: string;
    rewards_structure?: {
      base_rewards: string;
      bonus_categories?: Array<{
        category: string;
        rate: string;
        limit?: string;
      }>;
      welcome_bonus?: string;
    };
    options_trading?: 'Yes' | 'No' | string;
    ira_accounts?: 'Yes' | 'No' | string;
    platform_features?: Array<{
      name: string;
      description: string;
    }>;
    minimum_deposit?: string;
    holding_period?: string;
    trading_requirements?: string;
  };
  rewards?: {
    card_perks: string | null;
    cash_back: string | null;
    points_multiplier: string | null;
    statement_credits: string | null;
  };
  logo?: {
    type?: 'icon' | 'url';
    url?: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  };
}

// This is for the UI components to use - it's the same structure but with value as string
export type FormData = Omit<FirestoreOpportunity, 'value'> & { value: string };

export type USState = (typeof US_STATES)[number];

export interface BonusRequirements {
  tiers: BonusTier[];
  description?: string;
}

export interface BonusTier {
  min: number;
  bonus: Bonus;
}

export interface RewardsCategory {
  category: string;
  rate: string;
  limit: string;
}

export interface RewardsStructure {
  base_rewards?: string;
  welcome_bonus?: string;
  bonus_categories?: RewardsCategory[];
}

export interface Details {
  monthly_fees?: {
    amount: string;
    waiver_details?: string | null;
  } | null;
  annual_fees?: {
    amount: string;
    waived_first_year: boolean;
  } | null;
  account_type?: string | null;
  availability?: {
    type: string;
    states?: string[];
    is_nationwide?: boolean;
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
    bonus_categories?: Array<{
      category: string;
      rate: string;
      limit?: string;
    }>;
    welcome_bonus?: string;
  } | null;
  household_limit?: string | null;
  early_closure_fee?: string | null;
  chex_systems?: string | null;
  options_trading?: string | null;
  ira_accounts?: string | null;
  platform_features?: Array<{
    name: string;
    description: string;
  }> | null;
  minimum_deposit?: string | null;
  holding_period?: string | null;
  trading_requirements?: string | null;
}

export interface Bonus {
  description: string;
  requirements: BonusRequirements;
  tiers?: BonusTier[];
  additional_info?: string;
}

export interface Opportunity {
  id?: string;
  type: 'credit_card' | 'bank' | 'brokerage';
  name: string;
  offer_link: string;
  value: number;
  bonus?: {
    title?: string;
    description?: string;
    requirements?: {
      title?: string;
      description?: string;
      minimum_deposit?: number;
      trading_requirements?: string;
      holding_period?: string;
      spending_requirement?: {
        amount: number;
        timeframe: string;
      };
    };
    additional_info?: string;
    tiers?: Array<{
      level: string;
      value: number;
      minimum_deposit: number;
      requirements: string;
    }>;
  };
  details?: {
    monthly_fees?: {
      amount?: string;
      waiver_details?: string;
    };
    account_type?: string;
    account_category?: 'personal' | 'business';
    availability?: {
      type: 'Nationwide' | 'State';
      states?: string[];
      details?: string;
    };
    credit_inquiry?: string;
    credit_score?: {
      min?: number;
      recommended?: number;
    };
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    expiration?: string;
    under_5_24?: {
      required: boolean;
      details?: string;
    };
    annual_fees?: {
      amount: string;
      waived_first_year: boolean;
    };
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    };
    minimum_credit_limit?: string;
    rewards_structure?: {
      base_rewards: string;
      bonus_categories?: Array<{
        category: string;
        rate: string;
        limit?: string;
      }>;
      welcome_bonus?: string;
    };
    options_trading?: 'Yes' | 'No' | string;
    ira_accounts?: 'Yes' | 'No' | string;
    platform_features?: Array<{
      name: string;
      description: string;
    }>;
    minimum_deposit?: string;
    holding_period?: string;
    trading_requirements?: string;
  };
  rewards?: {
    card_perks: string | null;
    cash_back: string | null;
    points_multiplier: string | null;
    statement_credits: string | null;
  };
  logo?: {
    type?: 'icon' | 'url';
    url?: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  };
  metadata?: {
    created_at: string;
    updated_at: string;
    created_by: string;
    status: 'active' | 'inactive';
  };
  bank?: string;
  description?: string;
  title?: string;
  processing_status?: string;
  ai_insights?: string;
}

// Utility types for handling nested keys, including array indices
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends Array<
    infer U extends object
  >
    ? `${Key}.${number}.${NestedKeyOf<U>}`
    : ObjectType[Key] extends object
      ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : Key;
}[keyof ObjectType & string];

// Export the updated FormKeys
export type FormKeys = NestedKeyOf<Opportunity>;

export interface BaseRequirement {
  type: string;
  details: {
    amount: number;
    period: number;
    count?: number;
  };
  minimum_deposit?: number | null;
}

export interface DebitTransactionRequirement extends BaseRequirement {
  type: 'debit_transactions';
  details: { amount: number; period: number; count: number };
}
