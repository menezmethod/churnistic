import { Dataset } from '@crawlee/core';
import { Browser, BrowserContext, chromium } from 'playwright';

import { BankRewardsConfig } from '@/types/scraper';

interface Card {
  title: string;
  detailsUrl: string;
  bonus: string;
  htmlContent: string;
}

interface CardElement extends HTMLElement {
  querySelector(selector: string): HTMLElement | null;
  outerHTML: string;
}

export class BankRewardsCrawler {
  private dataset!: Dataset;
  private offersProcessed = 0;
  private config: BankRewardsConfig;

  constructor(config: BankRewardsConfig) {
    this.config = config;
  }

  private log(message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? data : '');
  }

  private logError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return { error: String(error) };
  }

  public async run(startUrls: string[]) {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    const startTime = Date.now();

    try {
      this.log('Starting crawler run');
      this.dataset = await Dataset.open('bankrewards');

      browser = await chromium.launch({
        headless: true,
      });
      this.log('Browser launched');

      // Optimize context settings for performance
      context = await browser.newContext({
        userAgent: this.config.userAgent,
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        bypassCSP: true,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
      });

      if (!context) {
        throw new Error('Failed to create browser context');
      }

      const ctx = context;
      ctx.setDefaultNavigationTimeout(this.config.timeoutSecs * 1000);
      ctx.setDefaultTimeout(this.config.timeoutSecs * 1000);
      this.log('Browser context optimized');

      const page = await ctx.newPage();

      for (const url of startUrls) {
        const pageStartTime = Date.now();
        try {
          this.log(`Processing URL: ${url}`);
          await Promise.all([
            page.goto(url, { waitUntil: 'domcontentloaded' }),
            page.waitForLoadState('domcontentloaded'),
          ]);
          this.log(`Page loaded in ${Date.now() - pageStartTime}ms`);

          await page.waitForSelector(
            'div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12"]',
            { state: 'attached' }
          );

          const processedUrls = new Set<string>();
          const processedTitles = new Set<string>();
          let hasMoreOffers = true;
          let pageNum = 1;

          while (hasMoreOffers) {
            const pageProcessStartTime = Date.now();
            this.log(`Processing page ${pageNum}`, {
              processed: processedUrls.size,
              uniqueTitles: processedTitles.size,
            });

            const cards = await page.$$eval(
              'div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]',
              (elements: Element[]): Card[] => {
                return elements.map((el: Element): Card => {
                  const element = el as CardElement;
                  const titleEl = element.querySelector('.MuiTypography-h6');
                  const detailsButton = element.querySelector('a[class*="MuiButton-containedSecondary"]');
                  const bonusEl = element.querySelector('.MuiTypography-body2');

                  return {
                    title: titleEl?.textContent?.trim() || '',
                    detailsUrl: detailsButton?.getAttribute('href') || '',
                    bonus: bonusEl?.textContent?.trim() || '',
                    htmlContent: element.outerHTML,
                  };
                });
              }
            );
            this.log(`Found ${cards.length} cards on page ${pageNum}`);

            const concurrency = 3;
            const chunks = [];
            for (let i = 0; i < cards.length; i += concurrency) {
              chunks.push(cards.slice(i, i + concurrency));
            }
            this.log(`Processing cards in ${chunks.length} chunks of ${concurrency}`);

            let chunkNum = 1;
            for (const chunk of chunks) {
              const chunkStartTime = Date.now();
              await Promise.all(
                chunk.map(async (card) => {
                  if (!card.detailsUrl || !card.title) return;

                  const fullUrl = card.detailsUrl.startsWith('http')
                    ? card.detailsUrl
                    : `https://www.bankrewards.io${card.detailsUrl}`;

                  if (processedUrls.has(fullUrl) || processedTitles.has(card.title)) {
                    return;
                  }

                  processedUrls.add(fullUrl);
                  processedTitles.add(card.title);

                  const type = card.detailsUrl.includes('/credit-card/') || card.detailsUrl.includes('/card/')
                    ? 'CREDIT_CARD'
                    : card.detailsUrl.includes('/bank/')
                      ? 'BANK_ACCOUNT'
                      : 'BROKERAGE';

                  const detailsPage = await ctx.newPage();
                  let rawHtml = '';

                  try {
                    const detailsStartTime = Date.now();
                    await Promise.all([
                      detailsPage.goto(fullUrl, { waitUntil: 'domcontentloaded' }),
                      detailsPage.waitForLoadState('domcontentloaded'),
                    ]);

                    rawHtml = await detailsPage.evaluate(() => {
                      const clone = document.documentElement.cloneNode(true) as HTMLElement;
                      clone.querySelectorAll('script, style').forEach(el => el.remove());
                      return clone.outerHTML;
                    });

                    const fullOffer = {
                      id: card.detailsUrl.split('/').pop() || '',
                      sourceUrl: fullUrl,
                      sourceId: card.detailsUrl.split('/').pop() || '',
                      title: card.title,
                      type,
                      metadata: {
                        bonus: card.bonus,
                        rawHtml,
                        lastChecked: new Date(),
                        status: 'active' as const,
                      },
                    };

                    await this.dataset?.pushData(fullOffer);
                    this.offersProcessed++;
                    this.log(`Processed offer ${this.offersProcessed}`, {
                      title: card.title,
                      type,
                      timeMs: Date.now() - detailsStartTime,
                    });
                  } catch (error) {
                    this.log(`Error processing details page: ${fullUrl}`, this.logError(error));
                  } finally {
                    await detailsPage.close();
                  }
                })
              );
              this.log(`Processed chunk ${chunkNum++}/${chunks.length} in ${Date.now() - chunkStartTime}ms`);
            }

            const loadMoreButton = await page.$('button.MuiButton-containedPrimary:visible');
            
            if (loadMoreButton && await loadMoreButton.isVisible() && await loadMoreButton.isEnabled()) {
              try {
                this.log('Found Load More button, loading next page');
                const currentCardCount = await page.evaluate(() => 
                  document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item"]').length
                );

                await Promise.all([
                  loadMoreButton.click(),
                  page.waitForResponse(response => 
                    response.url().includes('/api/') && response.status() === 200
                  ),
                ]);

                await page.waitForFunction(`
                  document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item"]').length > ${currentCardCount}
                `, { timeout: 5000 });

                pageNum++;
                this.log(`Page ${pageNum} loaded in ${Date.now() - pageProcessStartTime}ms`);
              } catch (error) {
                this.log('No more pages to load');
                hasMoreOffers = false;
              }
            } else {
              this.log('No more Load More button found');
              hasMoreOffers = false;
            }
          }
        } catch (error) {
          this.log(`Error processing URL ${url}`, this.logError(error));
        }
      }
    } finally {
      if (browser) {
        await browser.close();
        this.log(`Crawler finished. Total time: ${(Date.now() - startTime) / 1000}s, Offers processed: ${this.offersProcessed}`);
      }
    }
  }

  public async stop() {
    try {
      return await this.dataset?.getData();
    } catch (error) {
      this.log('Error getting dataset', this.logError(error));
      throw error;
    }
  }
}
