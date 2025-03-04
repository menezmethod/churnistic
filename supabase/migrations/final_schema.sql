-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE opportunity_type AS ENUM (
        'credit_card',
        'bank_account',
        'brokerages'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM (
        'pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create base tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opportunities (
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
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staged_offers (
    id SERIAL PRIMARY KEY,
    type opportunity_type NOT NULL,
    source TEXT NOT NULL,
    logo TEXT,
    card_image TEXT,
    bonus JSONB,
    details JSONB,
    metadata JSONB,
    ai_insights JSONB,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS opportunities_type_idx ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS opportunities_processing_status_idx ON public.opportunities(processing_status);
CREATE INDEX IF NOT EXISTS opportunities_user_id_idx ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS staged_offers_type_idx ON public.staged_offers(type);
CREATE INDEX IF NOT EXISTS staged_offers_user_id_idx ON public.staged_offers(user_id);
CREATE INDEX IF NOT EXISTS opportunities_bonus_gin_idx ON public.opportunities USING gin (bonus);
CREATE INDEX IF NOT EXISTS opportunities_details_gin_idx ON public.opportunities USING gin (details);
CREATE INDEX IF NOT EXISTS opportunities_metadata_gin_idx ON public.opportunities USING gin (metadata);
CREATE INDEX IF NOT EXISTS opportunities_ai_insights_gin_idx ON public.opportunities USING gin (ai_insights);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DO $$ BEGIN
    CREATE TRIGGER update_opportunities_updated_at
        BEFORE UPDATE ON public.opportunities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_staged_offers_updated_at
        BEFORE UPDATE ON public.staged_offers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = user_id
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create utility functions
CREATE OR REPLACE FUNCTION reset_all_opportunities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Reset opportunities table
    TRUNCATE opportunities CASCADE;
    ALTER SEQUENCE IF EXISTS opportunities_id_seq RESTART WITH 1;
    
    -- Reset staged offers
    TRUNCATE staged_offers CASCADE;
    ALTER SEQUENCE IF EXISTS staged_offers_id_seq RESTART WITH 1;
END;
$$;

CREATE OR REPLACE FUNCTION reset_staged_offers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    TRUNCATE staged_offers CASCADE;
    ALTER SEQUENCE IF EXISTS staged_offers_id_seq RESTART WITH 1;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_approve_opportunities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO opportunities (
        type,
        source,
        logo,
        card_image,
        bonus,
        details,
        metadata,
        ai_insights,
        user_id,
        processing_status,
        created_at,
        updated_at
    )
    SELECT
        type,
        source,
        logo,
        card_image,
        bonus,
        details,
        metadata,
        ai_insights,
        user_id,
        'approved'::opportunity_status,
        NOW(),
        NOW()
    FROM staged_offers;

    -- Clear staged offers after approval
    TRUNCATE staged_offers CASCADE;
    ALTER SEQUENCE IF EXISTS staged_offers_id_seq RESTART WITH 1;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staged_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admin users can view all profiles"
    ON public.users
    FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can update all profiles"
    ON public.users
    FOR UPDATE
    USING (is_admin(auth.uid()));

-- Opportunities policies
CREATE POLICY "Public can view approved opportunities"
    ON public.opportunities
    FOR SELECT
    USING (processing_status = 'approved');

CREATE POLICY "Admin users have full access to opportunities"
    ON public.opportunities
    FOR ALL
    USING (is_admin(auth.uid()));

-- Staged offers policies
CREATE POLICY "Admin users have full access to staged offers"
    ON public.staged_offers
    FOR ALL
    USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunities TO authenticated;
GRANT ALL ON public.staged_offers TO authenticated; 