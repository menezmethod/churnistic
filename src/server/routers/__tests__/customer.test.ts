import { PrismaClient } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { Context } from '../../context';
import { appRouter } from '../_app';

describe('Customer Router', () => {
  let ctx: {
    prisma: DeepMockProxy<PrismaClient>;
    session: DecodedIdToken;
    user: DecodedIdToken;
  };
  let caller: ReturnType<typeof appRouter.createCaller>;

  const mockSession: DecodedIdToken = {
    uid: 'test-uid',
    email: 'test@example.com',
    iat: 0,
    exp: 0,
    aud: '',
    iss: '',
    sub: '',
    auth_time: 0,
    firebase: {
      identities: {},
      sign_in_provider: 'custom',
    },
  };

  beforeEach(() => {
    ctx = {
      prisma: mockDeep<PrismaClient>(),
      session: mockSession,
      user: mockSession,
    };
    caller = appRouter.createCaller(ctx as Context);
  });

  describe('getAll', () => {
    it('returns all customers', async () => {
      const mockCustomers = [
        {
          id: '1',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890',
          companyId: 'company-1',
          status: 'active',
          lastActive: new Date(),
          churnedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      ctx.prisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await caller.customer.getAll();
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('updateStatus', () => {
    it('marks customer as at risk', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        companyId: 'company-1',
        status: 'active',
        lastActive: new Date(),
        churnedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer = {
        ...mockCustomer,
        status: 'at_risk',
        lastActive: new Date(),
      };

      ctx.prisma.customer.update.mockResolvedValue(updatedCustomer);

      const result = await caller.customer.updateStatus({
        id: mockCustomer.id,
        status: 'at_risk',
      });

      expect(result).toEqual(updatedCustomer);
    });

    it('marks customer as churned', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        companyId: 'company-1',
        status: 'at_risk',
        lastActive: new Date(),
        churnedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer = {
        ...mockCustomer,
        status: 'churned',
        lastActive: new Date(),
        churnedAt: new Date(),
      };

      ctx.prisma.customer.update.mockResolvedValue(updatedCustomer);

      const result = await caller.customer.updateStatus({
        id: mockCustomer.id,
        status: 'churned',
      });

      expect(result).toEqual(updatedCustomer);
    });
  });
});
