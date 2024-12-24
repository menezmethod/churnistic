import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/opportunities/recent', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const opportunities = await response.json();
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
