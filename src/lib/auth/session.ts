import type { NextRequest } from 'next/server';

export async function verifySession(request: NextRequest): Promise<Response> {
  const session = request.cookies.get('__session')?.value;
  if (!session) {
    return new Response(null, { status: 401 });
  }

  // Verify the session by making a request to our API
  return fetch(new URL('/api/auth/session', request.url), {
    headers: {
      Cookie: `__session=${session}`,
    },
  });
}
