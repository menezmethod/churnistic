import { Theme } from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

export interface OpportunityDetailsProps {
  id: string;
}

export interface OpportunityState<T = FirestoreOpportunity> {
  opportunity: T | null;
  isLoading: boolean;
  error: Error | null;
  isDeleting: boolean;
  deleteDialog: boolean;
  editDialog: boolean;
  editData: Partial<T>;
  isEditing: boolean;
}

export interface BonusTier {
  level: string;
  value: number;
  minimum_deposit: number;
  requirements: string;
}

export interface BonusDetails {
  description: string;
  tiers: BonusTier[];
  requirements: {
    description: string;
    minimum_deposit: number;
    trading_requirements: string;
    holding_period: string;
    spending_requirement: {
      amount: number;
      timeframe: string;
    };
  };
  additional_info: string;
}

export interface AccountDetails {
  account_type: string;
  account_category: 'personal' | 'business';
  monthly_fees: {
    amount: string;
    waiver_details: string;
  };
  availability: {
    type: 'Nationwide' | 'State';
    states: string[];
    details: string;
  };
  options_trading?: 'Yes' | 'No';
  ira_accounts?: 'Yes' | 'No';
  household_limit: string;
  early_closure_fee: string;
  chex_systems: string;
  expiration: string;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  isDark: boolean;
}
