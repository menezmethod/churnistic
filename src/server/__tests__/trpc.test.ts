import { router } from '../trpc';
import { cardRouter } from '../routers/card';
import { createContext, type CreateContextOptions } from '../trpc';
import { appRouter } from '../routers/_app';
import { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../routers/_app';
import { prismaMock, createMockContext } from '@/lib/prisma/__mocks__/db';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Card, IssuerRule, BankAccount, BonusRequirement, CardApplication, CreditPull, RetentionOffer, DirectDeposit } from '@prisma/client';
import { CardStatus } from '@/types/card';
import { mockDeep } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Mock RequirementType enum since it's not available in test environment
const RequirementType = {
  DIRECT_DEPOSIT: 'DIRECT_DEPOSIT',
  MINIMUM_BALANCE: 'MINIMUM_BALANCE',
  DEBIT_TRANSACTIONS: 'DEBIT_TRANSACTIONS',
  BILL_PAY: 'BILL_PAY',
} as const;

// Define mock types
interface CardWithRules extends Card {
  issuerRules?: IssuerRule[];
  bonusRequirements?: BonusRequirement[];
}

type CardApplicationWithCard = CardApplication & {
  card: Card;
  creditPull: CreditPull | null;
  retentionOffers: RetentionOffer[];
};

type CardApplicationWithRelations = CardApplication & {
  card: Card;
};

