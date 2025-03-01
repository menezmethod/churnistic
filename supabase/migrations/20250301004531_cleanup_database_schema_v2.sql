-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can create opportunities" ON "public"."opportunities";
DROP POLICY IF EXISTS "Users can delete own opportunities" ON "public"."opportunities";
DROP POLICY IF EXISTS "Users can update own opportunities" ON "public"."opportunities";
DROP POLICY IF EXISTS "Users can view their own opportunities" ON "public"."opportunities";
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
DROP POLICY IF EXISTS "Admins can manage all profiles" ON "public"."users";
DROP POLICY IF EXISTS "Admins can view all profiles" ON "public"."users";
DROP POLICY IF EXISTS "Admins can manage staged offers" ON "public"."staged_offers";
DROP POLICY IF EXISTS "Admins have full access to opportunities" ON "public"."opportunities";
DROP POLICY IF EXISTS "Public can view approved opportunities" ON "public"."opportunities";

-- Step 2: Drop Firebase-specific columns
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "firestore_id";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "firebaseUid";
ALTER TABLE "public"."opportunities" DROP COLUMN IF EXISTS "firestore_id";
ALTER TABLE "public"."staged_offers" DROP COLUMN IF EXISTS "firestore_id";

-- Step 3: Rename columns to lowercase
ALTER TABLE "public"."users"
    RENAME COLUMN "createdAt" TO "createdat";
ALTER TABLE "public"."users"
    RENAME COLUMN "updatedAt" TO "updatedat";
ALTER TABLE "public"."users"
    RENAME COLUMN "displayName" TO "displayname";
ALTER TABLE "public"."users"
    RENAME COLUMN "customDisplayName" TO "customdisplayname";
ALTER TABLE "public"."users"
    RENAME COLUMN "photoURL" TO "photourl";
ALTER TABLE "public"."users"
    RENAME COLUMN "creditScore" TO "creditscore";
ALTER TABLE "public"."users"
    RENAME COLUMN "monthlyIncome" TO "monthlyincome";
ALTER TABLE "public"."users"
    RENAME COLUMN "businessVerified" TO "businessverified";
ALTER TABLE "public"."users"
    RENAME COLUMN "householdId" TO "householdid";
ALTER TABLE "public"."users"
    RENAME COLUMN "emailPreferences" TO "emailpreferences";

ALTER TABLE "public"."opportunities"
    RENAME COLUMN "createdAt" TO "createdat";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "updatedAt" TO "updatedat";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "ai_insights" TO "aiinsights";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "card_image" TO "cardimage";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "offer_link" TO "offerlink";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "processing_status" TO "processingstatus";
ALTER TABLE "public"."opportunities"
    RENAME COLUMN "source_id" TO "sourceid";

ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "createdAt" TO "createdat";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "updatedAt" TO "updatedat";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "ai_insights" TO "aiinsights";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "card_image" TO "cardimage";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "offer_link" TO "offerlink";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "processing_status" TO "processingstatus";
ALTER TABLE "public"."staged_offers"
    RENAME COLUMN "source_id" TO "sourceid";

-- Step 4: Add temporary columns for UUID migration
ALTER TABLE "public"."users" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."opportunities" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."staged_offers" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid();

-- Step 5: Update data types and add constraints
ALTER TABLE "public"."users"
    ALTER COLUMN "role" SET DATA TYPE user_role USING role::user_role,
    ALTER COLUMN "email" SET NOT NULL,
    ALTER COLUMN "createdat" SET DATA TYPE timestamp with time zone USING createdat::timestamp with time zone,
    ALTER COLUMN "updatedat" SET DATA TYPE timestamp with time zone USING updatedat::timestamp with time zone;

-- Step 5.1: Add temporary type column and update data
ALTER TABLE "public"."opportunities" ADD COLUMN "temp_type" text;
UPDATE "public"."opportunities" SET "temp_type" = 
    CASE 
        WHEN "type" = 'bank' THEN 'bank_account'
        WHEN "type" = 'credit' THEN 'credit_card'
        WHEN "type" = 'brokerage' THEN 'brokerages'
        ELSE 'credit_card'
    END;
ALTER TABLE "public"."opportunities" DROP COLUMN "type";
ALTER TABLE "public"."opportunities" ADD COLUMN "type" opportunity_type;
UPDATE "public"."opportunities" SET "type" = temp_type::opportunity_type;
ALTER TABLE "public"."opportunities" DROP COLUMN "temp_type";

ALTER TABLE "public"."staged_offers" ADD COLUMN "temp_type" text;
UPDATE "public"."staged_offers" SET "temp_type" = 
    CASE 
        WHEN "type" = 'bank' THEN 'bank_account'
        WHEN "type" = 'credit' THEN 'credit_card'
        WHEN "type" = 'brokerage' THEN 'brokerages'
        ELSE 'credit_card'
    END;
