import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '../authUtils';

// Mock Firebase Admin Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

describe('authUtils', () => {
  const mockVerifyIdToken = jest.fn();
  const mockAuth = { verifyIdToken: mockVerifyIdToken };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('returns null session when no authorization header is present', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as NextRequest;

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns null session when authorization header is invalid', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('Invalid Token'),
      },
    } as unknown as NextRequest;

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns valid session for valid token', async () => {
    const mockToken = 'valid.jwt.token';
    const mockDecodedToken = {
      uid: '123',
      email: 'test@example.com',
    };

    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue(`Bearer ${mockToken}`),
      },
    } as unknown as NextRequest;

    mockVerifyIdToken.mockResolvedValueOnce(mockDecodedToken);

    const context = await createAuthContext(mockRequest);

    expect(mockVerifyIdToken).toHaveBeenCalledWith(mockToken);
    expect(context.session).toEqual({
      uid: mockDecodedToken.uid,
      email: mockDecodedToken.email,
    });
  });

  it('handles null email in token', async () => {
    const mockToken = 'valid.jwt.token';
    const mockDecodedToken = {
      uid: '123',
      email: null,
    };

    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue(`Bearer ${mockToken}`),
      },
    } as unknown as NextRequest;

    mockVerifyIdToken.mockResolvedValueOnce(mockDecodedToken);

    const context = await createAuthContext(mockRequest);

    expect(context.session).toEqual({
      uid: mockDecodedToken.uid,
      email: null,
    });
  });

  it('returns null session when token verification fails', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer invalid.token'),
      },
    } as unknown as NextRequest;

    mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    const context = await createAuthContext(mockRequest);

    expect(context.session).toBeNull();
  });

  it('handles missing authorization header gracefully', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest;

    const context = await createAuthContext(mockRequest);

    expect(context.session).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });
});
