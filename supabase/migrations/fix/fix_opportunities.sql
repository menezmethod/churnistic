-- Fix opportunities table schema

-- Step 1: Fix column names in opportunities table (ensure snake_case)
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "createdAt" TO "created_at";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "updatedAt" TO "updated_at";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "ai_insights" TO "ai_insights";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "card_image" TO "card_image";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "offer_link" TO "offer_link";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "processing_status" TO "processing_status";
ALTER TABLE "public"."opportunities" 
  RENAME COLUMN IF EXISTS "source_id" TO "source_id";

-- Step 2: Fix data types for opportunities table
-- First, add a new UUID column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'uuid_id'
  ) THEN
    ALTER TABLE "public"."opportunities" ADD COLUMN "uuid_id" UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Update the UUID column with values from the text ID where possible
UPDATE "public"."opportunities" 
SET "uuid_id" = "id"::UUID 
WHERE "id" IS NOT NULL AND "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Drop the primary key constraint if it exists
ALTER TABLE "public"."opportunities" DROP CONSTRAINT IF EXISTS "opportunities_pkey";

-- Rename the columns
ALTER TABLE "public"."opportunities" RENAME COLUMN "id" TO "old_id";
ALTER TABLE "public"."opportunities" RENAME COLUMN "uuid_id" TO "id";

-- Add primary key constraint
ALTER TABLE "public"."opportunities" ADD PRIMARY KEY ("id");

-- Step 3: Fix column types
ALTER TABLE "public"."opportunities" 
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING CASE WHEN created_at IS NULL THEN NOW() ELSE created_at::timestamp with time zone END,
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING CASE WHEN updated_at IS NULL THEN NOW() ELSE updated_at::timestamp with time zone END;

-- Step 4: Set default values for timestamps
ALTER TABLE "public"."opportunities" 
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Step 5: Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS "set_updated_at" ON "public"."opportunities";
CREATE TRIGGER "set_updated_at"
  BEFORE UPDATE ON "public"."opportunities"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Update RLS policies to use UUID
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

-- Step 7: Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "public"."opportunities" ADD COLUMN "user_id" UUID;
  END IF;
END $$;

-- Update user_id from firestore_id if it exists
UPDATE "public"."opportunities" o
SET "user_id" = u.id
FROM "public"."users" u
WHERE o."firestore_id" = u."old_id";

-- Add foreign key constraint
ALTER TABLE "public"."opportunities" 
  ADD CONSTRAINT "opportunities_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "public"."users"("id") 
  ON DELETE CASCADE; 