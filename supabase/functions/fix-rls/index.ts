// Follow this setup guide to integrate the Deno runtime and Supabase functions:
// https://supabase.com/docs/guides/functions/deno-runtime

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // SQL to fix RLS policies
    const sql = `
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
    EXCEPTION
      WHEN OTHERS THEN
        RETURN false;
    END;
    $$;
    `

    // Execute the SQL
    const { error } = await supabaseClient.rpc('exec_sql', { sql })

    if (error) {
      console.error('Error executing SQL:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'RLS policies fixed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 