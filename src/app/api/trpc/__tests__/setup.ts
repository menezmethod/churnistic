import '@testing-library/jest-dom';
import fetch, { Headers, Request, Response } from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
(global.TextDecoder as unknown) = TextDecoder;

// Mock fetch and web APIs for Node.js environment
(global.fetch as unknown) = fetch;
(global.Headers as unknown) = Headers;
(global.Request as unknown) = Request;
(global.Response as unknown) = Response;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});
