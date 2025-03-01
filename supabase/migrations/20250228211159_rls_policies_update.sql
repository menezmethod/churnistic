-- Enable RLS on opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on staged_offers
ALTER TABLE public.staged_offers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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
    USING (firestore_id = auth.uid()::text);

  CREATE POLICY "Users can create opportunities"
    ON public.opportunities
    FOR INSERT
    TO authenticated
    WITH CHECK (firestore_id = auth.uid()::text);

  CREATE POLICY "Users can update own opportunities"
    ON public.opportunities
    FOR UPDATE
    TO authenticated
    USING (firestore_id = auth.uid()::text)
    WITH CHECK (firestore_id = auth.uid()::text);

  CREATE POLICY "Users can delete own opportunities"
    ON public.opportunities
    FOR DELETE
    TO authenticated
    USING (firestore_id = auth.uid()::text);

  CREATE POLICY "Admins have full access to opportunities"
    ON public.opportunities
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END
$$;

-- Staged Offers Policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can manage staged offers" ON public.staged_offers;

  -- Create new policies
  CREATE POLICY "Admins can manage staged offers"
    ON public.staged_offers
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END
$$;

-- Users Policies
DO $$
BEGIN
  -- Drop existing policies if they exist
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
GRANT ALL ON public.opportunities TO authenticated;
GRANT ALL ON public.staged_offers TO authenticated;
GRANT ALL ON public.users TO authenticated; 