export interface TypeColors {
  primary: string;
  light: string;
  dark: string;
  alpha: string;
  icon: React.ReactNode;
}

export type OpportunityType = 'credit_card' | 'bank' | 'brokerage';

export interface FirestoreOpportunity {
  id?: string;
  name: string;
  description?: string;
  value: number;
  type: OpportunityType;
  logo?: {
    url?: string;
    type?: 'icon' | 'url';
  };
  offer_link?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface OpportunityFormValues {
  name: string;
  description?: string;
  value: number;
  type: OpportunityType;
  logo?: {
    url?: string;
    type?: 'icon' | 'url';
  };
  offer_link?: string;
}
