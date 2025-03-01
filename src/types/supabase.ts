export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: string;
          status: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by?: string;
            status?: string;
          };
          processing_status?: {
            needs_review: boolean;
            review_reason?: string;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: string;
          status?: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by?: string;
            status?: string;
          };
          processing_status?: {
            needs_review: boolean;
            review_reason?: string;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: string;
          status?: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata?: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by?: string;
            status?: string;
          };
          processing_status?: {
            needs_review: boolean;
            review_reason?: string;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      rejected_offers: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: string;
          status: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by: string;
            status: string;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: string;
          status: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by: string;
            status: string;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: string;
          status?: string;
          card_image?: {
            url: string;
            network: string;
            color: string;
            badge?: string;
          } | null;
          metadata?: {
            created_at: string;
            updated_at: string;
            created_by: string;
            updated_by: string;
            status: string;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
