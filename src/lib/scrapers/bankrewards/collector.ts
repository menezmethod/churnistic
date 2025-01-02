import { BANKREWARDS_URLS } from '@/app/api/bankrewards/config';
import { BankRewardsConfig, BankRewardsOffer } from '@/types/scraper';

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
    savedOffers: 0,
    invalidOffers: 0,
  };

  constructor(config: BankRewardsConfig) {
    this.config = config;
    this.crawler = new BankRewardsCrawler(config);
    this.database = new BankRewardsDatabase();
  }

  private validateOffer(offer: Partial<BankRewardsOffer>): offer is BankRewardsOffer {
    if (
      !offer.id ||
      !offer.title ||
      !offer.type ||
      !offer.sourceUrl ||
      !offer.sourceId ||
      !offer.metadata
    ) {
      console.error('[BankRewards] Invalid offer missing required fields:', {
        id: !!offer.id,
        title: !!offer.title,
        type: !!offer.type,
        sourceUrl: !!offer.sourceUrl,
        sourceId: !!offer.sourceId,
        metadata: !!offer.metadata,
      });
      return false;
    }
    return true;
  }

  public async collect() {
    const startTime = Date.now();
    console.info('[BankRewards] Starting collection');

    try {
      // Start the crawler
      await this.crawler.run([
        `${BANKREWARDS_URLS.BASE_URL}${BANKREWARDS_URLS.OFFERS_PAGE}`,
      ]);

      // Get all collected offers from the crawler
      const data = await this.crawler.stop();
      const rawOffers = (data?.items || []) as Partial<BankRewardsOffer>[];
      console.info(`[BankRewards] Crawler found ${rawOffers.length} raw offers`);

      // Validate offers
      const validOffers = rawOffers.filter((offer): offer is BankRewardsOffer => {
        const isValid = this.validateOffer(offer);
        if (!isValid) {
          this.stats.invalidOffers++;
        }
        return isValid;
      });

      console.info(
        `[BankRewards] Found ${validOffers.length} valid offers (${this.stats.invalidOffers} invalid)`
      );

      if (validOffers.length === 0) {
        throw new Error('No valid offers found');
      }

      // Mark existing offers as expired before saving new ones
      await this.database.markOffersAsExpired();
      console.info('[BankRewards] Marked existing offers as expired');

      // Save offers to database
      for (const offer of validOffers) {
        try {
          console.info('[BankRewards] Saving offer:', {
            id: offer.id,
            title: offer.title,
            type: offer.type,
          });

          await this.database.saveOffer(offer);
          this.stats.savedOffers++;
          this.stats.offersFound++;
        } catch (error) {
          this.stats.errors++;
          console.error('[BankRewards] Error saving offer:', {
            error: error as Error,
            offerId: offer.id,
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
    }
  }
}
