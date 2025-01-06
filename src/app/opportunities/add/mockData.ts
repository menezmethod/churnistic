import { Opportunity, OfferType } from '@/types/opportunity';

const mockOffers: Opportunity[] = [
  {
    name: 'Chase Sapphire Preferred',
    type: 'credit_card',
    offer_link: 'https://www.chase.com/sapphire-preferred',
    value: 800,
    bonus: {
      description:
        'Earn 80,000 bonus points after you spend $4,000 on purchases in the first 3 months',
      requirements: {
        description: 'Spend $4,000 on purchases in the first 3 months',
        spending_requirement: {
          amount: 4000,
          timeframe: '3 months',
        },
      },
    },
    details: {
      monthly_fees: {
        amount: '$95',
        waiver_details: 'Not waived first year',
      },
      account_type: 'Credit Card',
      account_category: 'personal',
      availability: { type: 'Nationwide' },
      credit_score: {
        min: 680,
        recommended: 720,
      },
      under_5_24: {
        required: true,
        details: 'Must be under 5/24 rule',
      },
      annual_fees: {
        amount: '$95',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
      minimum_credit_limit: '$5,000',
      rewards_structure: {
        base_rewards: '1x points on all purchases',
        welcome_bonus: '80,000 points',
        bonus_categories: [
          {
            category: 'Travel',
            rate: '2x',
            limit: 'Unlimited',
          },
          {
            category: 'Dining',
            rate: '3x',
            limit: 'Unlimited',
          },
        ],
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
  {
    name: 'Capital One 360 Checking',
    type: 'bank',
    offer_link: 'https://www.capitalone.com/360checking',
    value: 400,
    bonus: {
      description: 'Get a $400 bonus when you open a new 360 Checking account',
      requirements: {
        description: 'Receive 2 direct deposits totaling $1,000 or more within 60 days',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
        waiver_details: 'No monthly fees for this account',
      },
      account_type: 'Checking Account',
      account_category: 'personal',
      availability: { type: 'Nationwide' },
      household_limit: 'One per person',
      early_closure_fee: '$50 if closed within 90 days',
      chex_systems: 'Sensitive',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
  {
    name: 'Webull',
    type: 'brokerage',
    offer_link: 'https://www.webull.com',
    value: 250,
    bonus: {
      description: 'Get free stocks worth up to $250',
      requirements: {
        description: 'Open account and make a deposit',
        minimum_deposit: 1,
        trading_requirements: 'No trading requirements',
        holding_period: '30 days',
      },
      tiers: [
        {
          level: 'Basic',
          value: 300,
          minimum_deposit: 1,
          requirements: '2 stocks ($3-$300)',
        },
        {
          level: 'Silver',
          value: 3000,
          minimum_deposit: 100,
          requirements: '4 stocks ($7-$3,000)',
        },
        {
          level: 'Gold',
          value: 3000,
          minimum_deposit: 2000,
          requirements: '6 stocks ($15-$3,000)',
        },
      ],
      additional_info: 'Also receive 1 year of free Level 2 market data',
    },
    details: {
      monthly_fees: {
        amount: 'None',
        waiver_details: 'No monthly fees for this account',
      },
      account_type: 'Brokerage Account',
      account_category: 'personal',
      availability: { type: 'Nationwide' },
      household_limit: 'One per person',
      early_closure_fee: 'None',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
];

export function getRandomOffer(type: OfferType): Opportunity {
  const filteredOffers = mockOffers.filter((offer) => offer.type === type);
  if (filteredOffers.length === 0) {
    throw new Error(`No mock offers found for type: ${type}`);
  }
  return { ...filteredOffers[Math.floor(Math.random() * filteredOffers.length)] };
}
