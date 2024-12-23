import { NextResponse } from 'next/server';
import { ChurningAnalyzer } from '@/server/services/churning-analyzer';

export async function GET() {
  try {
    const analyzer = new ChurningAnalyzer();
    const analysis = await analyzer.analyzeThreads();
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in churning analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 