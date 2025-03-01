

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."opportunity_type" AS ENUM (
    'credit_card',
    'bank_account',
    'brokerages'
);


ALTER TYPE "public"."opportunity_type" OWNER TO "postgres";


CREATE TYPE "public"."tracking_status" AS ENUM (
    'interested',
    'applied',
    'completed',
    'not_interested'
);


ALTER TYPE "public"."tracking_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'admin',
    'contributor',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" "text",
    "name" "text",
    "type" "text",
    "bank" "text",
    "value" numeric,
    "status" "text",
    "metadata" "jsonb",
    "source" "jsonb",
    "source_id" "text",
    "bonus" "jsonb",
    "details" "jsonb",
    "logo" "jsonb",
    "card_image" "jsonb",
    "offer_link" "text",
    "description" "text",
    "processing_status" "jsonb",
    "ai_insights" "jsonb",
    "createdAt" "text",
    "updatedAt" "text",
    "firestore_id" "text"
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staged_offers" (
    "id" "text",
    "name" "text",
    "type" "text",
    "bank" "text",
    "value" numeric,
    "status" "text",
    "metadata" "jsonb",
    "source" "jsonb",
    "source_id" "text",
    "bonus" "jsonb",
    "details" "jsonb",
    "logo" "jsonb",
    "card_image" "jsonb",
    "offer_link" "text",
    "description" "text",
    "processing_status" "jsonb",
    "ai_insights" "jsonb",
    "createdAt" "text",
    "updatedAt" "text",
    "firestore_id" "text"
);


ALTER TABLE "public"."staged_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text",
    "role" "text",
    "email" "text",
    "status" "text",
    "displayName" "text",
    "customDisplayName" "text",
    "photoURL" "text",
    "firebaseUid" "text",
    "creditScore" "jsonb",
    "monthlyIncome" "jsonb",
    "businessVerified" boolean,
    "createdAt" "text",
    "updatedAt" "text",
    "householdId" "jsonb",
    "firestore_id" "text",
    "bio" "text",
    "emailPreferences" "jsonb",
    "notifications" "jsonb",
    "privacy" "jsonb",
    "preferences" "jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE POLICY "Admins can manage all profiles" ON "public"."users" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage staged offers" ON "public"."staged_offers" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins have full access to opportunities" ON "public"."opportunities" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Public can view approved opportunities" ON "public"."opportunities" FOR SELECT TO "authenticated", "anon" USING (("status" = 'approved'::"text"));



CREATE POLICY "Users can create opportunities" ON "public"."opportunities" FOR INSERT TO "authenticated" WITH CHECK (("firestore_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can delete own opportunities" ON "public"."opportunities" FOR DELETE TO "authenticated" USING (("firestore_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can update own opportunities" ON "public"."opportunities" FOR UPDATE TO "authenticated" USING (("firestore_id" = ("auth"."uid"())::"text")) WITH CHECK (("firestore_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("id" = ("auth"."uid"())::"text")) WITH CHECK (("id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their own opportunities" ON "public"."opportunities" FOR SELECT TO "authenticated" USING (("firestore_id" = ("auth"."uid"())::"text"));



ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staged_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";




















































































































































































GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."staged_offers" TO "anon";
GRANT ALL ON TABLE "public"."staged_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."staged_offers" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
