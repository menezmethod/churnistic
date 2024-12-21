import { expect } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { mockDeep } from 'jest-mock-extended';

import type { Context } from '../../context';
import { appRouter } from '../_app';

describe('Company Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  let caller: ReturnType<typeof appRouter.createCaller>;

  const now = new Date();
  const mockUser: DecodedIdToken = {
    uid: 'test-uid',
    email: 'test@example.com',
    role: 'admin',
    aud: 'test-audience',
    auth_time: now.getTime(),
    exp: now.getTime() + 3600,
    iat: now.getTime(),
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-uid',
    firebase: {
      identities: {},
      sign_in_provider: 'custom',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const ctx: Context = {
      prisma: mockPrisma,
      session: {
        uid: mockUser.uid,
      },
      user: mockUser,
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('getAll', () => {
    it('returns all companies', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Company 1',
          createdAt: now,
          updatedAt: now,
          industry: null,
          size: null,
          website: null,
        },
        {
          id: '2',
          name: 'Company 2',
          createdAt: now,
          updatedAt: now,
          industry: null,
          size: null,
          website: null,
        },
      ];

      mockPrisma.company.findMany.mockResolvedValue(mockCompanies);

      const result = await caller.company.getAll();

      expect(result).toEqual(mockCompanies);
      expect(mockPrisma.company.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('returns a company by id', async () => {
      const mockCompany = {
        id: '1',
        name: 'Company 1',
        createdAt: now,
        updatedAt: now,
        industry: null,
        size: null,
        website: null,
      };
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);

      const result = await caller.company.getById('1');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws error when company not found', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(caller.company.getById('1')).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      );
    });
  });

  describe('create', () => {
    it('creates a new company', async () => {
      const mockCompany = {
        id: '1',
        name: 'New Company',
        industry: 'Tech',
        size: '100-500',
        website: 'https://example.com',
        createdAt: now,
        updatedAt: now,
      };

      mockPrisma.company.create.mockResolvedValue(mockCompany);

      const result = await caller.company.create({
        name: 'New Company',
        industry: 'Tech',
        size: '100-500',
        website: 'https://example.com',
      });

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.create).toHaveBeenCalledWith({
        data: {
          name: 'New Company',
          industry: 'Tech',
          size: '100-500',
          website: 'https://example.com',
        },
      });
    });
  });

  describe('update', () => {
    it('updates a company', async () => {
      const mockCompany = {
        id: '1',
        name: 'Updated Company',
        industry: 'Tech',
        createdAt: now,
        updatedAt: now,
        size: null,
        website: null,
      };

      mockPrisma.company.update.mockResolvedValue(mockCompany);

      const result = await caller.company.update({
        id: '1',
        name: 'Updated Company',
        industry: 'Tech',
      });

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Company',
          industry: 'Tech',
        },
      });
    });
  });

  describe('delete', () => {
    it('deletes a company', async () => {
      const mockCompany = {
        id: '1',
        name: 'Company 1',
        createdAt: now,
        updatedAt: now,
        industry: null,
        size: null,
        website: null,
      };
      mockPrisma.company.delete.mockResolvedValue(mockCompany);

      const result = await caller.company.delete('1');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
