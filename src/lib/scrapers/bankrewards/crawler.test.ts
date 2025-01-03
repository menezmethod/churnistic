import { Dataset } from '@crawlee/core';

import { BankRewardsCrawler } from './crawler';

describe('BankRewardsCrawler', () => {
  let crawler: BankRewardsCrawler;
  let mockDataset: Dataset<Record<string, unknown>>;

  beforeEach(() => {
    mockDataset = {
      pushData: jest.fn(),
      getData: jest.fn(),
    } as unknown as Dataset<Record<string, unknown>>;
    const config = {
      userAgent: 'test-user-agent',
      timeoutSecs: 10,
    };
    crawler = new BankRewardsCrawler(config);
  });

  it('should initialize correctly', () => {
    expect(crawler).toBeInstanceOf(BankRewardsCrawler);
    expect(mockDataset.pushData).toBeDefined();
  });
});
