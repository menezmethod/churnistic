import { BankRewardsConfig } from '@/types/scraper';

export const getBankRewardsConfig = (): BankRewardsConfig => {
  const config: BankRewardsConfig = {
    maxConcurrency: Number(process.env.BANKREWARDS_MAX_CONCURRENCY || '2'),
    maxRequestsPerMinute: Number(process.env.BANKREWARDS_MAX_REQUESTS_PER_MINUTE || '20'),
    maxRetries: Number(process.env.BANKREWARDS_MAX_RETRIES || '3'),
    timeoutSecs: Number(process.env.BANKREWARDS_TIMEOUT_SECS || '30'),
    proxyUrls: JSON.parse(process.env.BANKREWARDS_PROXY_URLS || '[]'),
    userAgent:
      process.env.BANKREWARDS_USER_AGENT ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    storageDir: process.env.BANKREWARDS_STORAGE_DIR || './storage/bankrewards',
    logLevel: (process.env.BANKREWARDS_LOG_LEVEL ||
      'info') as BankRewardsConfig['logLevel'],
  };

  return config;
};

export const BANKREWARDS_SELECTORS = {
  LOAD_MORE_BUTTON: 'button:has-text("Load More")',
  OFFER_CARD: '.offer-card',
  OFFER_DETAILS: {
    TITLE: '.offer-title',
    INSTITUTION: '.institution-name',
    VALUE: '.offer-value',
    TYPE: '.offer-type',
    REQUIREMENTS: '.requirements-list li',
    EXPIRATION: '.expiration-date',
  },
};

export const BANKREWARDS_URLS = {
  BASE_URL: 'https://bankrewards.io',
  OFFERS_PAGE: '/offers',
  OFFER_DETAILS: (id: string) => `/offers/${id}`,
};
