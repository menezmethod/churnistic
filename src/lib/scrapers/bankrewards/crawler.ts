import { Dataset } from '@crawlee/core';
import { chromium, Page, Browser, BrowserContext } from 'playwright';

import { BANKREWARDS_URLS } from '@/app/api/bankrewards/config';
import { BankRewardsConfig } from '@/types/scraper';

export class BankRewardsCrawler {
  private config: BankRewardsConfig;
  private dataset: Dataset | null = null;
  private offersProcessed = 0;

  constructor(config: BankRewardsConfig) {
    this.config = config;
  }

  private log(message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] ${message}`);
    if (data) {
      console.info(JSON.stringify(data, null, 2));
    }
  }

  private async waitForContent(
    page: Page,
    selector: string,
    timeout = 30000
  ): Promise<boolean> {
    try {
      await page.waitForSelector(selector, {
        timeout,
        state: 'visible',
      });
      return true;
    } catch (error) {
      this.log(`Timeout waiting for selector: ${selector}`, this.logError(error));
      return false;
    }
  }

  private logError(error: unknown) {
    if (error instanceof Error) {
      return { error: error.message, stack: error.stack };
    }
    return { error: String(error) };
  }

  public async run(startUrls: string[]) {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      this.log('Starting crawler run');
      this.dataset = await Dataset.open('bankrewards');
      this.log('Dataset opened');

      browser = await chromium.launch({
        headless: true,
      });
      this.log('Browser launched');

      context = await browser.newContext({
        userAgent: this.config.userAgent,
        viewport: { width: 1920, height: 1080 },
      });
      this.log('Browser context created');

      const page = await context.newPage();
      this.log('New page created');

      for (const url of startUrls) {
        try {
          this.log(`Navigating to ${url}`);

          await page.goto(url, {
            timeout: this.config.timeoutSecs * 1000,
            waitUntil: 'networkidle',
          });
          this.log('Page loaded');

          // Wait for page to be fully loaded and rendered
          await page.waitForLoadState('domcontentloaded');
          await page.waitForLoadState('networkidle');
          await page.waitForLoadState('load');

          // Wait longer for dynamic content and ensure JavaScript execution
          await page.waitForTimeout(5000);

          // Try multiple selectors with more robust detection
          const selectors = [
            '[role="article"]',
            '.offer-card',
            '[data-testid="offer-card"]',
            'div[class*="card"]',
            'div[class*="offer"]',
            'div[class*="MuiCard"]',
            'div[class*="Card"]',
            'div[class*="Offer"]',
            'article',
            'div[role="listitem"]'
          ];

          let cards: Array<{ title: string; detailsUrl: string; bonus: string }> = [];
          for (const selector of selectors) {
            this.log(`Trying selector: ${selector}`);
            try {
              // First check if elements exist
              const elements = await page.$$(selector);
              if (elements.length > 0) {
                this.log(`Found ${elements.length} elements with selector: ${selector}`);
                
                // Try to extract data
                cards = await page.$$eval(selector, (elements) => {
                  return elements.map((el) => {
                    // Find title within the card using multiple possible selectors
                    const titleSelectors = [
                      'h1, h2, h3, h4, h5, h6',
                      '[class*="title"]',
                      '[class*="heading"]',
                      'strong',
                      'b'
                    ];
                    
                    let title = '';
                    for (const titleSelector of titleSelectors) {
                      const titleEl = el.querySelector(titleSelector);
                      if (titleEl?.textContent) {
                        title = titleEl.textContent.trim();
                        break;
                      }
                    }

                    // Find link within the card using multiple possible selectors
                    const linkSelectors = [
                      'a[href*="/bank/"]',
                      'a[href*="/brokerage/"]',
                      'a[href*="/credit-card/"]',
                      'a[href*="/card/"]',
                      'a[href]'
                    ];
                    
                    let detailsUrl = '';
                    for (const linkSelector of linkSelectors) {
                      const linkEl = el.querySelector(linkSelector);
                      if (linkEl?.getAttribute('href')) {
                        detailsUrl = linkEl.getAttribute('href') || '';
                        break;
                      }
                    }

                    // Extract bonus amount if visible on the card
                    const bonusEl = el.querySelector('[class*="bonus"], [class*="reward"]');
                    const bonus = bonusEl?.textContent?.trim() || '';

                    return { title, detailsUrl, bonus };
                  });
                });

                if (cards.some(card => card.title && card.detailsUrl)) {
                  this.log(`Successfully extracted data from ${cards.length} cards`);
                  break;
                } else {
                  this.log('Found elements but could not extract data');
                }
              }
            } catch (error) {
              this.log(`Error with selector ${selector}:`, this.logError(error));
              continue;
            }
          }

          if (cards.length === 0) {
            // If no cards found, try to get the page content for debugging
            const content = await page.content();
            this.log('Page content for debugging:', { content: content.substring(0, 1000) });
            throw new Error('No offer cards found on page with any selector');
          }

          this.log(`Found ${cards.length} cards`);

          let hasMoreOffers = true;
          let pageNum = 1;
          const processedUrls = new Set<string>();

          while (hasMoreOffers) {
            this.log(`Processing page ${pageNum}`);

            for (const card of cards) {
              try {
                const { title, detailsUrl, bonus } = card;

                if (!detailsUrl) {
                  this.log('No details URL found for card', { title });
                  continue;
                }

                const fullUrl = detailsUrl.startsWith('http') 
                  ? detailsUrl 
                  : `${BANKREWARDS_URLS.BASE_URL}${detailsUrl}`;

                // Skip if we've already processed this URL
                const normalizedUrl = fullUrl.toLowerCase().trim();
                if (processedUrls.has(normalizedUrl)) {
                  this.log('Skipping duplicate URL', { fullUrl });
                  continue;
                }
                processedUrls.add(normalizedUrl);

                const type = detailsUrl.includes('/credit-card/') || detailsUrl.includes('/card/')
                  ? 'CREDIT_CARD'
                  : detailsUrl.includes('/bank/')
                    ? 'BANK_ACCOUNT'
                    : 'BROKERAGE';

                // Create a new page for the details
                const detailsPage = await context.newPage();
                let rawHtml = '';
                
                try {
                  // Navigate to the details page
                  await detailsPage.goto(fullUrl, {
                    timeout: this.config.timeoutSecs * 1000,
                    waitUntil: 'networkidle',
                  });

                  // Wait for content to load
                  await detailsPage.waitForLoadState('domcontentloaded');
                  await detailsPage.waitForLoadState('networkidle');
                  await detailsPage.waitForTimeout(2000);

                  // Get the raw HTML
                  rawHtml = await detailsPage.evaluate(() => {
                    // Remove scripts and styles for cleaner HTML
                    const clone = document.documentElement.cloneNode(true) as HTMLElement;
                    const scripts = clone.getElementsByTagName('script');
                    const styles = clone.getElementsByTagName('style');

                    while (scripts.length > 0) {
                      scripts[0].parentNode?.removeChild(scripts[0]);
                    }

                    while (styles.length > 0) {
                      styles[0].parentNode?.removeChild(styles[0]);
                    }

                    return clone.outerHTML;
                  });
                } catch (error) {
                  this.log(`Error fetching details page HTML: ${fullUrl}`, this.logError(error));
                } finally {
                  await detailsPage.close();
                }

                const fullOffer = {
                  id: detailsUrl.split('/').pop() || '',
                  sourceUrl: fullUrl,
                  sourceId: detailsUrl.split('/').pop() || '',
                  title: title?.trim() || '',
                  type,
                  metadata: {
                    bonus,
                    rawHtml,
                    lastChecked: new Date(),
                    status: 'active' as const
                  }
                };

                this.log('Processed offer', { id: fullOffer.id, title: fullOffer.title });

                // Save to dataset
                await this.dataset?.pushData(fullOffer);
                this.offersProcessed++;
                this.log(`Saved offer ${this.offersProcessed}`, { id: fullOffer.id });
              } catch (error) {
                this.log(`Error processing card`, this.logError(error));
                // Take error screenshot with unique name
                await page.screenshot({
                  path: `error-card-${this.offersProcessed}-${Date.now()}.png`,
                  fullPage: true,
                });
              }
            }

            // Check for "Load More" button with specific selectors matching the site's structure
            const loadMoreSelectors = [
              'button.MuiButton-containedPrimary',
              'button.MuiButtonBase-root:has-text("Load More")',
              'button.mui-1nluoi4',
              // Fallbacks
              'button:has-text("Load More")',
              'button:has-text(/^Load More$/i)'
            ];

            let loadMoreButton = null;
            for (const selector of loadMoreSelectors) {
              try {
                loadMoreButton = await page.$(selector);
                if (loadMoreButton) {
                  this.log(`Found Load More button with selector: ${selector}`);
                  break;
                }
              } catch (error) {
                this.log(`Error finding Load More button with selector ${selector}:`, this.logError(error));
              }
            }

            if (loadMoreButton) {
              try {
                const isVisible = await loadMoreButton.isVisible();
                const isEnabled = await loadMoreButton.isEnabled();
                
                if (!isVisible || !isEnabled) {
                  this.log('Load More button found but not clickable', { isVisible, isEnabled });
                  hasMoreOffers = false;
                  continue;
                }

                // Scroll the button into view
                await loadMoreButton.scrollIntoViewIfNeeded();
                await page.waitForTimeout(1000); // Wait for scroll to complete

                // Click the button
                await Promise.all([
                  loadMoreButton.click(),
                  // Wait for either network activity or DOM changes
                  Promise.race([
                    page.waitForLoadState('networkidle'),
                    page.waitForFunction(() => {
                      const prevHeight = document.body.scrollHeight;
                      return new Promise((resolve) => {
                        setTimeout(() => {
                          resolve(document.body.scrollHeight > prevHeight);
                        }, 1000);
                      });
                    })
                  ])
                ]);

                this.log('Clicked Load More button and waited for content');

                // Take a screenshot after clicking for debugging
                await page.screenshot({ 
                  path: `after-load-more-${pageNum}.png`,
                  fullPage: true 
                });

                // Wait for new content to be fully loaded
                await page.waitForTimeout(5000);

                // Get updated cards
                try {
                  const prevCardCount = cards.length;
                  cards = await page.$$eval(selectors[0], (elements) => {
                    return elements.map((el) => {
                      const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"]');
                      const title = titleEl?.textContent?.trim() || '';

                      const linkEl = el.querySelector('a[href*="/bank/"], a[href*="/brokerage/"], a[href*="/credit-card/"], a[href*="/card/"]');
                      const detailsUrl = linkEl?.getAttribute('href') || '';

                      const bonusEl = el.querySelector('[class*="bonus"], [class*="reward"]');
                      const bonus = bonusEl?.textContent?.trim() || '';

                      return { title, detailsUrl, bonus };
                    });
                  });

                  const newCardCount = cards.length;
                  this.log(`Cards count after Load More: ${newCardCount} (previous: ${prevCardCount})`);

                  if (newCardCount <= prevCardCount) {
                    this.log('No new cards loaded after clicking Load More');
                    hasMoreOffers = false;
                    continue;
                  }
                } catch (error) {
                  this.log('Error getting updated cards:', this.logError(error));
                  hasMoreOffers = false;
                  continue;
                }
              } catch (error) {
                this.log(`Error processing Load More button`, this.logError(error));
                hasMoreOffers = false;
                continue;
              }
            } else {
              hasMoreOffers = false;
              this.log('No more Load More button found');
            }

            pageNum++;
          }

          this.log(
            `Finished processing all pages. Total offers: ${this.offersProcessed}`
          );
        } catch (error) {
          this.log(`Error processing URL ${url}`, this.logError(error));
          // Take error screenshot with unique name
          await page.screenshot({ 
            path: `error-screenshot-${Date.now()}.png`, 
            fullPage: true 
          });
        }
      }
    } catch (error) {
      this.log('Crawler run failed', this.logError(error));
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        this.log('Browser closed');
      }
    }
  }

  public async stop() {
    try {
      const items = await this.dataset?.getData();
      return items;
    } catch (error) {
      this.log('Error getting dataset', this.logError(error));
      throw error;
    }
  }
}
