import { Dataset } from '@crawlee/core';
import { BankRewardsConfig, BankRewardsOffer, LogData } from '@/types/scraper';
import { BANKREWARDS_URLS } from '@/app/api/bankrewards/config';
import { BankRewardsCrawler } from './crawler';
import { BankRewardsDatabase } from './database';

export class BankRewardsCollector {
  private config: BankRewardsConfig;
  private crawler: BankRewardsCrawler;
  private database: BankRewardsDatabase;
  private stats = {
    pagesProcessed: 0,
    offersFound: 0,
    errors: 0,
  };

  constructor(config: BankRewardsConfig) {
    this.config = config;
    this.crawler = new BankRewardsCrawler(config);
    this.database = new BankRewardsDatabase();
  }

  public async collect() {
    const startTime = Date.now();
    console.info('[BankRewards] Starting collection');

    try {
      // Initialize Dataset for storing raw data
      await Dataset.open('bankrewards');

      // Start the crawler
      await this.crawler.run([
        `${BANKREWARDS_URLS.BASE_URL}${BANKREWARDS_URLS.OFFERS_PAGE}`,
      ]);

      // Get all collected offers from the dataset
      const dataset = await Dataset.open('bankrewards');
      const { items } = await dataset.getData();
      const offers = items as BankRewardsOffer[];

      // Save offers to database
      for (const item of offers) {
        try {
          await this.database.saveOffer(item);
          this.stats.offersFound++;
        } catch (error) {
          this.stats.errors++;
          console.error('[BankRewards] Error saving offer:', {
            error: error as Error,
            offerId: item.id,
          });
        }
      }

      console.info('[BankRewards] Collection completed', {
        duration: Date.now() - startTime,
        stats: this.stats,
      });

      return {
        success: true,
        stats: this.stats,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[BankRewards] Collection failed', {
        error: error as Error,
        duration: Date.now() - startTime,
        stats: this.stats,
      });
      throw error;
    } finally {
      await this.crawler.stop();
    }
  }
} 