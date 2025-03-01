import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function verifySessionCookie(sessionCookie: string) {
  try {
    // Create a server client with the service role for admin operations
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            // We don't need to set cookies in this context
          },
          remove() {
            // We don't need to remove cookies in this context
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionCookie);

    if (error) throw error;
    if (!user) throw new Error('User not found');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('User data not found');

    return {
      ...user,
      ...userData,
    };
  } catch (error) {
    console.error('Failed to verify session:', error);
    throw error;
  }
}
