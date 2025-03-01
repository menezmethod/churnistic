-- Fix schema migration script

-- Step 1: Fix column names in users table (ensure snake_case)
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "createdAt" TO "created_at";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "updatedAt" TO "updated_at";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "displayName" TO "display_name";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "customDisplayName" TO "custom_display_name";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "photoURL" TO "avatar_url";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "creditScore" TO "credit_score";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "monthlyIncome" TO "monthly_income";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "businessVerified" TO "business_verified";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "householdId" TO "household_id";
ALTER TABLE "public"."users" 
  RENAME COLUMN IF EXISTS "emailPreferences" TO "email_preferences";

-- Step 2: Fix data types for users table
-- First, add a new UUID column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'uuid_id'
  ) THEN
    ALTER TABLE "public"."users" ADD COLUMN "uuid_id" UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Update the UUID column with values from the text ID where possible
UPDATE "public"."users" 
SET "uuid_id" = "id"::UUID 
WHERE "id" IS NOT NULL AND "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Drop the primary key constraint if it exists
ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_pkey";

-- Rename the columns
ALTER TABLE "public"."users" RENAME COLUMN "id" TO "old_id";
ALTER TABLE "public"."users" RENAME COLUMN "uuid_id" TO "id";

-- Add primary key constraint
ALTER TABLE "public"."users" ADD PRIMARY KEY ("id");

-- Step 3: Fix column types
ALTER TABLE "public"."users" 
  ALTER COLUMN "role" TYPE user_role USING role::user_role,
  ALTER COLUMN "email" SET NOT NULL,
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING CASE WHEN created_at IS NULL THEN NOW() ELSE created_at::timestamp with time zone END,
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING CASE WHEN updated_at IS NULL THEN NOW() ELSE updated_at::timestamp with time zone END;

-- Step 4: Set default values for timestamps
ALTER TABLE "public"."users" 
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Step 5: Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS "set_updated_at" ON "public"."users";
CREATE TRIGGER "set_updated_at"
  BEFORE UPDATE ON "public"."users"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Update RLS policies to use UUID
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."users";
CREATE POLICY "Users can view own profile"
  ON "public"."users"
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
CREATE POLICY "Users can update own profile"
  ON "public"."users"
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Admins can view all profiles" ON "public"."users";
CREATE POLICY "Admins can view all profiles"
  ON "public"."users"
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON "public"."users";
CREATE POLICY "Admins can manage all profiles"
  ON "public"."users"
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Step 7: Update is_admin function to use UUID
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
  LANGUAGE "sql" SECURITY DEFINER
  AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::uuid
    AND role IN ('admin', 'super_admin')
  );
$$; 