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

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    console.log('URL:', `${supabaseUrl}/functions/v1/bulk-operations?action=reset_all`);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/bulk-operations?action=reset_all`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      }
    );

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      console.error('Error response:', result);
      throw new Error(result.message || result.error || 'Failed to reset database');
    }

    console.log('Database reset successfully:', result);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 