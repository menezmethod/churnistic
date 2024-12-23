'use client';

import { ChurningDashboard } from '@/components/churning';

// This is temporary mock data - replace with actual data from your API
const mockData = {
  opportunities: [
    {
      id: '1',
      type: 'credit card',
      title: 'Chase Sapphire Preferred',
      description: 'Premium travel rewards card with high signup bonus',
      value: '$1,250',
      status: 'active',
      card_name: 'Chase Sapphire Preferred',
      bank_name: 'Chase',
      signup_bonus: '60,000 points',
      bonus_amount: '$1,250',
      requirements: [
        'Spend $4,000 in first 3 months',
        'No previous Sapphire bonus in 48 months',
      ],
      risk_level: 2,
      time_limit: '3 months',
      expiration: '2024-12-31',
      source: 'Chase website',
    },
    {
      id: '2',
      type: 'credit card',
      title: 'Amex Platinum',
      description: 'Premium travel card with extensive benefits',
      value: '$1,500',
      status: 'active',
      card_name: 'The Platinum Card',
      bank_name: 'American Express',
      signup_bonus: '150,000 points',
      bonus_amount: '$1,500',
      requirements: ['Spend $6,000 in first 6 months', 'No previous bonus on this card'],
      risk_level: 3,
      time_limit: '6 months',
      expiration: '2024-06-30',
      source: 'American Express website',
    },
    {
      id: '3',
      type: 'bank account',
      title: 'Citi Checking Bonus',
      description: 'High-value checking account bonus',
      value: '$700',
      status: 'active',
      bank_name: 'Citibank',
      bonus_amount: '$700',
      requirements: [
        'Deposit $50,000 in new money',
        'Maintain balance for 60 days',
        'Complete qualifying activities',
      ],
      risk_level: 4,
      time_limit: '60 days',
      expiration: '2024-03-31',
      source: 'Citi website',
    },
  ],
  summary: {
    overview:
      'Currently tracking 3 high-value churning opportunities worth over $3,000 in total value',
    total_opportunities: 3,
    total_value: 3450,
    average_risk: 3.0,
  },
  riskAssessment: {
    overview:
      'Overall risk level is low to moderate, with bank account bonuses showing slightly higher risk',
    overall_risk_level: 3.0,
  },
};

export default function CardsPage() {
  return (
    <div>
      <ChurningDashboard
        opportunities={mockData.opportunities}
        summary={mockData.summary}
        riskAssessment={mockData.riskAssessment}
      />
    </div>
  );
}
