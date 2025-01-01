import { Dataset } from '@crawlee/core';
import { Browser, BrowserContext, chromium } from 'playwright';

import { BankRewardsConfig } from '@/types/scraper';

interface Card {
  title: string;
  detailsUrl: string;
  bonus: string;
  htmlContent: string;
  offerBaseUrl: string;
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

          const processedIds = new Set<string>();
          let hasMoreOffers = true;
          let pageNum = 1;

          while (hasMoreOffers) {
            this.log(`Processing page ${pageNum}`, {
              processed: processedIds.size,
            });

            const cards = await page.$$eval(
              'div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]',
              (elements: Element[]): Card[] => {
                return elements.map((el: Element): Card => {
                  const element = el as CardElement;
                  const titleEl = element.querySelector('.MuiTypography-h6');
                  const detailsButton = element.querySelector(
                    'a[class*="MuiButton-containedSecondary"]'
                  );
                  const bonusEl = element.querySelector('.MuiTypography-body2');
                  const offerButton = element.querySelector(
                    'a[class*="MuiButton-containedPrimary"][target="_blank"]'
                  );

                  // Extract base URL from offer link
                  let offerBaseUrl = '';
                  if (offerButton?.getAttribute('href')) {
                    try {
                      const url = new URL(offerButton.getAttribute('href') || '');
                      offerBaseUrl = `${url.protocol}//${url.hostname}`;
                    } catch (e) {
                      // Invalid URL, leave base empty
                    }
                  }

                  return {
                    title: titleEl?.textContent?.trim() || '',
                    detailsUrl: detailsButton?.getAttribute('href') || '',
                    bonus: bonusEl?.textContent?.trim() || '',
                    htmlContent: element.outerHTML,
                    offerBaseUrl,
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

                  const offerId = card.detailsUrl.split('/').pop() || '';

                  if (processedIds.has(offerId)) {
                    return;
                  }

                  processedIds.add(offerId);

                  const type =
                    card.detailsUrl.includes('/credit-card/') ||
                    card.detailsUrl.includes('/card/')
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
                      const clone = document.documentElement.cloneNode(
                        true
                      ) as HTMLElement;
                      clone
                        .querySelectorAll('script, style')
                        .forEach((el) => el.remove());
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
                        offerBaseUrl: card.offerBaseUrl || '',
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
                    this.log(
                      `Error processing details page: ${fullUrl}`,
                      this.logError(error)
                    );
                  } finally {
                    await detailsPage.close();
                  }
                })
              );
              this.log(
                `Processed chunk ${chunkNum++}/${chunks.length} in ${Date.now() - chunkStartTime}ms`
              );
            }

            // Handle Load More with retries
            const maxRetries = 3;
            let retries = 0;
            let hasMoreContent = true;

            while (hasMoreContent && retries < maxRetries) {
              try {
                this.log(`Attempting to find Load More button (attempt ${retries + 1})`);

                // Find the Load More button using the exact structure
                const loadMoreButton = await page.$(
                  'div[style*="display: flex"][style*="justify-content: center"] button.MuiButton-containedPrimary:has-text("Load More")'
                );

                if (!loadMoreButton) {
                  this.log('No more offers to load (Load More button not found)');
                  hasMoreOffers = false;
                  break;
                }

                const isEnabled = await loadMoreButton.isEnabled();
                if (!isEnabled) {
                  this.log('Load More button found but disabled');
                  hasMoreOffers = false;
                  break;
                }

                // Get current card count
                const currentCardCount = await page.evaluate(
                  () =>
                    document.querySelectorAll(
                      'div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]'
                    ).length
                );

                // Scroll to button with offset and ensure it's in view
                this.log('Scrolling to Load More button');
                await page.evaluate((button: Element) => {
                  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  window.scrollBy(0, -100);
                }, loadMoreButton);

                await page.waitForTimeout(3000);

                // Click using JavaScript
                this.log('Clicking Load More button');
                await page.evaluate((button: Element) => {
                  (button as HTMLElement).click();
                }, loadMoreButton);

                // Wait for new content with increased timeout
                try {
                  this.log('Waiting for new offers to load');
                  await page.waitForFunction(
                    `document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]').length > ${currentCardCount}`,
                    { timeout: 15000 }
                  );

                  // Verify new content was loaded
                  const newCardCount = await page.evaluate(
                    () =>
                      document.querySelectorAll(
                        'div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]'
                      ).length
                  );

                  if (newCardCount > currentCardCount) {
                    pageNum++;
                    this.log(
                      `Successfully loaded page ${pageNum} with ${newCardCount} total offers`
                    );
                    hasMoreContent = true;
                    retries = 0;
                    break;
                  } else {
                    this.log(
                      `No new offers loaded after clicking Load More (attempt ${retries + 1})`
                    );
                    retries++;
                    hasMoreContent = retries < maxRetries;
                  }
                } catch (error) {
                  this.log(
                    `Timeout waiting for new offers to load (attempt ${retries + 1})`,
                    this.logError(error)
                  );
                  retries++;
                  hasMoreContent = retries < maxRetries;
                  await page.waitForTimeout(3000);
                }
              } catch (error) {
                this.log(
                  `Error handling Load More button (attempt ${retries + 1})`,
                  this.logError(error)
                );
                retries++;
                hasMoreContent = retries < maxRetries;
                await page.waitForTimeout(3000);
              }
            }
          }
        } catch (error) {
          this.log(`Error processing URL ${url}`, this.logError(error));
        }
      }
    } finally {
      if (browser) {
        await browser.close();
        this.log(
          `Crawler finished. Total time: ${(Date.now() - startTime) / 1000}s, Offers processed: ${this.offersProcessed}`
        );
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
