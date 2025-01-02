import { NextResponse } from 'next/server';

interface CardImage {
  url: string;
  network: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';
  color: string;
  badge?: string;
}

interface Logo {
  type: string;
  url: string;
}

interface BonusTier {
  reward: string;
  deposit?: string;
  requirement?: string;
}

interface ApprovedOpportunity {
  id: string;
  name: string;
  title: string;
  type: 'credit_card' | 'bank' | 'brokerage';
  value: number;
  bank: string;
  description: string;
  
  logo?: Logo;
  card_image?: CardImage;
  
  offer_link: string;
  bonus: {
    title: string;
    description: string;
    value: number;
    tiers?: BonusTier[];
    requirements: {
      title: string;
      description: string;
      type: 'direct_deposit' | 'spend' | 'balance' | 'transactions' | 'other';
      details?: {
        amount?: number;
        period?: number;
        count?: number;
      };
    }[];
    expiration?: string;
    terms?: string;
    additional_info?: string;
  };
  
  rewards?: {
    card_perks?: string;
    cash_back?: string;
  };
  
  details: {
    credit_inquiry?: 'soft' | 'hard' | 'none';
    under_5_24?: 'yes' | 'no';
    annual_fees?: string;
    foreign_transaction_fees?: string;
    monthly_fees?: {
      amount: string;
      waiver_details?: string;
    };
    account_type?: string;
    expiration?: string;
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    options_trading?: string;
    ira_accounts?: string;
  };
  
  metadata: {
    availability: {
      type: 'Nationwide' | 'State';
      states?: string[];
      details?: string;
    };
    source: {
      name: string;
      url: string;
      collected_at: string;
    };
    approval: {
      status: 'approved';
      reviewed_at: string;
      reviewer: string;
      confidence_score: number;
    };
    referral: {
      link: string;
      last_verified: string;
      commission?: string;
    };
    created: string;
    updated: string;
  };
  
  timing: {
    posted_date: string;
    expiration_date?: string;
    last_verified: string;
    approval_time?: string;
    bonus_posting_time?: string;
  };
  
  status: 'active' | 'expired' | 'ending_soon';
  disclosure?: string;
}

