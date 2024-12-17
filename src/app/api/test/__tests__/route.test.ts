import { describe, expect, test } from '@jest/globals';
import { GET } from '../route';
import { prisma } from '@/lib/prisma/db';

jest.mock('@/lib/prisma/db', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init): { json: () => Promise<unknown>; status: number } => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe('Test API Route', () => {
  test('GET returns success when database connects', async () => {
    (prisma.$connect as jest.Mock).mockResolvedValueOnce(undefined);
    (prisma.$disconnect as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await GET();
    const data = await response.json();
    
    expect(data).toEqual({
      status: 'success',
      message: 'Database connection successful',
    });
    expect(response.status).toBe(200);
    expect(prisma.$connect).toHaveBeenCalled();
    expect(prisma.$disconnect).toHaveBeenCalled();
  });

  test('GET returns error when database connection fails', async () => {
    (prisma.$connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
    (prisma.$disconnect as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await GET();
    const data = await response.json();
    
    expect(data).toEqual({
      status: 'error',
      message: 'Database connection failed',
    });
    expect(response.status).toBe(500);
    expect(prisma.$connect).toHaveBeenCalled();
    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});
