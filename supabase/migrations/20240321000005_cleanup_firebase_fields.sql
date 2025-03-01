-- Remove Firebase-specific fields and standardize timestamps

-- Remove Firebase ID fields
ALTER TABLE opportunities DROP COLUMN IF EXISTS firestore_id;
ALTER TABLE users DROP COLUMN IF EXISTS firestore_id;
ALTER TABLE users DROP COLUMN IF EXISTS firebaseuid;
ALTER TABLE staged_offers DROP COLUMN IF EXISTS firestore_id;

-- Standardize timestamps
ALTER TABLE opportunities
  ALTER COLUMN "createdat" SET DEFAULT now(),
  ALTER COLUMN "updatedat" SET DEFAULT now();

ALTER TABLE users
  ALTER COLUMN "created_at" SET DEFAULT now(),
  ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE staged_offers
  ALTER COLUMN "createdat" SET DEFAULT now(),
  ALTER COLUMN "updatedat" SET DEFAULT now();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at on all tables
DROP TRIGGER IF EXISTS set_timestamp ON opportunities;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp ON users;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp ON staged_offers;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON staged_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS opportunities_metadata_idx ON opportunities USING GIN (metadata);
CREATE INDEX IF NOT EXISTS opportunities_source_idx ON opportunities USING GIN (source);
CREATE INDEX IF NOT EXISTS opportunities_bonus_idx ON opportunities USING GIN (bonus);
CREATE INDEX IF NOT EXISTS opportunities_details_idx ON opportunities USING GIN (details);
CREATE INDEX IF NOT EXISTS opportunities_logo_idx ON opportunities USING GIN (logo);
CREATE INDEX IF NOT EXISTS opportunities_card_image_idx ON opportunities USING GIN (cardimage);
CREATE INDEX IF NOT EXISTS opportunities_processing_status_idx ON opportunities USING GIN (processingstatus);
CREATE INDEX IF NOT EXISTS opportunities_ai_insights_idx ON opportunities USING GIN (aiinsights);

CREATE INDEX IF NOT EXISTS users_credit_score_idx ON users USING GIN (credit_score);
CREATE INDEX IF NOT EXISTS users_monthly_income_idx ON users USING GIN (monthly_income);
CREATE INDEX IF NOT EXISTS users_household_id_idx ON users USING GIN (household_id);
CREATE INDEX IF NOT EXISTS users_email_preferences_idx ON users USING GIN (email_preferences);
CREATE INDEX IF NOT EXISTS users_notifications_idx ON users USING GIN (notifications);
CREATE INDEX IF NOT EXISTS users_privacy_idx ON users USING GIN (privacy);
CREATE INDEX IF NOT EXISTS users_preferences_idx ON users USING GIN (preferences); 