// Mock data representing perfectly formatted opportunities
const MOCK_OPPORTUNITIES: ApprovedOpportunity[] = [
  {
    id: 'chase-sapphire-preferred-2024',
    name: 'Chase Sapphire Preferred®',
    title: 'Chase Sapphire Preferred',
    type: 'credit_card',
    value: 60000,
    bank: 'Chase',
    description: 'Earn 60,000 Ultimate Rewards points after meeting minimum spend requirement',
    
    logo: {
      type: 'bank',
      url: '/images/banks/chase-logo.svg'
    },
    
    card_image: {
      url: '/images/cards/chase-sapphire-preferred.png',
      network: 'VISA',
      color: 'Sapphire Blue Metal',
      badge: 'PREMIUM TRAVEL REWARDS'
    },
    
    offer_link: 'https://www.referyourchasecard.com/6f/ABCD1234',
    
    bonus: {
      title: 'Welcome Bonus',
      description: '60,000 Ultimate Rewards points welcome bonus',
      value: 60000,
      requirements: [
        {
          title: 'Minimum Spend',
          description: 'Spend $4,000 in first 3 months',
          type: 'spend',
          details: {
            amount: 4000,
            period: 90
          }
        }
      ],
      terms: 'Not available if received Sapphire bonus in past 48 months',
      additional_info: 'Points worth 25% more when redeemed for travel through Chase portal'
    },
    
    rewards: {
      card_perks: '25% more value when redeeming points for travel through Chase Ultimate Rewards®',
      cash_back: '5x on travel purchased through Chase Ultimate Rewards®, 3x on dining'
    },
    
    details: {
      credit_inquiry: 'hard',
      under_5_24: 'yes',
      annual_fees: '$95',
      foreign_transaction_fees: 'None'
    },
    
    metadata: {
      availability: {
        type: 'Nationwide'
      },
      source: {
        name: 'Doctor of Credit',
        url: 'https://www.doctorofcredit.com/chase-sapphire-preferred-60000-bonus-points-after-4000-spend/',
        collected_at: '2024-01-15T12:00:00Z'
      },
      approval: {
        status: 'approved',
        reviewed_at: '2024-01-15T14:30:00Z',
        reviewer: 'admin@churnistic.com',
        confidence_score: 0.98
      },
      referral: {
        link: 'https://www.referyourchasecard.com/6f/ABCD1234',
        last_verified: '2024-01-15T12:00:00Z',
        commission: '$200'
      },
      created: '2024-01-15T12:00:00Z',
      updated: '2024-01-15T14:30:00Z'
    },
    
    timing: {
      posted_date: '2024-01-15T00:00:00Z',
      last_verified: '2024-01-15T12:00:00Z',
      approval_time: 'Instant to 7 days',
      bonus_posting_time: 'After statement close'
    },
    
    status: 'active',
    
    disclosure: 'Chase Sapphire Preferred® credit card is subject to credit approval. Restrictions and limitations apply.'
  },
  {
    id: 'citi-checking-500-2024',
    name: 'Citi Priority Checking™',
    title: 'Citi Priority Checking',
    type: 'bank',
    value: 500,
    bank: 'Citibank',
    description: 'Earn $500 bonus for new Citi Priority checking account with qualifying activities',
    
    logo: {
      type: 'bank',
      url: '/images/banks/citi-logo.svg'
    },
    
    offer_link: 'https://banking.citi.com/priority500',
    
    bonus: {
      title: 'Bonus Details',
      description: '$500 cash bonus for new checking account',
      value: 500,
      requirements: [
        {
          title: 'Minimum Deposit',
          description: 'Maintain $15,000 minimum balance for 60 days',
          type: 'balance',
          details: {
            amount: 15000,
            period: 60
          }
        },
        {
          title: 'Direct Deposit',
          description: 'Complete one qualifying direct deposit in 60 days',
          type: 'direct_deposit',
          details: {
            count: 1,
            period: 60
          }
        }
      ],
      expiration: '2024-03-31T23:59:59Z',
      terms: 'Must be new Citibank checking customer'
    },
    
    details: {
      account_type: 'Premium Checking Account',
      monthly_fees: {
        amount: '$30',
        waiver_details: 'Waived with $15,000 combined average monthly balance'
      },
      early_closure_fee: '$90 if closed within 180 days',
      chex_systems: 'Yes - Sensitive',
      expiration: '2024-03-31',
      household_limit: 'One bonus per customer/household every 12 months'
    },
    
    metadata: {
      availability: {
        type: 'State',
        states: ['NY', 'CA', 'FL', 'TX', 'IL'],
        details: 'Must open in branch in eligible states'
      },
      source: {
        name: 'BankRewards.io',
        url: 'https://bankrewards.io/citi-priority-500',
        collected_at: '2024-01-14T15:00:00Z'
      },
      approval: {
        status: 'approved',
        reviewed_at: '2024-01-14T16:45:00Z',
        reviewer: 'admin@churnistic.com',
        confidence_score: 0.95
      },
      referral: {
        link: 'https://banking.citi.com/priority500',
        last_verified: '2024-01-14T15:00:00Z'
      },
      created: '2024-01-14T15:00:00Z',
      updated: '2024-01-14T16:45:00Z'
    },
    
    timing: {
      posted_date: '2024-01-14T00:00:00Z',
      expiration_date: '2024-03-31T23:59:59Z',
      last_verified: '2024-01-14T15:00:00Z',
      bonus_posting_time: '90 days after requirements met'
    },
    
    status: 'active',
    
    disclosure: 'To be eligible for the $500 bonus, you must be a new Citi checking customer and complete all required activities. Bonus will be credited to your account within 90 days of completing requirements. Offer subject to change without notice.'
  }
];

export async function GET() {
  try {
    // In a real implementation, this would fetch from your database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      count: MOCK_OPPORTUNITIES.length,
      opportunities: MOCK_OPPORTUNITIES
    });
  } catch (error) {
    console.error('Error fetching approved opportunities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch opportunities',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 