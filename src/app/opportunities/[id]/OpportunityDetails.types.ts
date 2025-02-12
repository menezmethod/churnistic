import { FirestoreOpportunity } from "@/types/opportunity";

// For AccountDetails
export interface AccountDetails {
  monthly_fees?: {
    amount: string;
    waiver_details?: string;
  };
  account_type?: string;
  account_category?: 'personal' | 'business';
  options_trading?: string;
  ira_accounts?: string;
  household_limit?: string;
  early_closure_fee?: string;
  chex_systems?: string;
  expiration?: string;
  // ... other properties
}

// For BonusDetails
export interface BonusDetails {
  requirements?: {
    description: string;
    minimum_deposit: number;
    trading_requirements: string;
    holding_period: string;
    spending_requirement: {
      amount: number;
      timeframe: string;
    };
  };
  tiers?: Array<{
    min: number;
    bonus: number;
    reward: string;
    deposit: string;
    level: string;
    requirements: string;
  }>;
  description?: string;
  additional_info?: string;
  // ... other properties
}

export type EditModeState = {
  isGlobalEditMode: boolean;
  editingFields: Record<string, EditableField>;
};

export type EditableField = {
  isEditing: boolean;
  value: string | number | boolean | null;
  validation?: (value: string | number | boolean | null) => string | null;
  required?: boolean;
};

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
