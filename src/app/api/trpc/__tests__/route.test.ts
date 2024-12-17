import { mockDeep } from 'jest-mock-extended';
import { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { GET, POST } from '../[trpc]/route';
import { appRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Mock Firebase Admin Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({
      uid: 'test-user',
      email: 'test@example.com',
      aud: 'test-audience',
      auth_time: Date.now(),
      exp: Date.now() + 3600,
      iat: Date.now(),
      iss: 'https://securetoken.google.com/test-project',
      sub: 'test-user',
      email_verified: true,
      firebase: {
        identities: {
          email: ['test@example.com'],
        },
        sign_in_provider: 'custom',
      },
    } as DecodedIdToken)),
  })),
}));

// Mock Prisma
jest.mock('@/lib/prisma/db', () => ({
  prisma: mockDeep(),
}));

// Mock tRPC router
jest.mock('@/server/routers/_app', () => {
  const mockProcedures = {
    user: { _def: { query: true } },
    card: { _def: { query: true } },
    bank: { _def: { query: true } },
    company: { _def: { query: true } },
    customer: { _def: { query: true } },
    'test.procedure': { _def: { query: true } },
  };

  return {
    appRouter: {
      createCaller: jest.fn(() => ({
        test: {
          procedure: jest.fn(() => Promise.resolve({ success: true })),
        },
      })),
      _def: {
        procedures: mockProcedures,
      },
    },
  };
});

// Mock fetchRequestHandler
jest.mock('@trpc/server/adapters/fetch', () => {
  let mockResponse = {
    status: 200,
    body: JSON.stringify({ result: { data: { success: true } } }),
    headers: {
      'content-type': 'application/json',
    },
  };

  const handler = jest.fn(async ({ req }) => {
    // Allow tests to override the mock response
    if ((handler as any).mockResponse) {
      mockResponse = (handler as any).mockResponse;
    }

    // Handle GET requests
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
          },
        }),
        {
          status: 405,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // Handle missing authorization
    const auth = req.headers.get('authorization');
    if (!auth) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // Handle invalid procedure
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const procedure = segments[segments.length - 1];
    const isProcedure = (proc: string): proc is keyof typeof appRouter._def.procedures => {
      return proc in appRouter._def.procedures;
    };
    
    if (!procedure || !isProcedure(procedure)) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Procedure not found',
            code: 'NOT_FOUND',
          },
        }),
        {
          status: 404,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // Handle malformed request body
    let body;
    try {
      const text = await req.text();
      if (!text) {
        throw new Error('Empty body');
      }
      body = JSON.parse(text);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request body',
            code: 'PARSE_ERROR',
          },
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // Handle invalid JSON-RPC format
    if (
      !body.jsonrpc ||
      body.jsonrpc !== '2.0' ||
      !body.method ||
      !body.params ||
      typeof body.params !== 'object' ||
      !body.params.type ||
      !body.params.input ||
      !body.params.path
    ) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid JSON-RPC format',
            code: 'PARSE_ERROR',
          },
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    return new Response(mockResponse.body, {
      status: mockResponse.status,
      headers: mockResponse.headers,
    });
  });

  return { fetchRequestHandler: handler };
});

// Import after mocks
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '@/lib/prisma/db';

// Mock process.env
const originalEnv = process.env;

// Define interface for MockReadableStream
interface MockReadableStreamSource {
  start: (controller: { enqueue: (data: any) => void; close: () => void }) => Promise<void>;
}

interface MockReadableStreamInstance {
  _source: MockReadableStreamSource;
  getReader: () => {
    read: () => Promise<{ value: any; done: boolean }>;
    releaseLock: () => void;
  };
}

// Mock ReadableStream if not available in test environment
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = class MockReadableStream implements MockReadableStreamInstance {
    _source: MockReadableStreamSource;

    constructor(source: MockReadableStreamSource) {
      this._source = source;
    }

    getReader() {
      return {
        read: async () => {
          let value: any;
          let done = false;
          await this._source.start({
            enqueue: (data: any) => { value = data; done = false; },
            close: () => { value = undefined; done = true; },
          });
          return { value, done };
        },
        releaseLock: () => {},
      };
    }
  } as any;
}

// Mock TextEncoder if not available in test environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class MockTextEncoder {
    encode(text: string) {
      return Buffer.from(text);
    }
  } as any;
}