ALTER TABLE "public"."staged_offers" DROP COLUMN "type";
ALTER TABLE "public"."staged_offers" ADD COLUMN "type" opportunity_type;
UPDATE "public"."staged_offers" SET "type" = temp_type::opportunity_type;
ALTER TABLE "public"."staged_offers" DROP COLUMN "temp_type";

-- Step 5.2: Continue with other constraints
ALTER TABLE "public"."opportunities"
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "createdat" SET DATA TYPE timestamp with time zone USING createdat::timestamp with time zone,
    ALTER COLUMN "updatedat" SET DATA TYPE timestamp with time zone USING updatedat::timestamp with time zone;

ALTER TABLE "public"."staged_offers"
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "createdat" SET DATA TYPE timestamp with time zone USING createdat::timestamp with time zone,
    ALTER COLUMN "updatedat" SET DATA TYPE timestamp with time zone USING updatedat::timestamp with time zone;

-- Step 6: Drop old ID columns and rename new ones
ALTER TABLE "public"."users" DROP COLUMN "id";
ALTER TABLE "public"."users" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE "public"."opportunities" DROP COLUMN "id";
ALTER TABLE "public"."opportunities" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."staged_offers" DROP COLUMN "id";
ALTER TABLE "public"."staged_offers" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "public"."staged_offers" ADD CONSTRAINT "staged_offers_pkey" PRIMARY KEY ("id");

-- Step 7: Add GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS "opportunities_metadata_idx" ON "public"."opportunities" USING GIN ("metadata");
CREATE INDEX IF NOT EXISTS "opportunities_source_idx" ON "public"."opportunities" USING GIN ("source");
CREATE INDEX IF NOT EXISTS "opportunities_bonus_idx" ON "public"."opportunities" USING GIN ("bonus");
CREATE INDEX IF NOT EXISTS "opportunities_details_idx" ON "public"."opportunities" USING GIN ("details");
CREATE INDEX IF NOT EXISTS "opportunities_aiinsights_idx" ON "public"."opportunities" USING GIN ("aiinsights");

CREATE INDEX IF NOT EXISTS "staged_offers_metadata_idx" ON "public"."staged_offers" USING GIN ("metadata");
CREATE INDEX IF NOT EXISTS "staged_offers_source_idx" ON "public"."staged_offers" USING GIN ("source");
CREATE INDEX IF NOT EXISTS "staged_offers_bonus_idx" ON "public"."staged_offers" USING GIN ("bonus");
CREATE INDEX IF NOT EXISTS "staged_offers_details_idx" ON "public"."staged_offers" USING GIN ("details");
CREATE INDEX IF NOT EXISTS "staged_offers_aiinsights_idx" ON "public"."staged_offers" USING GIN ("aiinsights");

CREATE INDEX IF NOT EXISTS "users_creditscore_idx" ON "public"."users" USING GIN ("creditscore");
CREATE INDEX IF NOT EXISTS "users_monthlyincome_idx" ON "public"."users" USING GIN ("monthlyincome");
CREATE INDEX IF NOT EXISTS "users_emailpreferences_idx" ON "public"."users" USING GIN ("emailpreferences");
CREATE INDEX IF NOT EXISTS "users_notifications_idx" ON "public"."users" USING GIN ("notifications");
CREATE INDEX IF NOT EXISTS "users_privacy_idx" ON "public"."users" USING GIN ("privacy");
CREATE INDEX IF NOT EXISTS "users_preferences_idx" ON "public"."users" USING GIN ("preferences");

-- Step 8: Add updated_at triggers
CREATE TRIGGER "set_updated_at"
    BEFORE UPDATE ON "public"."users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "set_updated_at"
    BEFORE UPDATE ON "public"."opportunities"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "set_updated_at"
    BEFORE UPDATE ON "public"."staged_offers"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create new policies using UUID
CREATE POLICY "Users can create opportunities"
    ON "public"."opportunities"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can delete own opportunities"
    ON "public"."opportunities"
    FOR DELETE
    TO authenticated
    USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own opportunities"
    ON "public"."opportunities"
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid()::uuid)
    WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Users can view their own opportunities"
    ON "public"."opportunities"
    FOR SELECT
    TO authenticated
    USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own profile"
    ON "public"."users"
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid()::uuid)
    WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Users can view own profile"
    ON "public"."users"
    FOR SELECT
    TO authenticated
    USING (id = auth.uid()::uuid);

CREATE POLICY "Admins can manage all profiles"
    ON "public"."users"
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all profiles"
    ON "public"."users"
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage staged offers"
    ON "public"."staged_offers"
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to opportunities"
    ON "public"."opportunities"
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Public can view approved opportunities"
    ON "public"."opportunities"
    FOR SELECT
    TO authenticated, anon
    USING (status = 'approved');

-- Step 10: Add default timestamps
ALTER TABLE "public"."users" 
    ALTER COLUMN "createdat" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedat" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."opportunities" 
    ALTER COLUMN "createdat" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedat" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."staged_offers" 
    ALTER COLUMN "createdat" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedat" SET DEFAULT CURRENT_TIMESTAMP;
