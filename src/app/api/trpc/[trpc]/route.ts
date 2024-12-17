import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { NextRequest } from 'next/server';
import { TRPCError } from '@trpc/server';
import { AnyRouter, ProcedureType } from '@trpc/server';

// Define a more accurate type for procedures
type RouterProcedure = {
  _def: {
    procedureType: ProcedureType;
  };
};

type RouterProcedures = Record<string, RouterProcedure>;

const isProcedure = (proc: string): proc is keyof typeof appRouter._def.procedures => {
  return proc in appRouter._def.procedures;
};

const handler = async (req: NextRequest) => {
  try {
    // Validate URL
    let url: URL;
    try {
      url = new URL(req.url);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid URL',
            code: 'BAD_REQUEST',
          },
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
            'Access-Control-Allow-Headers': '*',
          },
        }
      );
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Validate request method
    if (req.method !== 'POST') {
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
            'Access-Control-Allow-Headers': '*',
          },
        }
      );
    }

    // Validate procedure
    const segments = url.pathname.split('/');
    const procedure = segments[segments.length - 1];
    
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
            'Access-Control-Allow-Headers': '*',
          },
        }
      );
    }

    // Handle the request
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: () => createContext({ req }),
      onError:
        process.env.NODE_ENV === 'development'
          ? ({ path, error }) => {
              console.error(
                `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
              );
            }
          : undefined,
      batching: {
        enabled: true,
      },
      responseMeta() {
        return {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
            'Access-Control-Allow-Headers': '*',
          },
        };
      },
    });

    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Request-Method', '*');
    headers.set('Access-Control-Allow-Methods', 'OPTIONS,GET,POST');
    headers.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('tRPC request failed:', error);

    // Handle TRPCError
    if (error instanceof TRPCError) {
      const statusCode = {
        PARSE_ERROR: 400,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_SUPPORTED: 405,
        TIMEOUT: 408,
        CONFLICT: 409,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        UNPROCESSABLE_CONTENT: 422,
        TOO_MANY_REQUESTS: 429,
        CLIENT_CLOSED_REQUEST: 499,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
      }[error.code] || 500;

      return new Response(
        JSON.stringify({
          error: {
            message: error.message,
            code: error.code,
          },
        }),
        {
          status: statusCode,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
            'Access-Control-Allow-Headers': '*',
          },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
          'Access-Control-Allow-Headers': '*',
        },
      }
    );
  }
};

export const GET = handler;
export const POST = handler;
export { handler };