// Setup mock data
const mockBank = {
  id: 'test-bank',
  name: 'Test Bank',
  website: 'https://test-bank.com',
  chexSystemsSensitive: false,
  earlyTermFee: null,
  earlyTermPeriod: null,
  bonusCooldown: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCard: CardWithRules = {
  id: 'test-card',
  issuer: 'Chase',
  name: 'Test Card',
  network: 'VISA',
  type: 'CREDIT',
  annualFee: 95,
  creditScoreMin: 740,
  rewardType: 'Points',
  signupBonus: 60000,
  minSpend: 4000,
  minSpendPeriod: 3,
  isActive: true,
  businessCard: false,
  velocityRules: [],
  churningRules: [],
  referralBonus: null,
  referralBonusCash: null,
  bonusRequirements: [
    {
      id: 'test-bonus',
      bonusId: 'test-bonus',
      type: RequirementType.DIRECT_DEPOSIT,
      amount: 4000,
      count: null,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
    },
  ],
  issuerRules: [
    {
      id: 'test-rule',
      cardId: 'test-card',
      ruleType: '5/24',
      description: 'No more than 5 cards in 24 months',
      cooldownPeriod: 24,
      isActive: true,
      maxCards: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApplication: CardApplication = {
  id: 'test-application',
  userId: 'test-user',
  cardId: 'test-card',
  status: CardStatus.APPROVED,
  notes: 'Test application',
  spendProgress: 0,
  annualFeePaid: false,
  approvedAt: new Date(),
  appliedAt: new Date(),
  bonusEarnedAt: null,
  closedAt: null,
  creditPullId: null,
  annualFeeDue: null,
  spendDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
};

const mockRetentionOffer: RetentionOffer = {
  id: 'test-offer',
  cardId: 'test-card',
  applicationId: 'test-application',
  pointsOffered: 10000,
  statementCredit: 100,
  spendRequired: 3000,
  offerDate: new Date(),
  accepted: null,
  notes: 'Annual fee retention offer',
};

// Setup before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mock implementations
  prismaMock.bank.findUnique.mockResolvedValue(mockBank);
  prismaMock.bank.findFirst.mockResolvedValue(mockBank);
  prismaMock.bank.findMany.mockResolvedValue([mockBank]);
  
  prismaMock.card.findUnique.mockResolvedValue(mockCard);
  prismaMock.card.findFirst.mockResolvedValue(mockCard);
  prismaMock.card.findMany.mockResolvedValue([mockCard]);
  
  prismaMock.cardApplication.findUnique.mockResolvedValue(mockApplication);
  prismaMock.cardApplication.findFirst.mockResolvedValue(mockApplication);
  prismaMock.cardApplication.findMany.mockResolvedValue([mockApplication]);
  
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'test-user',
    firebaseUid: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://test.com/photo.jpg',
    creditScore: null,
    monthlyIncome: null,
    householdId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  prismaMock.company.findUnique.mockResolvedValue({
    id: 'test-company',
    name: 'Test Company',
    industry: 'Technology',
    size: null,
    website: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  prismaMock.customer.findUnique.mockResolvedValue({
    id: 'test-customer',
    companyId: 'test-company',
    name: 'Test Customer',
    email: 'customer@test.com',
    status: 'active',
    lastActive: new Date(),
    churnedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

// Create mock instances
const mockPrismaClient = mockDeep<PrismaClient>();

// Mock Firebase Admin Auth
const mockVerifyIdToken = jest.fn().mockResolvedValue({
  uid: 'test-user',
  email: 'test@example.com',
  email_verified: true,
});

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock request and response
const mockRequest = (headers: Record<string, string> = {}) => ({
  headers: {
    get: (key: string) => headers[key],
    ...headers,
  },
});

const mockResponse = () => ({
  setHeader: jest.fn(),
});

// Update test context with authenticated user and Prisma mock
const createAuthContext = async () => {
  const context = await createContext({
    req: mockRequest({
      authorization: 'Bearer test-token',
    }),
    res: mockResponse(),
  } as any);

  // Mock the session with full DecodedIdToken
  context.session = {
    uid: 'test-user',
    aud: 'test-audience',
    auth_time: Date.now(),
    exp: Date.now() + 3600,
    iat: Date.now(),
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-user',
    email: 'test@example.com',
    email_verified: true,
    firebase: {
      identities: {
        email: ['test@example.com'],
      },
      sign_in_provider: 'custom',
    },
  };

  // Use mock Prisma client
  context.prisma = prismaMock;

  return context;
};

// Test context without authentication
const createAnonContext = () => {
  return createContext({
    req: mockRequest(),
    res: mockResponse(),
  } as any);
};

// Replace all instances of createCaller with appRouter.createCaller
const createCaller = async () => {
  return appRouter.createCaller(await createAuthContext());
};

describe('Bank Router', () => {
  test('openAccount - should create new bank account', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock bank findUnique with all required fields
    const mockBankWithCooldown = {
      ...mockBank,
      bonusCooldown: 12,
    };
    prismaMock.bank.findUnique.mockResolvedValueOnce(mockBankWithCooldown);

    // Mock no recent bonus
    prismaMock.bankAccount.findFirst.mockResolvedValueOnce(null);

    // Mock account creation with all required fields
    const mockBankAccount = {
      id: 'new-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      notes: null,
      bonusEarnedAt: null,
      closedAt: null,
      bonusId: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.bankAccount.create.mockResolvedValueOnce(mockBankAccount);

    const input = {
      bankId: 'test-bank',
      accountType: 'checking',
      bonusId: 'test-bonus',
      minimumBalance: 1500,
      monthsFeeWaived: 3,
      notes: 'Test account',
    };

    const result = await caller.bank.openAccount(input);
    expect(result).toBeDefined();
    expect(result.id).toBe('new-account');
    expect(prismaMock.bank.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-bank' },
    });
  });

  test('openAccount - should throw if bank not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock bank not found
    prismaMock.bank.findUnique.mockResolvedValueOnce(null);

    const input = {
      bankId: 'non-existent',
      accountType: 'checking',
    };

    await expect(caller.bank.openAccount(input)).rejects.toThrow('Bank not found');
  });

  test('openAccount - should throw if within bonus cooldown period', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock bank with cooldown
    const mockBankWithCooldown = {
      ...mockBank,
      bonusCooldown: 12,
    };
    prismaMock.bank.findUnique.mockResolvedValueOnce(mockBankWithCooldown);

    // Mock recent bonus
    const recentBonus = {
      id: 'recent-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      notes: null,
      bonusEarnedAt: new Date(),
      closedAt: null,
      bonusId: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.bankAccount.findFirst.mockResolvedValueOnce(recentBonus);

    const input = {
      bankId: 'test-bank',
      accountType: 'checking',
    };

    await expect(caller.bank.openAccount(input)).rejects.toThrow('Must wait 12 months between bonuses');
  });

  test('getAccounts - should return all accounts for user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    const mockBankAccount = {
      id: 'test-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      notes: null,
      bonusEarnedAt: null,
      closedAt: null,
      bonusId: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.bankAccount.findMany.mockResolvedValueOnce([mockBankAccount]);

    const result = await caller.bank.getAccounts({
      limit: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('test-account');
  });

  test('addDirectDeposit - should add direct deposit and update bonus requirements', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock bank account with bonus requirements
    const mockAccountWithBonus = {
      id: 'test-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      bonusId: 'test-bonus',
      bonus: {
        requirements: [{
          id: 'req-1',
          bonusId: 'test-bonus',
          type: RequirementType.DIRECT_DEPOSIT,
          amount: 500,
          count: 2,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
        }],
      },
      directDeposits: [],
      notes: null,
      bonusEarnedAt: null,
      closedAt: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.bankAccount.findUnique.mockResolvedValueOnce(mockAccountWithBonus);
    
    // Mock direct deposit creation
    const mockDirectDeposit = {
      id: 'dd-1',
      accountId: 'test-account',
      amount: 1000,
      source: 'Employer',
      date: new Date(),
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.directDeposit.create.mockResolvedValueOnce(mockDirectDeposit);
    
    // Mock direct deposit count for bonus requirement
    prismaMock.directDeposit.count.mockResolvedValueOnce(2);
    
    // Mock bonus requirement update
    prismaMock.bonusRequirement.update.mockResolvedValueOnce({
      ...mockAccountWithBonus.bonus.requirements[0],
      completed: true,
      completedAt: expect.any(Date),
    });

    const input = {
      accountId: 'test-account',
      amount: 1000,
      source: 'Employer',
      date: new Date(),
    };

    const result = await caller.bank.addDirectDeposit(input);
    expect(result.amount).toBe(1000);
    expect(result.source).toBe('Employer');
    expect(prismaMock.bonusRequirement.update).toHaveBeenCalled();
  });

  test('addDirectDeposit - should throw if account not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);

    const input = {
      accountId: 'non-existent',
      amount: 1000,
      source: 'Employer',
      date: new Date(),
    };

    await expect(caller.bank.addDirectDeposit(input)).rejects.toThrow('Account not found');
  });

  test('addDebitTransaction - should add debit transaction and update bonus requirements', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock bank account with bonus requirements
    const mockAccountWithBonus = {
      id: 'test-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      bonusId: 'test-bonus',
      bonus: {
        requirements: [{
          id: 'req-1',
          bonusId: 'test-bonus',
          type: RequirementType.DEBIT_TRANSACTIONS,
          amount: 0,
          count: 10,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
        }],
      },
      debitTransactions: [],
      notes: null,
      bonusEarnedAt: null,
      closedAt: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.bankAccount.findUnique.mockResolvedValueOnce(mockAccountWithBonus);
    
    // Mock debit transaction creation
    const mockDebitTransaction = {
      id: 'debit-1',
      accountId: 'test-account',
      amount: 50,
      description: 'Grocery store',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.debitTransaction.create.mockResolvedValueOnce(mockDebitTransaction);
    
    // Mock debit transaction count for bonus requirement
    prismaMock.debitTransaction.count.mockResolvedValueOnce(10);
    
    // Mock bonus requirement update
    prismaMock.bonusRequirement.update.mockResolvedValueOnce({
      ...mockAccountWithBonus.bonus.requirements[0],
      completed: true,
      completedAt: expect.any(Date),
    });

    const input = {
      accountId: 'test-account',
      amount: 50,
      description: 'Grocery store',
      date: new Date(),
    };

    const result = await caller.bank.addDebitTransaction(input);
    expect(result.amount).toBe(50);
    expect(result.description).toBe('Grocery store');
    expect(prismaMock.bonusRequirement.update).toHaveBeenCalled();
  });

  test('addDebitTransaction - should throw if account not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);

    const input = {
      accountId: 'non-existent',
      amount: 50,
      description: 'Grocery store',
      date: new Date(),
    };

    await expect(caller.bank.addDebitTransaction(input)).rejects.toThrow('Account not found');
  });
});

describe('Authentication', () => {
  test('protected routes - should require authentication', async () => {
    const caller = appRouter.createCaller(await createAnonContext());

    // Try to access protected route
    await expect(
      caller.card.getApplications({
        limit: 10,
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('Company Router', () => {
  const mockCompany = {
    id: 'test-company',
    name: 'Test Company',
    website: 'https://test.company',
    industry: 'Technology',
    size: '1000+',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test('create - should create new company', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock company creation
    prismaMock.company.create.mockResolvedValueOnce(mockCompany);

    type Input = inferProcedureInput<AppRouter['company']['create']>;
    const input: Input = {
      name: 'Test Company',
      website: 'https://test.company',
      industry: 'Technology',
      size: '1000+',
    };

    const result = await caller.company.create(input);
    expect(result.name).toBe('Test Company');
    expect(result.industry).toBe('Technology');
  });

  test('update - should update company', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find company
    prismaMock.company.findUnique.mockResolvedValueOnce(mockCompany);

    // Mock update company
    const updatedCompany = {
      ...mockCompany,
      name: 'Updated Company',
      industry: 'Finance',
    };
    prismaMock.company.update.mockResolvedValueOnce(updatedCompany);

    type Input = inferProcedureInput<AppRouter['company']['update']>;
    const input: Input = {
      id: 'test-company',
      name: 'Updated Company',
      industry: 'Finance',
    };

    const result = await caller.company.update(input);
    expect(result.name).toBe('Updated Company');
    expect(result.industry).toBe('Finance');
  });

  test('update - should reject if company not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock company not found
    prismaMock.company.update.mockRejectedValue(new Error('Record to update not found.'));

    type Input = inferProcedureInput<AppRouter['company']['update']>;
    const input: Input = {
      id: 'test-company',
      name: 'Updated Company',
      industry: 'Finance',
    };

    await expect(caller.company.update(input)).rejects.toThrow('Record to update not found');
  });

  test('delete - should delete company', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock delete company
    prismaMock.company.delete.mockResolvedValueOnce(mockCompany);

    type Input = inferProcedureInput<AppRouter['company']['delete']>;
    const input: Input = 'test-company';

    const result = await caller.company.delete(input);
    expect(result.id).toBe('test-company');
  });

  test('delete - should reject if company not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock company not found
    prismaMock.company.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

    type Input = inferProcedureInput<AppRouter['company']['delete']>;
    const input: Input = 'test-company';

    await expect(caller.company.delete(input)).rejects.toThrow('Record to delete does not exist');
  });

  test('getAll - should return all companies', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock companies
    const mockCompanies = Array(5).fill(mockCompany);
    prismaMock.company.findMany.mockResolvedValueOnce(mockCompanies);

    const result = await caller.company.getAll();
    expect(result).toHaveLength(5);
  });

  test('getById - should return company by id', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find company
    prismaMock.company.findUnique.mockResolvedValueOnce(mockCompany);

    type Input = inferProcedureInput<AppRouter['company']['getById']>;
    const input: Input = 'test-company';

    const result = await caller.company.getById(input);
    expect(result.id).toBe('test-company');
  });

  test('getById - should reject if company not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock company not found
    prismaMock.company.findUnique.mockResolvedValue(null);

    type Input = inferProcedureInput<AppRouter['company']['getById']>;
    const input: Input = 'test-company';

    await expect(caller.company.getById(input)).rejects.toThrow('Company not found');
  });
});

describe('Customer Router', () => {
  const mockCustomer = {
    id: 'test-customer',
    companyId: 'test-company',
    email: 'customer@test.com',
    name: 'Test Customer',
    status: 'active',
    lastActive: new Date(),
    churnedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test('getAll - should return all customers for company', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock customers
    const mockCustomers = Array(5).fill(mockCustomer);
    prismaMock.customer.findMany.mockResolvedValue(mockCustomers);

    type Input = inferProcedureInput<AppRouter['customer']['getAll']>;
    const input: Input = {
      companyId: 'test-company',
    };

    const result = await caller.customer.getAll(input);
    expect(result).toHaveLength(5);
  });

  test('getAll - should filter by status', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock customers
    const mockCustomers = Array(3).fill({
      ...mockCustomer,
      status: 'churned',
    });
    prismaMock.customer.findMany.mockResolvedValue(mockCustomers);

    type Input = inferProcedureInput<AppRouter['customer']['getAll']>;
    const input: Input = {
      companyId: 'test-company',
      status: 'churned',
    };

    const result = await caller.customer.getAll(input);
    expect(result).toHaveLength(3);
    expect(result[0].status).toBe('churned');
  });

  test('getById - should return customer by id', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find customer
    prismaMock.customer.findUnique.mockResolvedValue(mockCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['getById']>;
    const input: Input = 'test-customer';

    const result = await caller.customer.getById(input);
    expect(result.id).toBe('test-customer');
  });

  test('getById - should reject if customer not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock customer not found
    prismaMock.customer.findUnique.mockResolvedValue(null);

    type Input = inferProcedureInput<AppRouter['customer']['getById']>;
    const input: Input = 'test-customer';

    await expect(caller.customer.getById(input)).rejects.toThrow('Customer not found');
  });

  test('create - should create new customer', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock customer creation
    prismaMock.customer.create.mockResolvedValue(mockCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['create']>;
    const input: Input = {
      companyId: 'test-company',
      email: 'customer@test.com',
      name: 'Test Customer',
    };

    const result = await caller.customer.create(input);
    expect(result.email).toBe('customer@test.com');
    expect(result.status).toBe('active');
  });

  test('update - should update customer', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock update customer
    const updatedCustomer = {
      ...mockCustomer,
      name: 'Updated Customer',
      email: 'updated@test.com',
    };
    prismaMock.customer.update.mockResolvedValue(updatedCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['update']>;
    const input: Input = {
      id: 'test-customer',
      name: 'Updated Customer',
      email: 'updated@test.com',
    };

    const result = await caller.customer.update(input);
    expect(result.name).toBe('Updated Customer');
    expect(result.email).toBe('updated@test.com');
  });

  test('update - should set churnedAt when status is churned', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock update customer
    const updatedCustomer = {
      ...mockCustomer,
      status: 'churned',
      churnedAt: new Date(),
    };
    prismaMock.customer.update.mockResolvedValue(updatedCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['update']>;
    const input: Input = {
      id: 'test-customer',
      status: 'churned',
    };

    const result = await caller.customer.update(input);
    expect(result.status).toBe('churned');
    expect(result.churnedAt).toBeDefined();
  });

  test('delete - should delete customer', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock delete customer
    prismaMock.customer.delete.mockResolvedValue(mockCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['delete']>;
    const input: Input = 'test-customer';

    const result = await caller.customer.delete(input);
    expect(result.id).toBe('test-customer');
  });

  test('delete - should reject if customer not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock customer not found
    prismaMock.customer.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

    type Input = inferProcedureInput<AppRouter['customer']['delete']>;
    const input: Input = 'test-customer';

    await expect(caller.customer.delete(input)).rejects.toThrow('Record to delete does not exist');
  });

  test('updateStatus - should update customer status', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock update customer
    const updatedCustomer = {
      ...mockCustomer,
      status: 'at_risk',
    };
    prismaMock.customer.update.mockResolvedValue(updatedCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['updateStatus']>;
    const input: Input = {
      id: 'test-customer',
      status: 'at_risk',
    };

    const result = await caller.customer.updateStatus(input);
    expect(result.status).toBe('at_risk');
  });

  test('updateStatus - should set churnedAt when status is churned', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock update customer
    const updatedCustomer = {
      ...mockCustomer,
      status: 'churned',
      churnedAt: new Date(),
    };
    prismaMock.customer.update.mockResolvedValue(updatedCustomer);

    type Input = inferProcedureInput<AppRouter['customer']['updateStatus']>;
    const input: Input = {
      id: 'test-customer',
      status: 'churned',
    };

    const result = await caller.customer.updateStatus(input);
    expect(result.status).toBe('churned');
    expect(result.churnedAt).toBeDefined();
  });
});

describe('User Router', () => {
  const mockUser = {
    id: 'test-user',
    firebaseUid: 'firebase-123',
    email: 'user@test.com',
    displayName: 'Test User',
    photoURL: 'https://test.com/photo.jpg',
    creditScore: null,
    monthlyIncome: null,
    householdId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test('me - should return current user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find user
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await caller.user.me();
    expect(result.id).toBe('test-user');
    expect(result.email).toBe('user@test.com');
  });

  test('me - should reject if user not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock user not found
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(caller.user.me()).rejects.toThrow('User not found');
  });

  test('create - should create new user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock user creation
    prismaMock.user.create.mockResolvedValue(mockUser);

    type Input = inferProcedureInput<AppRouter['user']['create']>;
    const input: Input = {
      firebaseUid: 'firebase-123',
      email: 'user@test.com',
      displayName: 'Test User',
      photoURL: 'https://test.com/photo.jpg',
    };

    const result = await caller.user.create(input);
    expect(result.firebaseUid).toBe('firebase-123');
    expect(result.email).toBe('user@test.com');
  });

  test('update - should update user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock update user
    const updatedUser = {
      ...mockUser,
      displayName: 'Updated User',
      photoURL: 'https://test.com/new-photo.jpg',
    };
    prismaMock.user.update.mockResolvedValue(updatedUser);

    type Input = inferProcedureInput<AppRouter['user']['update']>;
    const input: Input = {
      displayName: 'Updated User',
      photoURL: 'https://test.com/new-photo.jpg',
    };

    const result = await caller.user.update(input);
    expect(result.displayName).toBe('Updated User');
    expect(result.photoURL).toBe('https://test.com/new-photo.jpg');
  });

  test('delete - should delete user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock delete user
    prismaMock.user.delete.mockResolvedValue(mockUser);

    const result = await caller.user.delete();
    expect(result.id).toBe('test-user');
  });

  test('delete - should reject if user not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock user not found
    prismaMock.user.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

    await expect(caller.user.delete()).rejects.toThrow('Record to delete does not exist');
  });
});

