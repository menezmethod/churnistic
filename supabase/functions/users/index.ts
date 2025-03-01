import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

import { corsHeaders } from '../_shared/cors.ts';

enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

interface UserRequest {
  action: 'list' | 'setRole' | 'setupInitialAdmin';
  userId?: string;
  role?: UserRole;
  adminEmail?: string;
  setupKey?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the session to verify the user is authenticated
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { action, userId, role, setupKey }: UserRequest = await req.json();

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin =
      adminCheck?.role === UserRole.ADMIN || adminCheck?.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = adminCheck?.role === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'list': {
        // List all users with their roles
        const { data: users, error } = await supabaseClient
          .from('users')
          .select('id, email, role, created_at, last_sign_in_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(users), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'setRole': {
        if (!userId || !role) {
          return new Response(JSON.stringify({ error: 'Missing userId or role' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if target user is super admin
        const { data: targetUser } = await supabaseClient
          .from('users')
          .select('email, role')
          .eq('id', userId)
          .single();

        if (targetUser?.email === Deno.env.get('NEXT_PUBLIC_ADMIN_EMAIL')) {
          return new Response(
            JSON.stringify({ error: 'Cannot modify super admin role' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Only super admins can create new admins
        if (role === UserRole.ADMIN && !isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: 'Only super admins can create new admins' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Update user role
        const { error } = await supabaseClient
          .from('users')
          .update({ role })
          .eq('id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'setupInitialAdmin': {
        const adminEmail = Deno.env.get('NEXT_PUBLIC_ADMIN_EMAIL');
        const expectedSetupKey = Deno.env.get('ADMIN_SETUP_KEY');

        if (!adminEmail || !expectedSetupKey) {
          return new Response(
            JSON.stringify({ error: 'Missing required environment variables' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Verify setup key
        if (Deno.env.get('NODE_ENV') !== 'development' && setupKey !== expectedSetupKey) {
          return new Response(JSON.stringify({ error: 'Invalid setup key' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if super admin already exists
        const { data: existingSuperAdmin } = await supabaseClient
          .from('users')
          .select('id')
          .eq('role', UserRole.SUPER_ADMIN)
          .single();

        if (existingSuperAdmin) {
          return new Response(JSON.stringify({ error: 'Super admin already exists' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Set up initial admin
        const { data: adminUser } = await supabaseClient
          .from('users')
          .select('id')
          .eq('email', adminEmail)
          .single();

        if (!adminUser) {
          return new Response(JSON.stringify({ error: 'Admin user not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('users')
          .update({ role: UserRole.SUPER_ADMIN })
          .eq('id', adminUser.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Admin user set up successfully',
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
