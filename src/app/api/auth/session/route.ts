import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { UserRole, Permission } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/admin';

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

interface CustomClaims {
  role?: UserRole;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
}

// Helper function to decode JWT token in emulator mode
function decodeToken(token: string) {
  try {
    const [, payload] = token.split('.');
    const decodedToken = JSON.parse(Buffer.from(payload, 'base64').toString());
    console.log('Decoded emulator token:', decodedToken);
    return decodedToken;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Test data for emulator mode
const testUserClaims: Record<string, CustomClaims> = {
  'menezfd@gmail.com': {
    role: UserRole.ADMIN,
    permissions: [
      Permission.READ_CARDS,
      Permission.WRITE_CARDS,
      Permission.DELETE_CARDS,
      Permission.READ_BANK_ACCOUNTS,
      Permission.WRITE_BANK_ACCOUNTS,
      Permission.DELETE_BANK_ACCOUNTS,
      Permission.READ_INVESTMENTS,
      Permission.WRITE_INVESTMENTS,
      Permission.DELETE_INVESTMENTS,
      Permission.VIEW_BASIC_ANALYTICS,
      Permission.VIEW_ADVANCED_ANALYTICS,
      Permission.EXPORT_ANALYTICS,
      Permission.VIEW_RISK_SCORES,
      Permission.MANAGE_RISK_RULES,
      Permission.READ_USERS,
      Permission.WRITE_USERS,
      Permission.DELETE_USERS,
      Permission.MANAGE_SETTINGS,
      Permission.VIEW_LOGS,
      Permission.USE_API,
      Permission.MANAGE_API_KEYS,
      Permission.MANAGE_NOTIFICATIONS,
      Permission.RECEIVE_CREDIT_CARD_ALERTS,
      Permission.RECEIVE_BANK_BONUS_ALERTS,
      Permission.RECEIVE_INVESTMENT_ALERTS,
      Permission.RECEIVE_RISK_ALERTS,
    ],
    isSuperAdmin: true,
  },
};

// Helper function to get user claims
async function getUserClaims(uid: string, email?: string): Promise<CustomClaims> {
  if (useEmulators && email) {
    // In emulator mode, use test data
    const claims = testUserClaims[email];
    if (claims) {
      console.log('Using test claims for emulator:', claims);
      return claims;
    }
    // If no test data found, return default user claims
    return {
      role: UserRole.USER,
      permissions: [Permission.READ_CARDS],
      isSuperAdmin: false,
    };
  }

  try {
    const user = await auth.getUser(uid);
    return (user.customClaims || {}) as CustomClaims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    return {};
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('__session');

    if (!session?.value) {
      return NextResponse.json({ error: 'No session cookie found' }, { status: 401 });
    }

    try {
      let decodedToken;
      let customClaims: CustomClaims = {};

      if (useEmulators) {
        decodedToken = decodeToken(session.value);
        if (!decodedToken) {
          return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
        }
        // In emulator mode, get claims from test data
        customClaims = await getUserClaims(decodedToken.user_id, decodedToken.email);
      } else {
        decodedToken = await auth.verifyIdToken(session.value);
        customClaims = await getUserClaims(decodedToken.uid);
      }

      console.log('GET - Session data:', { decodedToken, customClaims });

      return NextResponse.json({
        uid: decodedToken.uid || decodedToken.user_id,
        email: decodedToken.email,
        role: customClaims.role || UserRole.USER,
        permissions: customClaims.permissions || [],
        isSuperAdmin: customClaims.isSuperAdmin || false,
        customClaims,
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    try {
      let decodedToken;
      let customClaims: CustomClaims = {};

      if (useEmulators) {
        decodedToken = decodeToken(token);
        if (!decodedToken) {
          return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
        }
        // In emulator mode, get claims from test data
        customClaims = await getUserClaims(decodedToken.user_id, decodedToken.email);
      } else {
        decodedToken = await auth.verifyIdToken(token);
        customClaims = await getUserClaims(decodedToken.uid);
      }

      console.log('POST - Session data:', { decodedToken, customClaims });

      // Set cookie options
      const options = {
        name: '__session',
        value: token,
        maxAge: 60 * 60 * 24 * 5, // 5 days
        httpOnly: true,
        secure: !useEmulators,
        path: '/',
      };

      // Set the cookie and return the session data
      const response = NextResponse.json({
        status: 'success',
        session: {
          uid: decodedToken.uid || decodedToken.user_id,
          email: decodedToken.email,
          role: customClaims.role || UserRole.USER,
          permissions: customClaims.permissions || [],
          isSuperAdmin: customClaims.isSuperAdmin || false,
          customClaims,
        },
      });
      response.cookies.set(options);

      return response;
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete('__session');
  return NextResponse.json({ success: true });
}
