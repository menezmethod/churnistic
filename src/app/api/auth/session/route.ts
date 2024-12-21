import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { UserRole, Permission } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/admin';

interface DecodedToken {
  user_id?: string;
  uid?: string;
  email?: string;
  role?: UserRole;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
}

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

// Helper function to get user claims
async function getUserClaims(
  uid: string,
  decodedToken?: DecodedToken
): Promise<CustomClaims> {
  try {
    let role: UserRole;
    let permissions: Permission[];
    let isSuperAdmin: boolean;

    if (useEmulators && decodedToken) {
      // In emulator mode, use the claims from the token
      role = (decodedToken.role as UserRole) || UserRole.USER;
      permissions = decodedToken.permissions || [];
      isSuperAdmin = decodedToken.isSuperAdmin || false;
    } else {
      const user = await auth.getUser(uid);
      const claims = (user.customClaims || {}) as CustomClaims;
      role = claims.role || UserRole.USER;
      permissions = claims.permissions || [];
      isSuperAdmin = claims.isSuperAdmin || false;
    }

    // Always ensure we have the full set of permissions for the role
    const rolePermissions = ROLE_PERMISSIONS[role];

    // Merge existing permissions with role permissions to ensure we have all required ones
    permissions = Array.from(
      new Set([
        ...permissions,
        ...rolePermissions,
        // Always include basic profile and settings permissions
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_OWN_SETTINGS,
        Permission.EDIT_OWN_SETTINGS,
      ])
    );

    // For super admins, ensure they have all permissions
    if (isSuperAdmin) {
      permissions = Object.values(Permission);
    }

    console.log('Resolved permissions:', {
      role,
      permissions,
      isSuperAdmin,
    });

    return {
      role,
      permissions,
      isSuperAdmin,
    };
  } catch (error) {
    console.error('Error getting user claims:', error);
    // Default to USER role with its permissions
    const defaultPermissions = [
      ...ROLE_PERMISSIONS[UserRole.USER],
      Permission.VIEW_OWN_PROFILE,
      Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_OWN_SETTINGS,
      Permission.EDIT_OWN_SETTINGS,
    ];
    return {
      role: UserRole.USER,
      permissions: defaultPermissions,
      isSuperAdmin: false,
    };
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
        // In emulator mode, get claims from the token
        customClaims = await getUserClaims(decodedToken.user_id, decodedToken);
      } else {
        decodedToken = await auth.verifyIdToken(session.value);
        customClaims = await getUserClaims(decodedToken.uid);
      }

      console.log('GET - Session data:', { decodedToken, customClaims });

      return NextResponse.json({
        uid: decodedToken.uid || decodedToken.user_id,
        email: decodedToken.email,
        role: customClaims.role || UserRole.USER,
        permissions:
          customClaims.permissions ||
          ROLE_PERMISSIONS[customClaims.role || UserRole.USER],
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
        // In emulator mode, get claims from the token
        customClaims = await getUserClaims(decodedToken.user_id, decodedToken);
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
          permissions:
            customClaims.permissions ||
            ROLE_PERMISSIONS[customClaims.role || UserRole.USER],
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
