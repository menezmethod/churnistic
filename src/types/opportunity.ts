export interface OpportunityMetadata {
  accountType: string;
  fees: {
    annual?: string;
    foreign_transaction?: string;
    monthly?: string;
    details: string;
  };
  credit?: {
    inquiry: string;
    type: string;
    impact: string;
    score_requirements?: string;
    chase_524_rule?: boolean;
  };
  features: string[];
  perks: string[];
  bonus: {
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
  availability: {
    regions: string;
    details: string;
    household_limit?: string;
    language_requirements?: string[];
    citizenship_requirements?: string[];
    state_restrictions?: string[];
  };
  timing: {
    approval_time?: string;
    bonus_posting_time?: string;
    card_delivery_time?: string;
  };
  institution_details: {
    name: string;
    type: string;
    description?: string;
    website?: string;
    founded?: string;
    headquarters?: string;
  };
  brokerage_features?: {
    account_types: string[];
    trading_options: string[];
    research_tools: string[];
    mobile_trading: boolean;
    fractional_shares: boolean;
    minimum_balance: string;
  };
  source: {
    name: string;
    url: string;
    last_verified: string;
  };
  tracking: {
    first_seen: string;
    last_seen: string;
    times_seen: number;
    source_history: Array<{
      timestamp: string;
      source: string;
      url: string;
    }>;
  };
}

export interface Opportunity {
  id: string;
  offer_id?: string;
  title: string;
  type: 'credit_card' | 'bank_account' | 'brokerage';
  value: number;
  bank: string;
  description: string;
  requirements: string[];
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate: string | null;
  confidence: number;
  status: 'active' | 'expired' | 'pending';
  metadata: OpportunityMetadata;
  disclosure?: string;
  url?: string;
  institution?: string;
  created_at?: string;
  last_updated?: string;
  offer_link?: string;
}
