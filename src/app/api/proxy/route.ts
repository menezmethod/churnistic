import { NextRequest } from 'next/server';

// Add Vercel-specific timeout handling
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Maximum allowed duration for Vercel Pro plan

// Add url parameter to the function
export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, {
      signal: controller.signal,
      // ... other options
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return new Response(JSON.stringify({ error: 'Gateway timeout' }), {
      status: 504,
    });
  }
}
