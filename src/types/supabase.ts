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
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          notifications: Json;
          preferences: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          notifications?: Json;
          preferences?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          notifications?: Json;
          preferences?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          type: 'credit_card' | 'bank_account' | 'brokerages' | null;
          created_at: string | null;
          updated_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          type?: 'credit_card' | 'bank_account' | 'brokerages' | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          type?: 'credit_card' | 'bank_account' | 'brokerages' | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      staged_offers: {
        Row: {
          id: string;
          opportunity_id: string | null;
          user_id: string | null;
          status: string;
          validation_errors: Json | null;
          data: Json;
        };
        Insert: {
          id?: string;
          opportunity_id?: string | null;
          user_id?: string | null;
          status: string;
          validation_errors?: Json | null;
          data: Json;
        };
        Update: {
          id?: string;
          opportunity_id?: string | null;
          user_id?: string | null;
          status?: string;
          validation_errors?: Json | null;
          data?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'staged_offers_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staged_offers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'contributor' | 'user';
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'contributor' | 'user';
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'super_admin' | 'admin' | 'contributor' | 'user';
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_offers: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string;
          status: 'interested' | 'applied' | 'completed' | 'not_interested';
          notes: string | null;
          reminder_date: string | null;
          applied_date: string | null;
          completed_date: string | null;
          created_at: string | null;
          updated_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          opportunity_id: string;
          status?: 'interested' | 'applied' | 'completed' | 'not_interested';
          notes?: string | null;
          reminder_date?: string | null;
          applied_date?: string | null;
          completed_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          opportunity_id?: string;
          status?: 'interested' | 'applied' | 'completed' | 'not_interested';
          notes?: string | null;
          reminder_date?: string | null;
          applied_date?: string | null;
          completed_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_offers_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_offers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      system_settings: {
        Row: {
          id: string;
          maintenance_mode: boolean;
          rate_limits: Json;
          notifications: Json;
          scraper: Json;
          features: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          maintenance_mode?: boolean;
          rate_limits?: Json;
          notifications?: Json;
          scraper?: Json;
          features?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          maintenance_mode?: boolean;
          rate_limits?: Json;
          notifications?: Json;
          scraper?: Json;
          features?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          email?: string;
          role?: UserRole;
          created_at?: string;
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
      user_role: 'super_admin' | 'admin' | 'contributor' | 'user';
      opportunity_type: 'credit_card' | 'bank_account' | 'brokerages';
      tracking_status: 'interested' | 'applied' | 'completed' | 'not_interested';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
