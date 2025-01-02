export interface Opportunity {
  _id: string;
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account' | 'brokerage' | 'bank';
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
      type: 'Nationwide' | 'State';
      states?: string[];
      details?: string;
      regions?: string[];
    };
    bonus?: {
      value: number;
      description: string;
      requirements: {
        description: string;
      };
      details: string;
      tiers?: Array<{
        bonus: string;
        details: string;
        requirement: string;
      }>;
      expiration?: string;
      terms?: string;
      additional_info?: string;
    };
    features?: string[];
    perks?: string[];
  };
  details?: {
    credit_inquiry?: string;
    annual_fees?: string;
    monthly_fees?: {
      amount: string;
      waiver_details?: string;
    };
    foreign_transaction_fees?: string;
    availability?: {
      type: string;
      states?: string[];
      details?: string;
    };
    under_5_24?: string;
  };
  created_at: string;
  last_updated: string;
  bonus?: {
    amount: number;
    currency: string;
    requirements: Requirement[];
    additional_info?: string;
    description?: string;
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
  name?: string;
}

export interface Requirement {
  description: string;
}

export interface Bonus {
  amount: number;
  currency: string;
  requirements: Requirement[];
  additional_info?: string;
  description?: string;
}
