import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

import { GET, POST } from '../[trpc]/route';

// Mock fetchRequestHandler
jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn(),
}));

// Mock createContext
jest.mock('@/server/context', () => ({
  createContext: jest.fn(),
}));

describe('tRPC Route', () => {
  const mockFetchRequestHandler = fetchRequestHandler as jest.Mock;
  const mockCreateContext = createContext as jest.Mock;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockFetchRequestHandler.mockReset();
    mockCreateContext.mockReset();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  const createMockRequest = (method = 'GET'): NextRequest => {
    return new NextRequest(new URL('http://localhost:3000/api/trpc/test'), {
      method,
    });
  };

  it('handles GET requests successfully', async () => {
    const mockResponse = new Response('{"result": "success"}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    mockFetchRequestHandler.mockResolvedValueOnce(mockResponse);

    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response).toBe(mockResponse);
    expect(mockFetchRequestHandler).toHaveBeenCalledWith({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('handles POST requests successfully', async () => {
    const mockResponse = new Response('{"result": "success"}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    mockFetchRequestHandler.mockResolvedValueOnce(mockResponse);

    const request = createMockRequest('POST');
    const response = await POST(request);

    expect(response).toBe(mockResponse);
    expect(mockFetchRequestHandler).toHaveBeenCalledWith({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('logs tRPC errors in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const mockError = new Error('Test error');
    mockFetchRequestHandler.mockImplementationOnce(({ onError }) => {
      onError({
        error: mockError,
        type: 'INTERNAL_SERVER_ERROR',
        path: 'test.path',
      });
      return new Response();
    });

    const request = createMockRequest();
    await GET(request);

    expect(console.error).toHaveBeenCalledWith('tRPC error:', {
      type: 'INTERNAL_SERVER_ERROR',
      path: 'test.path',
      error: mockError,
    });

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

    const mockError = new Error('Test error');
    mockFetchRequestHandler.mockImplementationOnce(({ onError }) => {
      onError({
        error: mockError,
        type: 'INTERNAL_SERVER_ERROR',
        path: 'test.path',
      });
      return new Response();
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

    const mockError = new Error('Handler error');
    mockFetchRequestHandler.mockRejectedValueOnce(mockError);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: {
        message: 'Internal server error',
      },
    });
    expect(console.error).toHaveBeenCalledWith('Error in tRPC handler:', mockError);

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

    const mockError = new Error('Handler error');
    mockFetchRequestHandler.mockRejectedValueOnce(mockError);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: {
        message: 'Internal server error',
      },
    });
    expect(console.error).not.toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('calls onError callback with error details', async () => {
    const mockResponse = new Response('{"result": "success"}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    let onErrorCallback:
      | ((opts: { error: Error; type: string; path: string }) => void)
      | undefined;
    mockFetchRequestHandler.mockImplementationOnce(({ onError }) => {
      onErrorCallback = onError;
      return mockResponse;
    });

    const request = createMockRequest();
    await GET(request);

    expect(onErrorCallback).toBeDefined();
    if (onErrorCallback) {
      const error = new Error('Test error');
      onErrorCallback({
        error,
        type: 'INTERNAL_SERVER_ERROR',
        path: 'test.path',
      });

      expect(console.error).toHaveBeenCalledWith('tRPC error:', {
        type: 'INTERNAL_SERVER_ERROR',
        path: 'test.path',
        error,
      });
    }
  });
});
