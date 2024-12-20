import { expect } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { createContext } from '../../context';
import { appRouter } from '../_app';

describe('Customer Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  const mockRequest = {} as NextRequest;
  let caller: ReturnType<typeof appRouter.createCaller>;

  const now = new Date();
  const mockSession: DecodedIdToken = {
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
    const ctx = await createContext(mockRequest);
    caller = appRouter.createCaller({
      ...ctx,
      prisma: mockPrisma,
      session: mockSession,
    });
  });

  describe('getAll', () => {
    it('returns all customers for a company', async () => {
      const mockCustomers = [
        {
          id: '1',
          email: 'customer1@example.com',
          companyId: 'company1',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          name: null,
          lastActive: now,
          churnedAt: null,
        },
        {
          id: '2',
          email: 'customer2@example.com',
          companyId: 'company1',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          name: null,
          lastActive: now,
          churnedAt: null,
        },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await caller.customer.getAll({
        companyId: 'company1',
      });

      expect(result).toEqual(mockCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company1',
        },
      });
    });

    it('filters customers by status', async () => {
      const mockCustomers = [
        {
          id: '1',
          email: 'customer1@example.com',
          companyId: 'company1',
          status: 'at_risk',
          createdAt: now,
          updatedAt: now,
          name: null,
          lastActive: now,
          churnedAt: null,
        },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await caller.customer.getAll({
        companyId: 'company1',
        status: 'at_risk',
      });

      expect(result).toEqual(mockCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company1',
          status: 'at_risk',
        },
      });
    });
  });

  describe('getById', () => {
    it('returns a customer by id', async () => {
      const mockCustomer = {
        id: '1',
        email: 'customer@example.com',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        name: null,
        companyId: 'company1',
        lastActive: now,
        churnedAt: null,
      };
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await caller.customer.getById('1');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws error when customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(caller.customer.getById('1')).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found',
        })
      );
    });
  });

  describe('create', () => {
    it('creates a new customer', async () => {
      const mockCustomer = {
        id: '1',
        email: 'new@example.com',
        name: 'New Customer',
        companyId: 'company1',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastActive: now,
        churnedAt: null,
      };

      mockPrisma.customer.create.mockResolvedValue(mockCustomer);

      const result = await caller.customer.create({
        email: 'new@example.com',
        name: 'New Customer',
        companyId: 'company1',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New Customer',
          companyId: 'company1',
          status: 'active',
          lastActive: expect.any(Date),
        },
      });
    });
  });

  describe('update', () => {
    it('updates a customer', async () => {
      const mockCustomer = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated Customer',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        companyId: 'company1',
        lastActive: now,
        churnedAt: null,
      };

      mockPrisma.customer.update.mockResolvedValue(mockCustomer);

      const result = await caller.customer.update({
        id: '1',
        email: 'updated@example.com',
        name: 'Updated Customer',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          email: 'updated@example.com',
          name: 'Updated Customer',
        },
      });
    });

    it('sets churnedAt when status is changed to churned', async () => {
      const mockCustomer = {
        id: '1',
        status: 'churned',
        email: 'test@example.com',
        createdAt: now,
        updatedAt: now,
        name: null,
        companyId: 'company1',
        lastActive: now,
        churnedAt: now,
      };

      mockPrisma.customer.update.mockResolvedValue(mockCustomer);

      const result = await caller.customer.update({
        id: '1',
        status: 'churned',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'churned',
          churnedAt: expect.any(Date),
        },
      });
    });
  });

  describe('delete', () => {
    it('deletes a customer', async () => {
      const mockCustomer = {
        id: '1',
        email: 'customer@example.com',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        name: null,
        companyId: 'company1',
        lastActive: now,
        churnedAt: null,
      };
      mockPrisma.customer.delete.mockResolvedValue(mockCustomer);

      const result = await caller.customer.delete('1');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('updateStatus', () => {
    it('updates customer status', async () => {
      const mockCustomer = {
        id: '1',
        status: 'at_risk',
        email: 'test@example.com',
        createdAt: now,
        updatedAt: now,
        name: null,
        companyId: 'company1',
        lastActive: now,
        churnedAt: null,
      };

      mockPrisma.customer.update.mockResolvedValue(mockCustomer);

      const result = await caller.customer.updateStatus({
        id: '1',
        status: 'at_risk',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'at_risk',
        },
      });
    });

    it('sets churnedAt when status is changed to churned', async () => {
      const mockCustomer = {
        id: '1',
        status: 'churned',
        email: 'test@example.com',
        createdAt: now,
        updatedAt: now,
        name: null,
        companyId: 'company1',
        lastActive: now,
        churnedAt: now,
      };

      mockPrisma.customer.update.mockResolvedValue(mockCustomer);

      const result = await caller.customer.updateStatus({
        id: '1',
        status: 'churned',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'churned',
          churnedAt: expect.any(Date),
        },
      });
    });
  });
});
