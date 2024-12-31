import { PlaywrightCrawler, createPlaywrightRouter } from '@crawlee/playwright';
import { BankRewardsConfig } from '@/types/scraper';
import { BANKREWARDS_SELECTORS, BANKREWARDS_URLS } from '@/app/api/bankrewards/config';

export class BankRewardsCrawler {
  private crawler: PlaywrightCrawler;

  constructor(config: BankRewardsConfig) {
    const router = createPlaywrightRouter();

    this.crawler = new PlaywrightCrawler({
      maxConcurrency: config.maxConcurrency,
      requestHandler: router,
      maxRequestsPerMinute: config.maxRequestsPerMinute,
      maxRequestRetries: config.maxRetries,
      navigationTimeoutSecs: config.timeoutSecs,
      browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
          fingerprintGeneratorOptions: {
            browsers: ['chrome'],
            devices: ['desktop'],
          },
        },
      },
      preNavigationHooks: [
        async ({ page }) => {
          await page.setExtraHTTPHeaders({
            'User-Agent': config.userAgent,
          });
        },
      ],
    });
  }

  public async run(startUrls: string[]) {
    return this.crawler.run(startUrls);
  }

  public async stop() {
    await this.crawler.teardown();
  }

  public getRouter() {
    return this.crawler.router;
  }

  public addRequests(requests: { url: string; userData?: Record<string, unknown> }[]) {
    return this.crawler.addRequests(requests);
  }
} 