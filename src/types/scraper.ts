import { PlaywrightCrawlerOptions } from '@crawlee/playwright';

export interface LogData {
  timestamp?: Date;
  error?: Error;
  stats?: Record<string, number>;
  metadata?: Record<string, unknown>;
  duration?: number;
  url?: string;
  [key: string]: unknown;
}

export interface BankRewardsConfig {
  maxConcurrency: number;
  maxRequestsPerMinute: number;
  maxRetries: number;
  timeoutSecs: number;
  proxyUrls: string[];
  userAgent: string;
  storageDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export type OfferType = 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'BROKERAGE';

export interface BankRewardsOffer {
  id: string;
  title: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'BROKERAGE';
  sourceUrl: string;
  sourceId: string;
  metadata: {
    bonus: string;
    rawHtml: string;
    lastChecked: Date | string;
    status: 'active' | 'expired';
    offerBaseUrl?: string;
  };
}

export interface ScraperContext {
  config: BankRewardsConfig;
  stats: {
    pagesProcessed: number;
    offersFound: number;
    errors: number;
  };
  logger: {
    debug: (message: string, data?: LogData) => void;
    info: (message: string, data?: LogData) => void;
    warn: (message: string, data?: LogData) => void;
    error: (message: string, data?: LogData) => void;
  };
}

export type BankRewardsCrawlerOptions = PlaywrightCrawlerOptions & {
  context: ScraperContext;
};
