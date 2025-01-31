import path from 'path';

import { BankRewardsConfig } from '@/types/scraper';

export const getBankRewardsConfig = (): BankRewardsConfig => {
  const isGithubAction = process.env.GITHUB_ACTIONS === 'true';

  // Use appropriate storage directory based on environment
  const defaultStorageDir = path.join(
    process.cwd(),
    isGithubAction
      ? '/tmp/bankrewards'
      : process.env.VERCEL
        ? '/tmp/bankrewards'
        : './storage/bankrewards'
  );

  const config: BankRewardsConfig = {
    maxConcurrency: Number(process.env.BANKREWARDS_MAX_CONCURRENCY || '2'),
    maxRequestsPerMinute: Number(process.env.BANKREWARDS_MAX_REQUESTS_PER_MINUTE || '20'),
    maxRetries: Number(process.env.BANKREWARDS_MAX_RETRIES || '3'),
    timeoutSecs: Number(process.env.BANKREWARDS_TIMEOUT_SECS || '30'),
    proxyUrls: JSON.parse(process.env.BANKREWARDS_PROXY_URLS || '[]'),
    userAgent:
      process.env.BANKREWARDS_USER_AGENT ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    storageDir: process.env.BANKREWARDS_STORAGE_DIR || defaultStorageDir,
    logLevel: (process.env.BANKREWARDS_LOG_LEVEL ||
      'info') as BankRewardsConfig['logLevel'],
  };

  return config;
};

export const BANKREWARDS_SELECTORS = {
  LOAD_MORE_BUTTON: 'button.MuiButton-root',
  OFFER_CARD: '.MuiCard-root',
  OFFER_DETAILS: {
    TITLE: 'h6',
    INSTITUTION: 'h6 + .MuiTypography-subtitle2',
    VALUE: '.MuiBox-root p',
    TYPE: '.MuiTypography-subtitle2:first-of-type',
    REQUIREMENTS: '.MuiBox-root p',
    EXPIRATION: '.MuiTypography-body1',
    AVAILABILITY: '.MuiTypography-body2',
    MONTHLY_FEES: '.MuiTypography-body1',
    PERKS: '.MuiTypography-body1',
    CASH_BACK: '.MuiTypography-body1',
    DETAILS_BUTTON: 'a.MuiButton-containedSecondary',
  },
};

export const BANKREWARDS_URLS = {
  BASE_URL: 'https://www.bankrewards.io',
  OFFERS_PAGE: '/offers',
  BANK_DETAILS: (id: string) => `/bank/${id}`,
  CARD_DETAILS: (id: string) => `/card/${id}`,
  BROKERAGE_DETAILS: (id: string) => `/brokerage/${id}`,
};
