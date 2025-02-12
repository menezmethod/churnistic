import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CallableRequest } from 'firebase-functions/v2/https';

import { UserRole, Permission } from '@/lib/auth/types';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

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

async function isAdmin(uid: string): Promise<boolean> {
  const now = Date.now();
  const cached = adminCache.get(uid);

  if (cached && now - cached.timestamp < ADMIN_CACHE_TTL) {
    return cached.isAdmin;
  }

  try {
    const user = await admin.auth().getUser(uid);
    const isAdminUser = user.customClaims?.role === UserRole.ADMIN;
    adminCache.set(uid, { isAdmin: isAdminUser, timestamp: now });
    return isAdminUser;
  } catch {
    return false;
  }
}

interface AuthContext {
  uid: string;
  token: {
    auth_time: number;
    permissions?: Permission[];
  };
}

interface RequestContext {
  auth: AuthContext | null;
  rawRequest: {
    ip: string;
  };
}

// Secure function to validate user session
async function validateSession(context: RequestContext): Promise<void> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  // Check if the token is not too old (max 1 hour)
  const authTime = context.auth.token.auth_time * 1000; // Convert to milliseconds
  const maxAge = 60 * 60 * 1000; // 1 hour
  if (Date.now() - authTime > maxAge) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Session expired. Please re-authenticate.'
    );
  }
}

interface SetUserRoleData {
  uid: string;
  role: UserRole;
}

export const listUsers = functions.https.onCall(async (request: CallableRequest) => {
  const context: RequestContext = {
    auth: request.auth
      ? {
          uid: request.auth.uid,
          token: {
            auth_time: Math.floor(Date.now() / 1000),
          },
        }
      : null,
    rawRequest: {
      ip: request.rawRequest?.ip || 'unknown',
    },
  };

  const ip = context.rawRequest.ip;
  if (!checkRateLimit(ip)) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }

  await validateSession(context);

  if (!context.auth || !(await isAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can list users'
    );
  }

  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = await Promise.all(
      listUsersResult.users.map(async (user) => {
        const customClaims = (await admin.auth().getUser(user.uid)).customClaims;
        return {
          uid: user.uid,
          email: user.email,
          role: customClaims?.role || UserRole.FREE_USER,
          lastSignIn: user.metadata.lastSignInTime,
          permissions: customClaims?.permissions || [],
        };
      })
    );
    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    throw new functions.https.HttpsError('internal', 'Error listing users');
  }
});

export const setUserRole = functions.https.onCall(
  async (request: CallableRequest<SetUserRoleData>) => {
    const context: RequestContext = {
      auth: request.auth
        ? {
            uid: request.auth.uid,
            token: {
              auth_time: Math.floor(Date.now() / 1000),
            },
          }
        : null,
      rawRequest: {
        ip: request.rawRequest?.ip || 'unknown',
      },
    };

    const ip = context.rawRequest.ip;
    if (!checkRateLimit(ip)) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many requests. Please try again later.'
      );
    }

    await validateSession(context);

    if (!context.auth || !(await isAdmin(context.auth.uid))) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can set user roles'
      );
    }

    if (!context.auth?.token.permissions?.includes(Permission.MANAGE_USERS)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Insufficient permissions'
      );
    }

    const { uid, role } = request.data;
    if (!uid || !role || !Object.values(UserRole).includes(role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid role. Valid roles: ${Object.values(UserRole).join(', ')}`
      );
    }

    try {
      // Prevent changing the role of the super admin
      const targetUser = await admin.auth().getUser(uid);

      // Additional security checks
      if (targetUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Cannot modify super admin role'
        );
      }

      // Prevent elevation to admin role by non-super admins
      const callerUser = await admin.auth().getUser(context.auth.uid);
      if (role === UserRole.ADMIN && !callerUser.customClaims?.isSuperAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only super admins can create new admins'
        );
      }

      await admin.auth().setCustomUserClaims(uid, { role });

      // Clear admin cache if role was changed to/from admin
      adminCache.delete(uid);

      return { success: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error('Error setting user role:', error);
      throw new functions.https.HttpsError('internal', 'Error setting user role');
    }
  }
);

// Function to set up initial admin user with enhanced security
export const setupInitialAdmin = functions.https.onRequest(async (req, res) => {
  // Enhanced security checks
  const setupKey = req.headers['x-setup-key'];
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const expectedSetupKey = process.env.ADMIN_SETUP_KEY;

  // Validate setup conditions
  if (!adminEmail || !expectedSetupKey) {
    console.error('Missing required environment variables for admin setup');
    res.status(500).json({
      success: false,
      error: 'Server configuration error',
    });
    return;
  }

  // Only allow in development or with correct setup key
  if (process.env.NODE_ENV !== 'development' && setupKey !== expectedSetupKey) {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    // Check if super admin already exists
    const existingUsers = await admin.auth().listUsers();
    const existingSuperAdmin = existingUsers.users.find(
      (user) => user.customClaims?.isSuperAdmin
    );

    if (existingSuperAdmin) {
      res.status(400).json({
        success: false,
        error: 'Super admin already exists',
      });
      return;
    }

    const user = await admin.auth().getUserByEmail(adminEmail);
    await admin.auth().setCustomUserClaims(user.uid, {
      role: UserRole.ADMIN,
      isSuperAdmin: true,
    });

    // Clear admin cache
    adminCache.delete(user.uid);

    res.json({
      success: true,
      message: 'Admin user set up successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error setting up admin user',
      timestamp: new Date().toISOString(),
    });
  }
});
