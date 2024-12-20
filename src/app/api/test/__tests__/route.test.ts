import { prisma } from '@/lib/prisma/db';

import { GET } from '../route';

// Mock prisma
jest.mock('@/lib/prisma/db', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

describe('Test API Route', () => {
  const mockConnect = prisma.$connect as jest.Mock;
  const mockDisconnect = prisma.$disconnect as jest.Mock;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('returns success response when database connection is successful', async () => {
    mockConnect.mockResolvedValueOnce(undefined);
    mockDisconnect.mockResolvedValueOnce(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'success',
      message: 'Database connection successful',
    });

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('returns error response when database connection fails', async () => {
    const error = new Error('Connection failed');
    mockConnect.mockRejectedValueOnce(error);
    mockDisconnect.mockResolvedValueOnce(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      status: 'error',
      message: 'Database connection failed',
    });

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Database connection error:', error);
  });

  it('does not log errors in production', async () => {
    const error = new Error('Connection failed');
    mockConnect.mockRejectedValueOnce(error);
    mockDisconnect.mockResolvedValueOnce(undefined);

    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      status: 'error',
      message: 'Database connection failed',
    });

    expect(console.error).not.toHaveBeenCalled();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });
});
