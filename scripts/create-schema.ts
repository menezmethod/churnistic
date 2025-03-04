import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createSchema() {
  try {
    console.log('Creating database schema...');

    // Create types and tables in a single query
    const { error } = await supabase.from('_sql').select('*').execute(`
      DO $$ BEGIN
        -- Create opportunity_type enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_type') THEN
          CREATE TYPE opportunity_type AS ENUM (
            'credit_card',
            'bank_account',
            'brokerages'
          );
        END IF;

        -- Create opportunity_status enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status') THEN
          CREATE TYPE opportunity_status AS ENUM (
            'pending',
            'approved',
            'rejected'
          );
        END IF;

        -- Create opportunities table
        CREATE TABLE IF NOT EXISTS opportunities (
          id SERIAL PRIMARY KEY,
          type opportunity_type NOT NULL,
          source TEXT NOT NULL,
          logo TEXT,
          card_image TEXT,
          bonus JSONB,
          details JSONB,
          metadata JSONB,
          ai_insights JSONB,
          processing_status opportunity_status DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create staged_offers table
        CREATE TABLE IF NOT EXISTS staged_offers (
          id SERIAL PRIMARY KEY,
          type opportunity_type NOT NULL,
          source TEXT NOT NULL,
          logo TEXT,
          card_image TEXT,
          bonus JSONB,
          details JSONB,
          metadata JSONB,
          ai_insights JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      END $$;
    `);

    if (error) {
      throw error;
    }

    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
    process.exit(1);
  }
}

createSchema(); 