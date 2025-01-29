export interface Logo {
  type: string;
  url: string;
}

export interface CardImage {
  url: string;
  network?: string;
  color?: string;
  badge?: string;
}

export interface BonusTier {
  reward: string;
  deposit?: string;
  requirement?: string;
}

export interface BonusRequirements {
  title: string;
  description: string;
}

export interface Bonus {
  title: string;
  description: string;
  tiers?: BonusTier[];
  requirements: BonusRequirements;
  additional_info?: string;
}

export interface Rewards {
  card_perks?: string;
  cash_back?: string;
}

export interface MonthlyFees {
  amount: string;
  waiver_details?: string;
}

export interface Availability {
  type?: string;
  states?: string[];
  details?: string;
}

export interface Details {
  monthly_fees?: MonthlyFees | string;
  annual_fees?: {
    amount: string;
    waived_first_year: boolean;
  };
  foreign_transaction_fees?: {
    percentage: string;
    waived: boolean;
  };
  credit_inquiry?: string;
  availability?: Availability;
  account_type?: string;
  expiration?: string;

  // Bank Account specific fields
  minimum_deposit?: string;
  holding_period?: string;
  early_closure_fee?: string;
  chex_systems?: string;
  household_limit?: string;

  // Credit Card specific fields
  under_5_24?: {
    required: boolean;
    details: string;
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

  // Brokerage specific fields
  options_trading?: string;
  ira_accounts?: string;
  trading_requirements?: string;
  platform_features?: {
    name: string;
    description: string;
  }[];
}

export interface Metadata {
  created: string;
  updated: string;
}

export interface TransformedOffer {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  logo?: Logo;
  card_image?: CardImage;
  offer_link: string;
  bonus: Bonus;
  rewards?: Rewards;
  details: Details;
  disclosure?: string;
  metadata: Metadata;
}
