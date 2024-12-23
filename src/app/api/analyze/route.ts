// Next.js dependencies
import { NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const content = await request.json();

    if (!content || !content.thread_content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Call the Python service that uses Pydantic-AI
    const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread_title: content.thread_title || '',
        thread_content: content.thread_content,
        comments: Array.isArray(content.comments) ? content.comments : []
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Python service error: ${error}`);
    }

    const analysis = await response.json();
    
    // If test mode is enabled and analysis fails, use the test endpoint
    if (!analysis || !analysis.opportunities) {
      console.log('Falling back to test endpoint');
      const testResponse = await fetch(`${PYTHON_SERVICE_URL}/test`);
      if (!testResponse.ok) {
        throw new Error('Failed to fetch test data');
      }
      return NextResponse.json(await testResponse.json());
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    // Try to use test endpoint as fallback
    try {
      console.log('Error occurred, falling back to test endpoint');
      const testResponse = await fetch(`${PYTHON_SERVICE_URL}/test`);
      if (!testResponse.ok) {
        throw new Error('Failed to fetch test data');
      }
      return NextResponse.json(await testResponse.json());
    } catch (fallbackError) {
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Error analyzing content' },
        { status: 500 }
      );
    }
  }
} 