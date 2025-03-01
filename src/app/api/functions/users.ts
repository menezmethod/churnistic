import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration
const rateLimit = {
  maxRequests: 50,
  periodSeconds: 60,
};

// IP-based rate limiting
const ipRequests = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const request = ipRequests.get(ip) || {
    count: 0,
    resetTime: now + rateLimit.periodSeconds * 1000,
  };

  if (now > request.resetTime) {
    request.count = 1;
    request.resetTime = now + rateLimit.periodSeconds * 1000;
  } else {
    request.count++;
  }

  ipRequests.set(ip, request);
  return request.count <= rateLimit.maxRequests;
}

// Enhanced admin check with caching
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function isAdmin(userId: string): Promise<boolean> {
  const now = Date.now();
  const cached = adminCache.get(userId);

  if (cached && now - cached.timestamp < ADMIN_CACHE_TTL) {
    return cached.isAdmin;
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const isAdminUser = user?.role === UserRole.ADMIN;
    adminCache.set(userId, { isAdmin: isAdminUser, timestamp: now });
    return isAdminUser;
  } catch {
    return false;
  }
}

// Secure function to validate user session
async function validateSession(
  token: string
): Promise<{ userId: string; authTime: number }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Authentication required');
  }

  // Check if the token is not too old (max 1 hour)
  const authTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  if (
    user.last_sign_in_at &&
    new Date(user.last_sign_in_at).getTime() / 1000 < authTime
  ) {
    throw new Error('Session expired. Please re-authenticate.');
  }

  return {
    userId: user.id,
    authTime: new Date(user.last_sign_in_at || Date.now()).getTime() / 1000,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { userId } = await validateSession(token);
    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Only admins can list users' }, { status: 403 });
    }

    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const usersWithRoles = await Promise.all(
      users.users.map(async (user) => {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          role: userData?.role || UserRole.USER,
          lastSignIn: user.last_sign_in_at,
        };
      })
    );

    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Error listing users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { userId } = await validateSession(token);
    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Only admins can set user roles' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, role } = body;

    if (!targetUserId || !role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid user ID or role' }, { status: 400 });
    }

    // Get the target user
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('email')
      .eq('id', targetUserId)
      .single();

    if (targetUserError) throw targetUserError;

    // Additional security checks
    if (targetUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Cannot modify super admin role' },
        { status: 403 }
      );
    }

    // Prevent elevation to admin role by non-super admins
    const { data: callerUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (role === UserRole.ADMIN && callerUser?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create new admins' },
        { status: 403 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', targetUserId);

    if (updateError) throw updateError;

    // Clear admin cache
    adminCache.delete(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json({ error: 'Error setting user role' }, { status: 500 });
  }
}

// Function to set up initial admin user with enhanced security
export async function setupInitialAdmin(req: NextRequest) {
  // Enhanced security checks
  const setupKey = req.headers.get('x-setup-key');
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const expectedSetupKey = process.env.ADMIN_SETUP_KEY;

  // Validate setup conditions
  if (!adminEmail || !expectedSetupKey) {
    console.error('Missing required environment variables for admin setup');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Only allow in development or with correct setup key
  if (process.env.NODE_ENV !== 'development' && setupKey !== expectedSetupKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Admin user already exists' }, { status: 400 });
    }

    // Create admin user
    const {
      data: { user },
      error: createError,
    } = await supabase.auth.admin.createUser({
      email: adminEmail,
      email_confirm: true,
      user_metadata: {
        role: UserRole.ADMIN,
      },
    });

    if (createError) throw createError;

    // Set up admin user in the users table
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: user!.id,
        email: adminEmail,
        role: UserRole.ADMIN,
        display_name: 'Admin',
      },
    ]);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Initial admin user created successfully',
    });
  } catch (error) {
    console.error('Error setting up initial admin:', error);
    return NextResponse.json(
      { error: 'Error setting up initial admin' },
      { status: 500 }
    );
  }
}
