import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/db';

export async function GET(): Promise<NextResponse> {
  try {
    // Test database connection
    await prisma.$connect();
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful'
    });
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Database connection error:', error);
    }
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 