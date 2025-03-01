import { createClient } from '@supabase/supabase-js';

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  aud: string;
  exp: number;
}

export async function verifyToken(token: string): Promise<DecodedToken> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) throw error;
    if (!user) throw new Error('User not found');

    return {
      sub: user.id,
      email: user.email!,
      role: user.user_metadata.role || 'user',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}
