import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { appRouter } from '@/server/routers/_app';

jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn(),
}));

describe('tRPC Route', () => {
  const mockFetchRequestHandler = fetchRequestHandler as jest.Mock;
  const mockResponse = new Response();
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockFetchRequestHandler.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  const createMockRequest = (method = 'GET'): NextRequest =>
    ({
      method,
      headers: new Headers(),
      url: 'http://localhost:3000/api/trpc/test',
    }) as NextRequest;

  it('handles GET requests successfully', async () => {
    const request = createMockRequest('GET');
    const { GET } = await import('../route');
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
    const { POST } = await import('../route');
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
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });

    const request = createMockRequest();
    const mockError = new Error('Test error');

    mockFetchRequestHandler.mockImplementationOnce(({ onError }) => {
      if (typeof onError === 'function') {
        onError({
          error: mockError,
          type: 'INTERNAL_SERVER_ERROR',
          path: 'test.path',
        });
      }
      return mockResponse;
    });

    const { GET } = await import('../route');
    await GET(request);

    expect(console.error).toHaveBeenCalledWith(
      'tRPC error:',
      expect.objectContaining({
        code: undefined,
        message: 'Test error',
        path: 'test.path'
      })
    );

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv });
  });

  it('does not log tRPC errors in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });

    const request = createMockRequest();
    const mockError = new Error('Test error');

    mockFetchRequestHandler.mockImplementationOnce(({ onError }) => {
      if (typeof onError === 'function') {
        onError({
          error: mockError,
          type: 'INTERNAL_SERVER_ERROR',
          path: 'test.path',
        });
      }
      return mockResponse;
    });

    const { GET } = await import('../route');
    await GET(request);

    expect(console.error).not.toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv });
  });
});