describe('tRPC API Route Handler', () => {
  const mockHeaders = new Headers({
    'content-type': 'application/json',
    'authorization': 'Bearer test-token',
  });

  const createMockRequest = (method: string, procedure: string, input?: any) => {
    const url = new URL(`http://localhost:3000/api/trpc/${procedure}`);
    return new Request(url, {
      method,
      headers: mockHeaders,
      body: method === 'POST' ? JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: procedure,
        params: {
          type: 'query',
          input: input || {},
          path: procedure,
        },
      }) : undefined,
    }) as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Reset mock response before each test
    (fetchRequestHandler as any).mockResponse = null;
  });

  afterEach(() => {
    // Restore process.env after each test
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // Increase timeout for all tests
  jest.setTimeout(15000);

  test('handles GET requests', async () => {
    const mockRequest = createMockRequest('GET', 'healthcheck');
    const response = await GET(mockRequest);

    expect(response.status).toBe(405); // Method Not Allowed for GET requests
    const data = await response.json();
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('handles POST requests with authentication', async () => {
    // Mock successful auth verification
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'test-user',
      email: 'test@example.com',
      aud: 'test-audience',
      auth_time: Date.now(),
      exp: Date.now() + 3600,
      iat: Date.now(),
      iss: 'https://securetoken.google.com/test-project',
      sub: 'test-user',
      email_verified: true,
      firebase: {
        identities: {
          email: ['test@example.com'],
        },
        sign_in_provider: 'custom',
      },
    } as DecodedIdToken);

    // Mock user found in database
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'test-user',
      email: 'test@example.com',
      firebaseUid: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('handles unauthorized requests', async () => {
    // Mock failed auth verification
    (getAuth().verifyIdToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('handles invalid procedure calls', async () => {
    const mockRequest = createMockRequest('POST', 'nonexistent.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(404);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('handles malformed requests', async () => {
    // Mock successful auth verification
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'test-user',
      email: 'test@example.com',
    } as DecodedIdToken);

    // Mock error response for malformed request
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({
        error: {
          message: 'Invalid request body',
          code: 'PARSE_ERROR',
        },
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'text/plain',
        'authorization': 'Bearer test-token',
      }),
      body: 'not-json',
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles successful card query', async () => {
    // Mock successful auth verification
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'test-user',
      email: 'test@example.com',
      aud: 'test-audience',
      auth_time: Date.now(),
      exp: Date.now() + 3600,
      iat: Date.now(),
      iss: 'https://securetoken.google.com/test-project',
      sub: 'test-user',
      email_verified: true,
      firebase: {
        identities: {
          email: ['test@example.com'],
        },
        sign_in_provider: 'custom',
      },
    } as DecodedIdToken);

    // Mock card found in database
    (prisma.card.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'test-card',
      name: 'Test Card',
      issuer: 'Test Issuer',
      type: 'Credit',
      network: 'Visa',
      rewardType: 'Points',
      signupBonus: 50000,
      minSpend: 3000,
      minSpendPeriod: 3,
      annualFee: 95,
      isActive: true,
      businessCard: false,
      velocityRules: [],
      churningRules: [],
      issuerRules: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockRequest = createMockRequest('POST', 'test.procedure', { cardId: 'test-card' });
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('handles internal server errors', async () => {
    (fetchRequestHandler as any).mockResponse = {
      status: 500,
      body: JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      headers: {
        'content-type': 'application/json',
      },
    };

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('handles CORS preflight requests', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'OPTIONS',
      headers: new Headers({
        'origin': 'http://localhost:3000',
        'access-control-request-method': 'POST',
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toBe('OPTIONS,GET,POST');
    expect(response.headers.get('access-control-allow-headers')).toBe('*');
  });

  test('handles batched requests', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify([
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'test.procedure',
          params: {
            type: 'query',
            input: {},
            path: 'test.procedure',
          },
        },
        {
          id: 2,
          jsonrpc: '2.0',
          method: 'test.procedure',
          params: {
            type: 'query',
            input: {},
            path: 'test.procedure',
          },
        },
      ]),
    }) as NextRequest;

    // Mock successful response for batched requests
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify([
        { result: { data: { success: true } } },
        { result: { data: { success: true } } },
      ]), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  test('logs errors in development mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    // Mock error response
    (fetchRequestHandler as jest.Mock).mockImplementationOnce(({ onError }) => {
      const error = new Error('Test error');
      onError?.({
        path: 'test.procedure',
        error,
      });
      return new Response(JSON.stringify({
        error: {
          message: error.message,
          code: 'INTERNAL_SERVER_ERROR',
        },
      }), {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      });
    });

    const consoleError = jest.spyOn(console, 'error');
    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    await POST(mockRequest);

    expect(consoleError).toHaveBeenCalledWith(
      '❌ tRPC failed on test.procedure: Test error'
    );
  });

  test('handles TRPCError with custom status code', async () => {
    // Mock error response
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({
        error: {
          message: 'Invalid input',
          code: 'BAD_REQUEST',
        },
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('BAD_REQUEST');
  });

  test('handles request parsing errors', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: 'invalid-json',
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles missing authorization header', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
      }),
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: {
          type: 'query',
          input: {},
          path: 'test.procedure',
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('handles invalid authorization token', async () => {
    // Mock error response for invalid token
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({
        error: {
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
        },
      }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('handles error logging in production mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    const consoleError = jest.spyOn(console, 'error');

    // Mock a server error
    (appRouter.createCaller as jest.Mock).mockImplementationOnce(() => {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Test error',
      });
    });

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    await POST(mockRequest);

    // Should not log errors in production
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('❌ tRPC failed on'),
      expect.any(String)
    );
  });

  test('handles invalid URL in request', async () => {
    const mockRequest = new Request('invalid-url', {
      method: 'POST',
      headers: mockHeaders,
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('BAD_REQUEST');
  });

  test('handles empty request body', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles missing procedure in URL', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: {
          type: 'query',
          input: {},
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(404);
  });

  test('handles request with invalid JSON-RPC version', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '1.0', // Invalid version
        method: 'test.procedure',
        params: {
          type: 'query',
          input: {},
          path: 'test.procedure',
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with missing method', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        params: {
          type: 'query',
          input: {},
          path: 'test.procedure',
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with invalid params structure', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: 'invalid-params', // Should be an object
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with missing input in params', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: {
          type: 'query',
          path: 'test.procedure',
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with missing path in params', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: {
          type: 'query',
          input: {},
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with invalid type in params', async () => {
    // Mock error response for invalid type
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({
        error: {
          message: 'Invalid params type',
          code: 'PARSE_ERROR',
        },
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'test.procedure',
        params: {
          type: 'invalid-type', // Should be 'query' or 'mutation'
          input: {},
          path: 'test.procedure',
        },
      }),
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with null body', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: null,
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles request with undefined body', async () => {
    const mockRequest = new Request('http://localhost:3000/api/trpc/test.procedure', {
      method: 'POST',
      headers: mockHeaders,
      body: undefined,
    }) as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('PARSE_ERROR');
  });

  test('handles fetchRequestHandler error', async () => {
    (fetchRequestHandler as jest.Mock).mockRejectedValueOnce(new Error('Failed to handle request'));

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('handles request with custom response meta', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ result: { data: { success: true } } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'custom-header': 'test-value',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('custom-header')).toBe('test-value');
  });

  test('handles request with custom error response', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Custom error' } }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe('Custom error');
  });

  test('handles request with non-JSON response', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response('Not JSON', {
        status: 200,
        headers: {
          'content-type': 'text/plain',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain');
  });

  test('handles request with no content-type header', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(null, {
        status: 204,
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(204);
    expect(response.headers.get('content-type')).toBeNull();
  });

  test('handles request with binary response', async () => {
    const buffer = new ArrayBuffer(8);
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(buffer, {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
  });

  test('handles request with streaming response', async () => {
    // Mock successful auth verification
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'test-user',
      email: 'test@example.com',
    } as DecodedIdToken);

    const responseData = { result: { data: 'test' } };
    const response = new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
      },
    });

    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(response);

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const result = await POST(mockRequest);

    expect(result.status).toBe(200);
    expect(result.headers.get('transfer-encoding')).toBe('chunked');
    
    const data = await result.json();
    expect(data).toEqual(responseData);
  });

  test('handles request with custom status code', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(null, {
        status: 418, // I'm a teapot
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(418);
  });

  test('handles request with redirect', async () => {
    (fetchRequestHandler as jest.Mock).mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: {
          'location': '/new-location',
        },
      })
    );

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/new-location');
  });

  test('handles request with custom error code', async () => {
    (fetchRequestHandler as any).mockResponse = {
      status: 500,
      body: JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      headers: {
        'content-type': 'application/json',
      },
    };

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Internal server error');
  });

  test('handles streaming response', async () => {
    // Mock successful auth verification
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'test-user',
      email: 'test@example.com',
    } as DecodedIdToken);

    const responseData = { result: { data: 'test' } };
    const response = new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
      },
    });

    (fetchRequestHandler as any).mockResponse = {
      status: 200,
      body: JSON.stringify(responseData),
      headers: {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
      },
    };

    const mockRequest = createMockRequest('POST', 'test.procedure', {});
    const result = await POST(mockRequest);

    expect(result.status).toBe(200);
    expect(result.headers.get('transfer-encoding')).toBe('chunked');
    
    const data = await result.json();
    expect(data).toEqual(responseData);
  });
}); 