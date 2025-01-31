export interface BonusTier {
  reward: string;
  deposit: string;
}

export interface TieredRequirement {
  tier: string;
  requirements: string;
}

export interface BonusRequirements {
  title: string;
  description: string;
  tiers?: TieredRequirement[];
}

export interface Bonus {
  title: string;
  description: string;
  requirements: BonusRequirements;
  tiers?: BonusTier[];
  additional_info?: string;
}

export interface Details {
  minimum_deposit?: string;
  early_closure_fee?: string;
  monthly_fees?: string;
  atm_fees?: string;
  foreign_transaction_fees?: string;
  overdraft_fees?: string;
  minimum_balance?: string;
  direct_deposit?: string;
  chex_systems?: string;
  annual_fees?: string;
  apr?: string;
  under_5_24?: boolean;
  options_trading?: string;
  ira_accounts?: string;
  trading_requirements?: string;
  platform_features?: Array<{
    name: string;
    description: string;
  }>;
}

export interface BankRewardsOffer {
  id: string;
  title: string;
  type: string;
  metadata: {
    rawHtml: string;
    bonus?: string;
    lastChecked?: string;
    offerBaseUrl?: string;
  };
  createdAt: string | Date;
}

export interface EnhancedTransformedOffer {
  id: string;
  name: string;
  type: 'credit_card' | 'brokerage' | 'bank';
  offer_link: string;
  value: number;
  bonus: Bonus;
  details: Details;
  metadata: {
    created: string;
    updated: string;
  };
  logo?: string;
  card_image?: string;
}

export interface PlatformFeature {
  name: string;
  description: string;
}

export interface BankRewardsTransformerConfig {
  defaultValue?: number;
  minConfidence?: number;
  maxTiers?: number;
  requireExplicitValue?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  fallbackMessages?: {
    bonusDescription?: string;
    requirements?: string;
    additionalInfo?: string;
  };
}
