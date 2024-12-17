import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import type { DecodedIdToken, Auth } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '../authUtils';

// Mock firebase-admin/auth
jest.mock('firebase-admin/auth');

describe('authUtils', () => {
  const mockDecodedToken: DecodedIdToken = {
    uid: 'test-uid',
    email: 'test@example.com',
    aud: 'test-audience',
    auth_time: 123456789,
    exp: 123456789,
    iat: 123456789,
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-user',
    email_verified: true,
    firebase: {
      identities: {
        email: ['test@example.com'],
      },
      sign_in_provider: 'custom',
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('creates auth context from request', async (): Promise<void> => {
    const mockRequest = {
      headers: new Headers({
        authorization: 'Bearer test-token',
      }),
    } as NextRequest;

    const mockVerifyIdToken = jest.fn().mockImplementation(
      async (token) => {
        expect(token).toBe('test-token');
        return mockDecodedToken;
      }
    );
    (getAuth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as unknown as Auth);

    const context = await createAuthContext(mockRequest);
    expect(context.session?.uid).toBe(mockDecodedToken.uid);
    expect(context.session?.email).toBe(mockDecodedToken.email);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('test-token');
  });

  test('handles missing authorization header', async (): Promise<void> => {
    const mockRequest = {
      headers: new Headers({}),
    } as NextRequest;

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
  });

  test('handles invalid token format', async (): Promise<void> => {
    const mockRequest = {
      headers: new Headers({
        authorization: 'InvalidFormat',
      }),
    } as NextRequest;

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
  });

  test('handles token verification failure', async (): Promise<void> => {
    const mockRequest = {
      headers: new Headers({
        authorization: 'Bearer test-token',
      }),
    } as NextRequest;

    const mockVerifyIdToken = jest.fn().mockImplementation(
      async (token) => {
        expect(token).toBe('test-token');
        throw new Error('Invalid token');
      }
    );
    (getAuth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as unknown as Auth);

    const context = await createAuthContext(mockRequest);
    expect(context.session).toBeNull();
  });
});
