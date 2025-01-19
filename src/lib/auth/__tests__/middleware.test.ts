import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url) => ({
      type: 'redirect',
      status: 302,
      headers: new Map([['location', url.toString()]]),
    })),
  },
}));

function createNextRequest(url: string, session: string = '') {
  const fullUrl = `http://localhost:3000${url}`;
  return {
    nextUrl: new URL(fullUrl),
    url: fullUrl,
    cookies: {
      get: (name: string) => {
        if (name === 'session' && session) {
          return { value: session };
        }
        return undefined;
      },
    },
  } as NextRequest;
}

// Mock console.log to avoid polluting test output
global.console = { ...global.console, log: jest.fn() };

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access to unprotected paths', async () => {
    const request = createNextRequest('/');
    const response = await middleware(request);
    expect(response).toEqual({ type: 'next' });
  });

  it('should redirect to signin for protected paths without a session', async () => {
    const protectedPaths = ['/dashboard', '/admin', '/api/users'];

    for (const path of protectedPaths) {
      const request = createNextRequest(path);
      const response = await middleware(request);
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin');
    }
  });

  it('should allow access to protected paths with valid session', async () => {
    const protectedPaths = ['/dashboard', '/admin', '/api/users'];

    for (const path of protectedPaths) {
      const request = createNextRequest(path, 'valid-session');
      const response = await middleware(request);
      expect(response).toEqual({ type: 'next' });
    }
  });

  it('should allow access to public API endpoints', async () => {
    const publicPaths = ['/api/public', '/auth/signin', '/'];

    for (const path of publicPaths) {
      const request = createNextRequest(path);
      const response = await middleware(request);
      expect(response).toEqual({ type: 'next' });
    }
  });
});
