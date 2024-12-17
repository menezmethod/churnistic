import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma/db';

export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();

    return NextResponse.json(
      {
        status: 'success',
        message: 'Database connection successful',
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Database connection error:', error);
    }

    await prisma.$disconnect();

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
      },
      {
        status: 500,
      }
    );
  }
}
