export interface Opportunity {
  _id: string;
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account' | 'brokerage';
  value: number;
  bank: string;
  description: string;
  requirements: string[];
  url: string;
  source: {
    name: string;
    url: string;
  };
  metadata: {
    created_at: string;
    last_updated: string;
    version: string;
    credit?: {
      inquiry: string | { monthly?: boolean };
      chase_524_rule?: boolean;
      impact?: string;
      score_requirements?: string;
      type?: string;
    };
    fees?: {
      annual?: string | { amount: number; waivable: boolean };
      monthly?: string;
      foreign_transaction?: string;
      details?: string;
    };
    timing?: {
      approval_time?: string;
      bonus_posting_time?: string;
    };
    availability?: {
      regions: string[];
      is_nationwide: boolean;
      restrictions: string | null;
    };
    bonus?: {
      value: number;
      description: string;
      requirements: string[];
      details: string;
      tiers?: Array<{
        bonus: string;
        details: string;
        requirement: string;
      }>;
      expiration?: string;
      terms?: string;
    };
    features?: string[];
    perks?: string[];
    brokerage_features?: {
      account_types: string[];
      trading_options: string[];
      research_tools: string[];
      mobile_trading: boolean;
      fractional_shares: boolean;
      minimum_balance: string;
    };
    source?: {
      name: string;
      url: string;
      last_verified: string;
    };
  };
  created_at: string;
  last_updated: string;
  bonus: {
    amount: number;
    currency: string;
    requirements: string[];
  };
  timing: {
    posted_date: string;
    last_verified: string;
    expiration: string;
  };
  offer_link: string;
  status: 'active' | 'expired' | 'pending';
  confidence?: number;
  sourceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  postedDate?: Date;
  expirationDate?: string;
  disclosure?: string;
}