describe('Card Router', () => {
  test('getApplications - should return all applications for user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };

    const mockApplications = {
      items: [mockApplicationWithCard],
      nextCursor: undefined,
    };
    prismaMock.cardApplication.findMany.mockResolvedValueOnce([mockApplicationWithCard]);

    const result = await caller.card.getApplications({
      limit: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('test-application');
  });

  test('applyForCard - should create new application', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find card
    prismaMock.card.findUnique.mockResolvedValueOnce(mockCard);

    // Mock create application
    prismaMock.cardApplication.create.mockResolvedValueOnce(mockApplication);

    const input = {
      cardId: 'test-card',
      notes: 'Test application',
    };

    const result = await caller.card.applyForCard(input);
    expect(result.id).toBe('test-application');
    expect(result.status).toBe(CardStatus.APPROVED);
  });

  test('updateStatus - should update application status', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };
    
    // Mock find application
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    // Mock update application
    const updatedApplication = {
      ...mockApplication,
      status: CardStatus.APPROVED,
      approvedAt: new Date(),
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      status: CardStatus.APPROVED,
      approvedAt: new Date(),
    };

    const result = await caller.card.updateStatus(input);
    expect(result.status).toBe(CardStatus.APPROVED);
    expect(result.approvedAt).toBeDefined();
  });

  test('updateStatus - should throw if application not found', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(null);

    const input = {
      applicationId: 'non-existent',
      status: CardStatus.APPROVED,
    };

    await expect(caller.card.updateStatus(input)).rejects.toThrow('Application not found');
  });

  test('updateStatus - should throw if application belongs to different user', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      userId: 'different-user',
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      status: CardStatus.APPROVED,
    };

    await expect(caller.card.updateStatus(input)).rejects.toThrow('Application not found');
  });

  test('updateSpend - should update spend progress and mark bonus as earned if threshold met', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 5000,
      bonusEarnedAt: new Date(),
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 2000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(5000);
    expect(result.bonusEarnedAt).toBeDefined();
  });

  test('updateSpend - should not mark bonus as earned if threshold not met', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 1000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 2000,
      bonusEarnedAt: null,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(2000);
    expect(result.bonusEarnedAt).toBeNull();
  });

  test('updateSpend - should handle spend after bonus earned', async () => {
    const caller = await createCaller();
    
    const bonusEarnedAt = new Date();
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 4000,
      bonusEarnedAt,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 5000,
      bonusEarnedAt,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(5000);
    expect(result.bonusEarnedAt).toEqual(bonusEarnedAt);
  });

  test('updateSpend - should handle negative spend amounts', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 2000,
      bonusEarnedAt: null,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: -1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(2000);
    expect(result.bonusEarnedAt).toBeNull();
  });

  test('updateSpend - should throw if spend date is after deadline', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
      spendDeadline: new Date(),
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    };

    await expect(caller.card.updateSpend(input)).rejects.toThrow('Spend date is after bonus deadline');
  });

  test('updateSpend - should throw if application is not approved', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      status: CardStatus.PENDING,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    await expect(caller.card.updateSpend(input)).rejects.toThrow('Cannot track spend for non-approved applications');
  });

  test('addRetentionOffer - should add retention offer to application', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock find application with proper type
    const applicationWithCard: CardApplicationWithRelations = {
      ...mockApplication,
      card: mockCard,
    };
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(applicationWithCard);

    // Mock create retention offer
    prismaMock.retentionOffer.create.mockResolvedValueOnce(mockRetentionOffer);

    const input = {
      applicationId: 'test-application',
      pointsOffered: 10000,
      statementCredit: 100,
      spendRequired: 3000,
      notes: 'Annual fee retention offer',
    };

    const result = await caller.card.addRetentionOffer(input);
    expect(result.pointsOffered).toBe(10000);
    expect(result.statementCredit).toBe(100);
    expect(result.spendRequired).toBe(3000);
  });

  test('updateSpend - should not mark bonus as earned if threshold not met', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 1000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 2000,
      bonusEarnedAt: null,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(2000);
    expect(result.bonusEarnedAt).toBeNull();
  });

  test('updateSpend - should handle spend after bonus earned', async () => {
    const caller = await createCaller();
    
    const bonusEarnedAt = new Date();
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 4000,
      bonusEarnedAt,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 5000,
      bonusEarnedAt,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(5000);
    expect(result.bonusEarnedAt).toEqual(bonusEarnedAt);
  });

  test('updateSpend - should handle negative spend amounts', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 2000,
      bonusEarnedAt: null,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: -1000,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(2000);
    expect(result.bonusEarnedAt).toBeNull();
  });

  test('updateSpend - should throw if spend date is after deadline', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
      spendDeadline: new Date(),
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    };

    await expect(caller.card.updateSpend(input)).rejects.toThrow('Spend date is after bonus deadline');
  });

  test('updateSpend - should throw if application is not approved', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      status: CardStatus.PENDING,
      card: {
        ...mockCard,
        minSpend: 4000,
      },
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      amount: 1000,
      date: new Date(),
    };

    await expect(caller.card.updateSpend(input)).rejects.toThrow('Cannot track spend for non-approved applications');
  });

  test('addRetentionOffer - should throw if application is not approved', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      status: CardStatus.PENDING,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      pointsOffered: 10000,
      statementCredit: 100,
      spendRequired: 3000,
      notes: 'Annual fee retention offer',
    };

    await expect(caller.card.addRetentionOffer(input)).rejects.toThrow('Cannot add retention offer for non-approved applications');
  });

  test('addRetentionOffer - should throw if application is closed', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      status: CardStatus.APPROVED,
      closedAt: new Date(),
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const input = {
      applicationId: 'test-application',
      pointsOffered: 10000,
      statementCredit: 100,
      spendRequired: 3000,
      notes: 'Annual fee retention offer',
    };

    await expect(caller.card.addRetentionOffer(input)).rejects.toThrow('Cannot add retention offer for closed applications');
  });

  test('checkEligibility - should detect 5/24 violation', async () => {
    const caller = await createCaller();
    
    // Mock find card with 5/24 rule
    const cardWithRules: CardWithRules = {
      ...mockCard,
      issuerRules: [{
        id: 'rule-1',
        cardId: 'test-card',
        ruleType: '5/24',
        description: 'No more than 5 cards in 24 months',
        cooldownPeriod: 24,
        isActive: true,
        maxCards: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    };
    prismaMock.card.findUnique.mockResolvedValueOnce(cardWithRules);

    // Mock 6 recent applications within 24 months
    const recentApplications = Array(6).fill({
      ...mockApplication,
      appliedAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
      card: mockCard,
    });
    prismaMock.cardApplication.findMany.mockResolvedValueOnce(recentApplications);

    const result = await caller.card.checkEligibility({
      cardId: 'test-card',
    });

    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('5/24');
  });

  test('checkEligibility - should detect issuer rule violation', async () => {
    const caller = await createCaller();
    
    // Mock find card with issuer rule
    const cardWithRules: CardWithRules = {
      ...mockCard,
      issuerRules: [{
        id: 'rule-2',
        cardId: 'test-card',
        ruleType: 'SAPPHIRE_48',
        description: 'No Sapphire bonus within 48 months',
        cooldownPeriod: 48,
        isActive: true,
        maxCards: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    };
    prismaMock.card.findUnique.mockResolvedValueOnce(cardWithRules);

    // Mock recent Sapphire application with bonus earned
    const recentApplications = [{
      ...mockApplication,
      bonusEarnedAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 12 months ago
      card: {
        ...mockCard,
        name: 'Sapphire Reserve',
      },
    }];
    prismaMock.cardApplication.findMany.mockResolvedValueOnce(recentApplications);

    const result = await caller.card.checkEligibility({
      cardId: 'test-card',
    });

    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('SAPPHIRE_48');
  });

  test('checkEligibility - should handle multiple rule violations', async () => {
    const caller = await createCaller();
    
    // Mock find card with multiple rules
    const cardWithRules: CardWithRules = {
      ...mockCard,
      issuerRules: [
        {
          id: 'rule-1',
          cardId: 'test-card',
          ruleType: '5/24',
          description: 'No more than 5 cards in 24 months',
          cooldownPeriod: 24,
          isActive: true,
          maxCards: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule-2',
          cardId: 'test-card',
          ruleType: 'SAPPHIRE_48',
          description: 'No Sapphire bonus within 48 months',
          cooldownPeriod: 48,
          isActive: true,
          maxCards: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    prismaMock.card.findUnique.mockResolvedValueOnce(cardWithRules);

    // Mock applications that violate both rules
    const recentApplications = [
      ...Array(6).fill({
        ...mockApplication,
        appliedAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
        card: mockCard,
      }),
      {
        ...mockApplication,
        bonusEarnedAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 12 months ago
        card: {
          ...mockCard,
          name: 'Sapphire Reserve',
        },
      },
    ];
    prismaMock.cardApplication.findMany.mockResolvedValueOnce(recentApplications);

    const result = await caller.card.checkEligibility({
      cardId: 'test-card',
    });

    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations.map(v => v.rule)).toContain('5/24');
    expect(result.violations.map(v => v.rule)).toContain('SAPPHIRE_48');
  });

  test('checkEligibility - should handle inactive rules', async () => {
    const caller = await createCaller();
    
    // Mock find card with inactive rule
    const cardWithRules: CardWithRules = {
      ...mockCard,
      issuerRules: [{
        id: 'rule-1',
        cardId: 'test-card',
        ruleType: '5/24',
        description: 'No more than 5 cards in 24 months',
        cooldownPeriod: 24,
        isActive: false, // Inactive rule
        maxCards: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    };
    prismaMock.card.findUnique.mockResolvedValueOnce(cardWithRules);

    // Mock 6 recent applications
    const recentApplications = Array(6).fill({
      ...mockApplication,
      appliedAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
      card: mockCard,
    });
    prismaMock.cardApplication.findMany.mockResolvedValueOnce(recentApplications);

    const result = await caller.card.checkEligibility({
      cardId: 'test-card',
    });

    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('checkEligibility - should handle unknown rule types', async () => {
    const caller = await createCaller();
    
    // Mock find card with unknown rule type
    const cardWithRules: CardWithRules = {
      ...mockCard,
      issuerRules: [{
        id: 'rule-1',
        cardId: 'test-card',
        ruleType: 'UNKNOWN_RULE' as any,
        description: 'Unknown rule',
        cooldownPeriod: 24,
        isActive: true,
        maxCards: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    };
    prismaMock.card.findUnique.mockResolvedValueOnce(cardWithRules);

    // Mock recent applications
    prismaMock.cardApplication.findMany.mockResolvedValueOnce([]);

    const result = await caller.card.checkEligibility({
      cardId: 'test-card',
    });

    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('checkEligibility - should handle card not found', async () => {
    const caller = await createCaller();
    
    // Mock card not found
    prismaMock.card.findUnique.mockResolvedValueOnce(null);

    await expect(caller.card.checkEligibility({
      cardId: 'non-existent',
    })).rejects.toThrow('Card not found');
  });

  test('updateSpend - should handle zero amount', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
      spendProgress: 3000,
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const updatedApplication = {
      ...mockApplicationWithCard,
      spendProgress: 3000,
      bonusEarnedAt: null,
    };
    prismaMock.cardApplication.update.mockResolvedValueOnce(updatedApplication);

    const input = {
      applicationId: 'test-application',
      amount: 0,
      date: new Date(),
    };

    const result = await caller.card.updateSpend(input);
    expect(result.spendProgress).toBe(3000);
    expect(result.bonusEarnedAt).toBeNull();
  });

  test('addRetentionOffer - should handle minimal input', async () => {
    const caller = await createCaller();
    
    const mockApplicationWithCard: CardApplicationWithCard = {
      ...mockApplication,
      status: CardStatus.APPROVED,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };
    
    prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

    const mockOffer = {
      id: 'test-offer',
      applicationId: 'test-application',
      cardId: 'test-card',
      pointsOffered: null,
      statementCredit: null,
      spendRequired: null,
      notes: 'Test offer',
      offerDate: expect.any(Date),
      accepted: null,
    };
    prismaMock.retentionOffer.create.mockResolvedValueOnce(mockOffer);

    const input = {
      applicationId: 'test-application',
      notes: 'Test offer',
    };

    const result = await caller.card.addRetentionOffer(input);
    expect(result.notes).toBe('Test offer');
    expect(result.pointsOffered).toBeNull();
    expect(result.statementCredit).toBeNull();
    expect(result.spendRequired).toBeNull();
  });
}); 