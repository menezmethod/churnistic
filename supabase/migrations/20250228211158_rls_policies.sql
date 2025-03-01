-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credit_card_alerts boolean DEFAULT true NOT NULL,
  bank_bonus_alerts boolean DEFAULT true NOT NULL,
  investment_alerts boolean DEFAULT true NOT NULL,
  risk_alerts boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User Settings Policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
  DROP POLICY IF EXISTS "Users can create own settings" ON public.user_settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

  -- Create new policies
  CREATE POLICY "Users can read own settings"
    ON public.user_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create own settings"
    ON public.user_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own settings"
    ON public.user_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END
$$;

-- Create opportunities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  value numeric(10,2),
  status text DEFAULT 'pending' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Opportunities Policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can view approved opportunities" ON public.opportunities;
  DROP POLICY IF EXISTS "Users can view their own opportunities" ON public.opportunities;
  DROP POLICY IF EXISTS "Users can create opportunities" ON public.opportunities;
  DROP POLICY IF EXISTS "Users can update own opportunities" ON public.opportunities;
  DROP POLICY IF EXISTS "Users can delete own opportunities" ON public.opportunities;
  DROP POLICY IF EXISTS "Admins have full access to opportunities" ON public.opportunities;

  -- Create new policies
  CREATE POLICY "Public can view approved opportunities"
    ON public.opportunities
    FOR SELECT
    TO authenticated, anon
    USING (status = 'approved');

  CREATE POLICY "Users can view their own opportunities"
    ON public.opportunities
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

  CREATE POLICY "Users can create opportunities"
    ON public.opportunities
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

  CREATE POLICY "Users can update own opportunities"
    ON public.opportunities
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

  CREATE POLICY "Users can delete own opportunities"
    ON public.opportunities
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid()::text);

  CREATE POLICY "Admins have full access to opportunities"
    ON public.opportunities
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END
$$;

-- Admin function for checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::text
    AND role = 'super_admin'
  );
$$;

-- Stats Policies
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Public can view stats" ON public.stats;
  DROP POLICY IF EXISTS "Admins can manage stats" ON public.stats;

  -- Create new policies
  CREATE POLICY "Public can view stats"
    ON public.stats
    FOR SELECT
    TO authenticated, anon
    USING (true);

  CREATE POLICY "Admins can manage stats"
    ON public.stats
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END
$$;

-- Users Policies
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;

  -- Create new policies
  CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid()::text);

  CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid()::text)
    WITH CHECK (id = auth.uid()::text);

  CREATE POLICY "Admins can view all profiles"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (is_admin());

  CREATE POLICY "Admins can manage all profiles"
    ON public.users
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END
$$;

-- Grant necessary permissions
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT ON public.opportunities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;

GRANT SELECT ON public.stats TO anon;
GRANT SELECT ON public.stats TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stats TO authenticated;

GRANT SELECT ON public.users TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated; 