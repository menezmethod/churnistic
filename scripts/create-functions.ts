import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function createFunctions() {
  try {
    console.log('Creating functions...');
    console.log('URL:', `${supabaseUrl}/functions/v1/bulk-operations?action=create_functions`);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/bulk-operations?action=create_functions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create functions');
    }

    const result = await response.json();
    console.log('Functions created successfully:', result);
  } catch (error) {
    console.error('Error creating functions:', error);
    process.exit(1);
  }
}

createFunctions(); 