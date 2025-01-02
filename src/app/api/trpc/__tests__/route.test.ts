import { type TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/trpc/[trpc]/route';
import { appRouter } from '@/server/routers/_app';

// Mock the fetchRequestHandler
jest.mock('@trpc/server/adapters/fetch');
const mockFetchRequestHandler = fetchRequestHandler as jest.Mock;

// Mock console.error for testing error logging
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('tRPC Route', () => {
  const mockResponse = new Response('test');

  const createMockRequest = (method = 'GET') => {
    return new Request('http://localhost:3000/api/trpc/test.query', {
      method,
    }) as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchRequestHandler.mockResolvedValue(mockResponse);
  });

  it('handles GET requests successfully', async () => {
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response).toBe(mockResponse);
    expect(mockFetchRequestHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
      })
    );
  });

  it('handles POST requests successfully', async () => {
    const request = createMockRequest('POST');
    const response = await POST(request);

    expect(response).toBe(mockResponse);
    expect(mockFetchRequestHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
      })
    );
  });

  it('logs tRPC errors in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const mockError = {
      message: 'Test error',
      code: 'INTERNAL_SERVER_ERROR',
      name: 'TRPCError',
    } as TRPCError;

    mockFetchRequestHandler.mockImplementation(({ onError }) => {
      if (onError) {
        onError({
          error: mockError,
          type: 'INTERNAL_SERVER_ERROR',
          path: 'test.path',
          ctx: {},
          input: undefined,
          req: {} as NextRequest,
          router: appRouter,
          code: 'INTERNAL_SERVER_ERROR',
        });
      }
      return mockResponse;
    });

    const request = createMockRequest();
    await GET(request);

    expect(console.error).toHaveBeenCalledWith(
      'tRPC error:',
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Test error',
        path: 'test.path'
      })
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('does not log tRPC errors in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const mockError = new Error('Test error') as TRPCError;
    mockFetchRequestHandler.mockImplementation(({ onError }) => {
      if (onError) {
        onError({
          error: mockError,
          type: 'INTERNAL_SERVER_ERROR',
          path: 'test.path',
          ctx: {},
          input: undefined,
          req: {} as NextRequest,
          router: appRouter,
          code: 'INTERNAL_SERVER_ERROR',
        });
      }
      return mockResponse;
    });

    const request = createMockRequest();
    await GET(request);

    expect(console.error).not.toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('handles handler errors in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const mockError = {
      message: 'Handler error',
      code: 'INTERNAL_SERVER_ERROR',
      name: 'TRPCError',
    } as TRPCError;

    mockFetchRequestHandler.mockImplementation(({ onError }) => {
      onError?.({ path: undefined, error: mockError });
      throw mockError;
    });

    const request = createMockRequest();
    try {
      await GET(request);
    } catch {
      // The error should have been logged before the catch
    }

    expect(console.error).toHaveBeenCalledWith('tRPC error:', {
      code: mockError.code,
      message: 'Handler error',
      path: 'unknown'
    });

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('handles handler errors in production without logging', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const mockError = {
      message: 'Handler error',
      code: 'INTERNAL_SERVER_ERROR',
      name: 'TRPCError',
    } as TRPCError;
    mockFetchRequestHandler.mockRejectedValue(mockError);

    const request = createMockRequest();
    try {
      await GET(request);
    } catch {
      // The error should not have been logged
    }

    expect(console.error).not.toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });
});
