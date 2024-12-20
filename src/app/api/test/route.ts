import { prisma } from '@/lib/prisma/db';

export async function GET(): Promise<Response> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Database connection successful',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Database connection error:', error);
    }

    await prisma.$disconnect();

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Database connection failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
