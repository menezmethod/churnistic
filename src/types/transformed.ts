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
  annual_fees?: string;
  foreign_transaction_fees?: string;
  credit_inquiry?: string;
  availability?: Availability;
  account_type?: string;
  expiration?: string;
  household_limit?: string;
  early_closure_fee?: string;
  chex_systems?: string;
  under_5_24?: string;
  options_trading?: string;
  ira_accounts?: string;
}

export interface Metadata {
  created: string;
  updated: string;
}

export interface TransformedOffer {
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
