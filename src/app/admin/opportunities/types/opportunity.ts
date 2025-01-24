export interface Opportunity {
  id: string;
  name: string;
  type: string;
  bank: string;
  value: number;
  status: string;
  source: {
    name: string;
    collected_at: string;
  };
  bonus: {
    title: string;
    value: number;
    requirements: {
      type: string;
      details: {
        amount: number;
        period: number;
      };
    }[];
  };
  processing_status: {
    source_validation: boolean;
    ai_processed: boolean;
    duplicate_checked: boolean;
    needs_review: boolean;
  };
  ai_insights: {
    confidence_score: number;
    validation_warnings: string[];
    potential_duplicates: string[];
  };
}
