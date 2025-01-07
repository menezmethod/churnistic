import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '../authUtils';

// Mock Firebase Admin Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifySessionCookie: jest.fn(),
  })),
}));

describe('authUtils', () => {
  const mockVerifySessionCookie = jest.fn();
  const mockAuth = { verifySessionCookie: mockVerifySessionCookie };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('returns null session when no session cookie is present', async () => {
    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
    expect(mockVerifySessionCookie).not.toHaveBeenCalled();
  });

  it('returns null session when session cookie is invalid', async () => {
    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'Invalid Cookie' }),
      },
    } as unknown as NextRequest;

    mockVerifySessionCookie.mockRejectedValueOnce(new Error('Invalid session cookie'));

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
  });

  it('returns valid session for valid cookie', async () => {
    const mockCookie = 'valid.session.cookie';
    const mockDecodedToken = {
      uid: '123',
      email: 'test@example.com',
    };

    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: mockCookie }),
      },
    } as unknown as NextRequest;

    mockVerifySessionCookie.mockResolvedValueOnce(mockDecodedToken);

    const context = await createAuthContext(mockRequest);

    expect(mockVerifySessionCookie).toHaveBeenCalledWith(mockCookie);
    expect(context.session).toEqual({
      uid: mockDecodedToken.uid,
      email: mockDecodedToken.email,
    });
  });

  it('handles null email in token', async () => {
    const mockCookie = 'valid.session.cookie';
    const mockDecodedToken = {
      uid: '123',
      email: null,
    };

    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: mockCookie }),
      },
    } as unknown as NextRequest;

    mockVerifySessionCookie.mockResolvedValueOnce(mockDecodedToken);

    const context = await createAuthContext(mockRequest);

    expect(context.session).toEqual({
      uid: mockDecodedToken.uid,
      email: null,
    });
  });

  it('returns null session when cookie verification fails', async () => {
    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'invalid.cookie' }),
      },
    } as unknown as NextRequest;

    mockVerifySessionCookie.mockRejectedValueOnce(new Error('Invalid cookie'));

    const context = await createAuthContext(mockRequest);

    expect(context.session).toBeNull();
  });

  it('handles missing session cookie gracefully', async () => {
    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest;

    const context = await createAuthContext(mockRequest);

    expect(context.session).toBeNull();
    expect(mockVerifySessionCookie).not.toHaveBeenCalled();
  });
});
