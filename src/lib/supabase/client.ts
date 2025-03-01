import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/supabase';

// Define the storage key consistently across all client instances
const STORAGE_KEY = 'sb-upumyguwlzscczhanlhd-auth-token';
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Create a single supabase client for the browser
export const createClient = () => {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }

  console.log('[Supabase Client] Initializing with URL:', supabaseUrl);

  // Log browser environment for debugging
  if (typeof window !== 'undefined') {
    console.log('[Supabase Client] Browser environment:', {
      localStorage: !!window.localStorage,
      cookiesEnabled: navigator.cookieEnabled,
      userAgent: navigator.userAgent,
    });
  }

  // Initialize client with the createBrowserClient function from @supabase/ssr
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

  console.log('[Supabase Client] Client created successfully');

  return browserClient;
};

// Export a singleton instance for client-side usage
export const supabase = createClient();

// Admin client for server-side operations (only used in API routes)
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables for admin client');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper to get user's role and permissions
export const getUserRoleAndPermissions = async () => {
  try {
    console.log('[getUserRoleAndPermissions] Starting to fetch user role and permissions');
    const client = supabase;
    if (!client) {
      console.error('[getUserRoleAndPermissions] Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    // Use getUser() for security instead of getSession()
    console.log('[getUserRoleAndPermissions] Getting current user');
    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();
    
    console.log('[getUserRoleAndPermissions] Auth user result:', { 
      exists: !!user, 
      id: user?.id,
      email: user?.email,
      error: userError?.message
    });
    
    if (!user) {
      console.log('[getUserRoleAndPermissions] No authenticated user, returning default role');
      return {
        role: 'user',
        permissions: [],
      };
    }

    console.log('[getUserRoleAndPermissions] Fetching session for access token');
    const sessionResult = await client.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;
    
    console.log('[getUserRoleAndPermissions] Session result:', { 
      hasSession: !!sessionResult.data.session,
      hasAccessToken: !!accessToken,
      error: sessionResult.error?.message
    });
    
    if (!accessToken) {
      console.error('[getUserRoleAndPermissions] No access token available');
      return {
        role: 'user',
        permissions: [],
      };
    }

    console.log('[getUserRoleAndPermissions] Fetching user role from API');
    const response = await fetch('/api/auth/user-role', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[getUserRoleAndPermissions] API response status:', response.status);
    
    if (!response.ok) {
      console.error('[getUserRoleAndPermissions] Failed to fetch user role, status:', response.status);
      throw new Error('Failed to fetch user role');
    }

    const data = await response.json();
    console.log('[getUserRoleAndPermissions] User role data received:', data);
    
    return {
      role: data.role || 'user',
      permissions: data.permissions || [],
    };
  } catch (error) {
    console.error('[getUserRoleAndPermissions] Error fetching user role:', error);
    return {
      role: 'user',
      permissions: [],
    };
  }
};
