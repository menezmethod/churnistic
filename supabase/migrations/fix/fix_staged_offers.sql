-- Fix staged_offers table schema

-- Step 1: Fix column names in staged_offers table (ensure snake_case)
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "createdAt" TO "created_at";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "updatedAt" TO "updated_at";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "ai_insights" TO "ai_insights";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "card_image" TO "card_image";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "offer_link" TO "offer_link";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "processing_status" TO "processing_status";
ALTER TABLE "public"."staged_offers" 
  RENAME COLUMN IF EXISTS "source_id" TO "source_id";

-- Step 2: Fix data types for staged_offers table
-- First, add a new UUID column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staged_offers' AND column_name = 'uuid_id'
  ) THEN
    ALTER TABLE "public"."staged_offers" ADD COLUMN "uuid_id" UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Update the UUID column with values from the text ID where possible
UPDATE "public"."staged_offers" 
SET "uuid_id" = "id"::UUID 
WHERE "id" IS NOT NULL AND "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Drop the primary key constraint if it exists
ALTER TABLE "public"."staged_offers" DROP CONSTRAINT IF EXISTS "staged_offers_pkey";

-- Rename the columns
ALTER TABLE "public"."staged_offers" RENAME COLUMN "id" TO "old_id";
ALTER TABLE "public"."staged_offers" RENAME COLUMN "uuid_id" TO "id";

-- Add primary key constraint
ALTER TABLE "public"."staged_offers" ADD PRIMARY KEY ("id");

-- Step 3: Fix column types
ALTER TABLE "public"."staged_offers" 
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING CASE WHEN created_at IS NULL THEN NOW() ELSE created_at::timestamp with time zone END,
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING CASE WHEN updated_at IS NULL THEN NOW() ELSE updated_at::timestamp with time zone END;

-- Step 4: Set default values for timestamps
ALTER TABLE "public"."staged_offers" 
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Step 5: Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS "set_updated_at" ON "public"."staged_offers";
CREATE TRIGGER "set_updated_at"
  BEFORE UPDATE ON "public"."staged_offers"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Update RLS policies to use UUID
DROP POLICY IF EXISTS "Admins can manage staged offers" ON "public"."staged_offers";
CREATE POLICY "Admins can manage staged offers"
  ON "public"."staged_offers"
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Step 7: Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staged_offers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "public"."staged_offers" ADD COLUMN "user_id" UUID;
  END IF;
END $$;

-- Update user_id from firestore_id if it exists
UPDATE "public"."staged_offers" o
SET "user_id" = u.id
FROM "public"."users" u
WHERE o."firestore_id" = u."old_id";

-- Add foreign key constraint
ALTER TABLE "public"."staged_offers" 
  ADD CONSTRAINT "staged_offers_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "public"."users"("id") 
  ON DELETE CASCADE; 