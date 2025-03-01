-- Fix RLS policies for users table

-- Allow service role to manage all users (needed for user creation during registration)
DROP POLICY IF EXISTS "Service role can manage all users" ON "public"."users";
CREATE POLICY "Service role can manage all users"
  ON "public"."users"
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to create their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON "public"."users";
CREATE POLICY "Users can create own profile"
  ON "public"."users"
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()::uuid);

-- Allow anon users to create profiles (needed for sign-up)
DROP POLICY IF EXISTS "Anon can create profiles" ON "public"."users";
CREATE POLICY "Anon can create profiles"
  ON "public"."users"
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a function to check if a user is the service role
CREATE OR REPLACE FUNCTION "public"."is_service_role"() RETURNS boolean
  LANGUAGE "sql" SECURITY DEFINER
  AS $$
  SELECT current_setting('role', false)::text = 'service_role';
$$;

-- Update the is_admin function to handle the case when the user doesn't exist yet
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
  LANGUAGE "plpgsql" SECURITY DEFINER
  AS $$
BEGIN
  -- First check if we're running as the service role
  IF current_setting('role', false)::text = 'service_role' THEN
    RETURN true;
  END IF;

  -- Then check if the user is an admin
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::uuid
    AND role IN ('admin', 'super_admin')
  );
END;
$$;
