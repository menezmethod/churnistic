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

export interface BankRewardsOffer {
  id: string;
  type: 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'BROKERAGE';
  name: string;
  institution: string;
  value: number;
  requirements: string[];
  expirationDate?: Date;
  sourceUrl: string;
  sourceId: string;
  metadata: {
    rawHtml?: string;
    lastChecked: Date;
    status: 'active' | 'expired' | 'error';
    errorDetails?: string;
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
