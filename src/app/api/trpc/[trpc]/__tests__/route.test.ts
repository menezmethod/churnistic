import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';

import { appRouter } from '@/server/routers/_app';

import { POST } from '../route';

// Mock the fetch request handler
jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn(),
}));

describe('tRPC API Route', () => {
  const mockRequest = new NextRequest(
    new URL('http://localhost:3000/api/trpc/test.query'),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
    }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle POST requests', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response('{"result": "success"}')
    );

    const response = await POST(mockRequest);

    const handlerConfig = (fetchRequestHandler as jest.Mock).mock.calls[0][0];
    expect(handlerConfig.req).toBe(mockRequest);
    expect(handlerConfig.router).toBe(appRouter);
    expect(handlerConfig.endpoint).toBe('/api/trpc');
    expect(typeof handlerConfig.createContext).toBe('function');
    expect(typeof handlerConfig.onError).toBe('function');

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ result: 'success' });
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
    (fetchRequestHandler as jest.Mock).mockImplementationOnce(
      async ({ createContext }) => {
        const ctx = await createContext();
        expect(ctx).toBeDefined();
        return new Response('{"result": "success"}');
      }
    );

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

    (fetchRequestHandler as jest.Mock).mockImplementationOnce(
      async ({ createContext }) => {
        const ctx = await createContext();
        expect(ctx).toBeDefined();
        return new Response('{"result": "success"}');
      }
    );

    await POST(requestWithoutAuth);
  });
});
