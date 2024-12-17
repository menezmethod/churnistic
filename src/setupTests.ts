import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
(global.TextDecoder as unknown) = TextDecoder;

// Mock fetch and web APIs for Node.js environment
(global.fetch as unknown) = fetch;
(global.Headers as unknown) = Headers;
(global.Request as unknown) = Request;
(global.Response as unknown) = Response;

// Mock console methods for tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Store original console methods
const originalConsole = { ...console };

beforeAll(() => {
  // Replace console methods with mocks
  Object.assign(console, mockConsole);
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
