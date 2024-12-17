import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn().mockImplementation(() => Promise.resolve()),
  $disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
} as unknown as jest.Mocked<PrismaClient>;

jest.mock('@/lib/prisma/db', () => ({
  prisma: mockPrismaClient,
}));

// Mock console.error for development mode tests
const mockConsoleError = jest.fn();
const originalConsoleError = console.error;

describe('Test API Route', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });
    jest.clearAllMocks();
    console.error = mockConsoleError;
    const route = await import('../route');
    GET = route.GET;
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv.NODE_ENV,
      configurable: true,
    });
    console.error = originalConsoleError;
    jest.resetModules();
  });

  it('should return success response when database connection succeeds', async () => {
    // Mock successful connection
    mockPrismaClient.$connect.mockResolvedValueOnce();
    mockPrismaClient.$disconnect.mockResolvedValueOnce();

    const response = await GET();
    const data = await response.json();

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'success',
      message: 'Database connection successful',
    });
    expect(mockPrismaClient.$connect).toHaveBeenCalled();
    expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
  });

  it('should handle database connection errors', async () => {
    // Mock connection failure
    const error = new Error('Connection failed');
    mockPrismaClient.$connect.mockRejectedValueOnce(error);
    mockPrismaClient.$disconnect.mockResolvedValueOnce();

    const response = await GET();
    const data = await response.json();

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(data).toEqual({
      status: 'error',
      message: 'Database connection failed',
    });
    expect(mockConsoleError).toHaveBeenCalledWith('Database connection error:', error);
    expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
  });

  it('should log error in development mode only', async () => {
    // Mock connection failure
    const error = new Error('Connection failed');
    mockPrismaClient.$connect.mockRejectedValueOnce(error);
    mockPrismaClient.$disconnect.mockResolvedValueOnce();

    await GET();
    expect(mockConsoleError).toHaveBeenCalledWith('Database connection error:', error);

    // Test in production mode
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    jest.resetModules();
    const prodRoute = await import('../route');
    const prodGET = prodRoute.GET;

    mockPrismaClient.$connect.mockRejectedValueOnce(error);
    mockPrismaClient.$disconnect.mockResolvedValueOnce();

    await prodGET();
    expect(mockConsoleError).toHaveBeenCalledTimes(1); // Should not be called again in production
  });
}); 