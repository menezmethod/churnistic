import { expect, jest, describe, it } from '@jest/globals';

import { GET } from '../route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock the database connection
jest.mock('@/lib/prisma/db', () => ({
  connectToDatabase: jest.fn().mockImplementation(() => {
    throw new Error('Connection failed');
  }),
  prisma: {
    $connect: jest.fn().mockImplementation(() => {
      throw new Error('Connection failed');
    }),
    $disconnect: jest.fn(),
  },
}));

describe('Test API Route', () => {
  it('handles database connection error', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({
      status: 'error',
      message: 'Database connection failed',
    });
  });
});
