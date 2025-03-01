-- Final schema fixes for all tables

-- Step 1: Fix column names in users table (ensure snake_case)
ALTER TABLE "public"."users" 
  RENAME COLUMN "displayname" TO "display_name";
ALTER TABLE "public"."users" 
  RENAME COLUMN "customdisplayname" TO "custom_display_name";
ALTER TABLE "public"."users" 
  RENAME COLUMN "photourl" TO "avatar_url";
ALTER TABLE "public"."users" 
  RENAME COLUMN "creditscore" TO "credit_score";
ALTER TABLE "public"."users" 
  RENAME COLUMN "monthlyincome" TO "monthly_income";
ALTER TABLE "public"."users" 
  RENAME COLUMN "businessverified" TO "business_verified";
ALTER TABLE "public"."users" 
  RENAME COLUMN "householdid" TO "household_id";
ALTER TABLE "public"."users" 
  RENAME COLUMN "emailpreferences" TO "email_preferences";
ALTER TABLE "public"."users" 
  RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."users" 
  RENAME COLUMN "updatedat" TO "updated_at";

-- Step 2: Fix column names in opportunities table (ensure snake_case)
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "cardimage" TO "card_image";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "offerlink" TO "offer_link";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "processingstatus" TO "processing_status";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "sourceid" TO "source_id";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "aiinsights" TO "ai_insights";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN "updatedat" TO "updated_at";

-- Step 3: Fix column names in staged_offers table (ensure snake_case)
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "cardimage" TO "card_image";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "offerlink" TO "offer_link";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "processingstatus" TO "processing_status";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "sourceid" TO "source_id";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "aiinsights" TO "ai_insights";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN "updatedat" TO "updated_at";

-- Step 4: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON opportunities;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON staged_offers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON staged_offers
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

-- Step 8: Update RLS policies for opportunities
DROP POLICY IF EXISTS "Users can view their own opportunities" ON "public"."opportunities";
CREATE POLICY "Users can view their own opportunities"
  ON "public"."opportunities"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can update own opportunities" ON "public"."opportunities";
CREATE POLICY "Users can update own opportunities"
  ON "public"."opportunities"
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can delete own opportunities" ON "public"."opportunities";
CREATE POLICY "Users can delete own opportunities"
  ON "public"."opportunities"
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can create opportunities" ON "public"."opportunities";
CREATE POLICY "Users can create opportunities"
  ON "public"."opportunities"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to opportunities" ON "public"."opportunities";
CREATE POLICY "Admins have full access to opportunities"
  ON "public"."opportunities"
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view approved opportunities" ON "public"."opportunities";
CREATE POLICY "Public can view approved opportunities"
  ON "public"."opportunities"
  FOR SELECT
  TO authenticated, anon
  USING (status = 'approved');

-- Step 9: Update RLS policies for staged_offers
DROP POLICY IF EXISTS "Admins can manage staged offers" ON "public"."staged_offers";
CREATE POLICY "Admins can manage staged offers"
  ON "public"."staged_offers"
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Step 10: Add user_id column to opportunities if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "public"."opportunities" ADD COLUMN "user_id" UUID;
  END IF;
END $$;

-- Step 11: Add user_id column to staged_offers if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staged_offers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "public"."staged_offers" ADD COLUMN "user_id" UUID;
  END IF;
END $$;

-- Step 12: Add foreign key constraints
ALTER TABLE "public"."opportunities" 
  DROP CONSTRAINT IF EXISTS "opportunities_user_id_fkey",
  ADD CONSTRAINT "opportunities_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "public"."users"("id") 
  ON DELETE CASCADE;

ALTER TABLE "public"."staged_offers" 
  DROP CONSTRAINT IF EXISTS "staged_offers_user_id_fkey",
  ADD CONSTRAINT "staged_offers_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "public"."users"("id") 
  ON DELETE CASCADE;
