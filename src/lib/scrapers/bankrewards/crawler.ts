import { Dataset } from '@crawlee/core';
import { Browser, BrowserContext, chromium } from 'playwright';

import { BankRewardsConfig } from '@/types/scraper';

interface Card {
  title: string;
  detailsUrl: string;
  bonus: string;
  htmlContent: string;
  offerBaseUrl: string;
  uniqueId: string;
}

interface CardElement extends HTMLElement {
  querySelector(selector: string): HTMLElement | null;
  outerHTML: string;
}

export class BankRewardsCrawler {
  private dataset!: Dataset;
  private config: BankRewardsConfig;
  private processedIds = new Set<string>();
  private processedUrls = new Set<string>();
  private processedTitles = new Set<string>();
  private offersProcessed = 0;

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

  private generateUniqueId(card: Partial<Card>): string {
    // Create a unique ID combining multiple fields to avoid duplicates
    const normalizedTitle = card.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const normalizedUrl = (card.detailsUrl || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedBonus = card.bonus?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    return `${normalizedTitle}-${normalizedUrl}-${normalizedBonus}`;
  }

  private isDuplicate(card: Partial<Card>): boolean {
    const uniqueId = this.generateUniqueId(card);
    const fullUrl = (card.detailsUrl || '').startsWith('http')
      ? card.detailsUrl || ''
      : `https://www.bankrewards.io${card.detailsUrl || ''}`;
    
    if (this.processedIds.has(uniqueId) || 
        this.processedUrls.has(fullUrl) || 
        this.processedTitles.has(card.title?.toLowerCase() || '')) {
      this.log(`Skipping duplicate offer: ${card.title}`, {
        reason: {
          idMatch: this.processedIds.has(uniqueId),
          urlMatch: this.processedUrls.has(fullUrl),
          titleMatch: this.processedTitles.has(card.title?.toLowerCase() || '')
        }
      });
      return true;
    }

    this.processedIds.add(uniqueId);
    this.processedUrls.add(fullUrl);
    this.processedTitles.add(card.title?.toLowerCase() || '');
    return false;
  }

  private async processCard(card: Card, ctx: BrowserContext): Promise<void> {
    if (!card.detailsUrl || !card.title || this.isDuplicate(card)) {
      return;
    }

    const fullUrl = card.detailsUrl.startsWith('http')
      ? card.detailsUrl
      : `https://www.bankrewards.io${card.detailsUrl}`;

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

      // Only capture essential HTML content
      rawHtml = await detailsPage.evaluate(() => {
        const mainContent = document.querySelector('main');
        if (!mainContent) return '';
        const clone = mainContent.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('script, style, iframe, img').forEach(el => el.remove());
        const div = document.createElement('div');
        div.appendChild(clone);
        return div.innerHTML;
      });

      const fullOffer = {
        id: card.detailsUrl.split('/').pop() || '',
        sourceUrl: fullUrl,
        sourceId: card.detailsUrl.split('/').pop() || '',
        title: card.title,
        type,
        metadata: {
          bonus: card.bonus,
          rawHtml: rawHtml.replace(/\\u[\dA-F]{4}/gi, match => 
            String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
          ).replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'"),
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
      this.log(`Error processing details page: ${fullUrl}`, this.logError(error));
    } finally {
      await detailsPage.close();
    }
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
                  const offerButton = element.querySelector('a[class*="MuiButton-containedPrimary"][target="_blank"]');
                  
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
                    uniqueId: this.generateUniqueId({ 
                      title: titleEl?.textContent?.trim() || '', 
                      detailsUrl: detailsButton?.getAttribute('href') ?? '', 
                      bonus: bonusEl?.textContent?.trim() || '' 
                    }),
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

                  await this.processCard(card, ctx);
                })
              );
              this.log(`Processed chunk ${chunkNum++}/${chunks.length} in ${Date.now() - chunkStartTime}ms`);
            }

            // Handle Load More with retries
            const maxRetries = 3;
            let retries = 0;
            const hasMoreContent = true;

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
                const currentCardCount = await page.evaluate(() => 
                  document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]').length
                );

                // Scroll to button with offset
                this.log('Scrolling to Load More button');
                await page.evaluate((button: Element) => {
                  button.scrollIntoView();
                  window.scrollBy(0, -100);
                }, loadMoreButton);

                await page.waitForTimeout(2000);

                // Click using JavaScript
                this.log('Clicking Load More button');
                await page.evaluate((button: Element) => {
                  (button as HTMLElement).click();
                }, loadMoreButton);

                // Wait for new content
                try {
                  this.log('Waiting for new offers to load');
                  await page.waitForFunction(
                    `document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]').length > ${currentCardCount}`,
                    { timeout: 10000 }
                  );
                  
                  // Verify new content was loaded
                  const newCardCount = await page.evaluate(() => 
                    document.querySelectorAll('div[class*="MuiGrid-root MuiGrid-item MuiGrid-grid-sm-12 MuiGrid-grid-md-6 MuiGrid-grid-xl-4"]').length
                  );

                  if (newCardCount > currentCardCount) {
                    pageNum++;
                    this.log(`Successfully loaded page ${pageNum} with ${newCardCount} total offers`);
                    break;
                  } else {
                    this.log(`No new offers loaded after clicking Load More (attempt ${retries + 1})`);
                    retries++;
                  }
                } catch (error) {
                  this.log(`Timeout waiting for new offers to load (attempt ${retries + 1})`, this.logError(error));
                  retries++;
                  if (retries >= maxRetries) {
                    this.log('Max retries reached for Load More button');
                    hasMoreOffers = false;
                    break;
                  }
                  await page.waitForTimeout(2000); // Wait before retrying
                }
              } catch (error) {
                this.log(`Error handling Load More button (attempt ${retries + 1})`, this.logError(error));
                retries++;
                if (retries >= maxRetries) {
                  this.log('Max retries reached for Load More button');
                  hasMoreOffers = false;
                  break;
                }
                await page.waitForTimeout(2000);
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
