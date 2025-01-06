export type OfferType = 'bank' | 'credit_card' | 'brokerage';

// This is the exact Firestore structure
export interface FirestoreOpportunity {
  id?: string;
  name: string;
  type: 'credit_card' | 'bank' | 'brokerage';
  offer_link: string;
  value: number;
  bonus?: {
    title?: string;
    description?: string;
    requirements?: {
      title?: string;
      description?: string;
    };
    additional_info?: string;
  };
  details?: {
    monthly_fees?: {
      amount?: string;
      waiver_details?: string;
    };
    account_type?: string;
    availability?: {
      type: 'Nationwide' | 'State';
      states?: string[];
      details?: string;
    };
    credit_inquiry?: string;
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    expiration?: string;
    under_5_24?: string;
    annual_fees?: string;
    foreign_transaction_fees?: string;
  };
  logo?: {
    type?: 'icon' | 'url';
    url?: string;
  };
  metadata?: {
    created_at: string;
    updated_at: string;
    created_by: string;
    status: 'active' | 'inactive';
  };
  bank?: string;
  description?: string;
  title?: string;
}

// This is for the UI components to use - it's the same structure but with value as string
export type FormData = Omit<FirestoreOpportunity, 'value'> & { value: string };
