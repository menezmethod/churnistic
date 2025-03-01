-- Fix column names in users table (ensure snake_case)
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

-- Fix column names in opportunities table (ensure snake_case)
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

-- Fix column names in staged_offers table (ensure snake_case)
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
