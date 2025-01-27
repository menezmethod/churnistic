import { Opportunity } from '../types/opportunity';

export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    name: 'Chase Sapphire Preferred®',
    type: 'credit_card',
    bank: 'Chase',
    value: 800,
    status: 'pending',
    source: {
      name: 'Doctor of Credit',
      collected_at: '2024-01-05T10:30:00Z',
    },
    bonus: {
      title: '80,000 Points Bonus',
      value: 800,
      requirements: [
        {
          type: 'spend',
          details: { amount: 4000, period: 90 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: true,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.92,
      validation_warnings: ['Bonus amount changed recently'],
      potential_duplicates: ['chase-sapphire-preferred-75k'],
    },
  },
  {
    id: '2',
    name: 'Citi Premier® Card',
    type: 'credit_card',
    bank: 'Citi',
    value: 600,
    status: 'pending',
    source: {
      name: 'BankRewards.io',
      collected_at: '2024-01-05T09:15:00Z',
    },
    bonus: {
      title: '60,000 Points Bonus',
      value: 600,
      requirements: [
        {
          type: 'spend',
          details: { amount: 4000, period: 90 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: true,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.88,
      validation_warnings: [],
      potential_duplicates: [],
    },
  },
  {
    id: '3',
    name: 'Capital One Checking',
    type: 'bank',
    bank: 'Capital One',
    value: 400,
    status: 'pending',
    source: {
      name: 'Doctor of Credit',
      collected_at: '2024-01-05T08:45:00Z',
    },
    bonus: {
      title: '$400 Checking Bonus',
      value: 400,
      requirements: [
        {
          type: 'direct_deposit',
          details: { amount: 2000, period: 60 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: false,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.95,
      validation_warnings: ['Similar to existing offer'],
      potential_duplicates: ['capital-one-checking-300'],
    },
  },
];
