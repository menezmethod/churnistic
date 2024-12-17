import { getBaseUrl, getUrl } from '../client';

describe('tRPC Client', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // @ts-expect-error: window is undefined in test environment
    delete global.window;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe('getBaseUrl', () => {
    it('returns empty string when window is defined', () => {
      // Mock window
      global.window = {} as Window & typeof globalThis;
      expect(getBaseUrl()).toBe('');
    });

    it('returns Vercel URL when VERCEL_URL is defined', () => {
      process.env.VERCEL_URL = 'test-app.vercel.app';
      expect(getBaseUrl()).toBe('https://test-app.vercel.app');
    });

    it('returns localhost URL with default port when no environment variables are set', () => {
      expect(getBaseUrl()).toBe('http://localhost:3000');
    });

    it('returns localhost URL with custom port when PORT is set', () => {
      process.env.PORT = '4000';
      expect(getBaseUrl()).toBe('http://localhost:4000');
    });
  });

  describe('getUrl', () => {
    it('returns correct URL for browser environment', () => {
      global.window = {} as Window & typeof globalThis;
      expect(getUrl()).toBe('/api/trpc');
    });

    it('returns correct URL for server environment with Vercel URL', () => {
      process.env.VERCEL_URL = 'test-app.vercel.app';
      expect(getUrl()).toBe('https://test-app.vercel.app/api/trpc');
    });

    it('returns correct URL for server environment with localhost', () => {
      expect(getUrl()).toBe('http://localhost:3000/api/trpc');
    });
  });
});
