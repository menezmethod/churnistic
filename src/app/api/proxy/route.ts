import { NextRequest } from 'next/server';

// Add Vercel-specific timeout handling
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Maximum allowed duration for Vercel Pro plan

interface ErrorWithStatus extends Error {
  status?: number;
}

// Add url parameter to the function
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
        status: 400,
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
        status: 400,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return new Response(JSON.stringify({ error: 'Request timeout' }), {
            status: 504,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Proxy fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStatus =
      error instanceof Error && (error as ErrorWithStatus).status
        ? (error as ErrorWithStatus).status
        : 500;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorStatus,
    });
  }
}
