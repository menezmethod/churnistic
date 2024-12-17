import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';

import { appRouter } from '@/server/routers/_app';

import { POST } from '../route';

// Mock the fetch request handler
jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn(),
}));

describe('tRPC API Route', () => {
  const mockRequest = new NextRequest(new URL('http://localhost:3000/api/trpc/test.query'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-token',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle POST requests', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(new Response('{"result": "success"}'));

    const response = await POST(mockRequest);

    expect(fetchRequestHandler).toHaveBeenCalledWith({
      endpoint: '/api/trpc',
      req: mockRequest,
      router: appRouter,
      createContext: expect.any(Function),
      onError: expect.any(Function),
    });

    expect(response.status).toBe(200);
  });

  it('should handle errors', async () => {
    (fetchRequestHandler as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe('application/json');
    const data = await response.json();
    expect(data).toEqual({
      error: {
        message: 'Internal server error',
      },
    });
  });

  it('should create context with auth', async () => {
    (fetchRequestHandler as jest.Mock).mockImplementationOnce(async ({ createContext }) => {
      const ctx = await createContext(mockRequest);
      expect(ctx).toHaveProperty('session');
      return new Response('{"result": "success"}');
    });

    await POST(mockRequest);
  });

  it('should handle missing authorization', async () => {
    const requestWithoutAuth = new NextRequest(
      new URL('http://localhost:3000/api/trpc/test.query'),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    (fetchRequestHandler as jest.Mock).mockImplementationOnce(async ({ createContext }) => {
      const ctx = await createContext(requestWithoutAuth);
      expect(ctx.session).toBeNull();
      return new Response('{"result": "success"}');
    });

    await POST(requestWithoutAuth);
  });
});
