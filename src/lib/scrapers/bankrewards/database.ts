import fs from 'fs';
import path from 'path';

import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly dbPath: string;
  private readonly dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbPath = path.join(this.dataDir, 'bankrewards.json');
    this.ensureDataDirectory();
    this.loadFromDisk();
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.info(`[BankRewards] Created data directory: ${this.dataDir}`);
      }
    } catch (error) {
      console.error('[BankRewards] Error creating data directory:', error);
      throw error;
    }
  }

  private validateOffer(offer: unknown): offer is BankRewardsOffer {
    if (!offer || typeof offer !== 'object') return false;

    const requiredFields = ['id', 'title', 'type', 'sourceUrl', 'sourceId', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in offer)) {
        console.error(`[BankRewards] Offer missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        console.info(`[BankRewards] No existing database file at ${this.dbPath}`);
        return;
      }

      const rawData = fs.readFileSync(this.dbPath, 'utf-8');
      if (!rawData.trim()) {
        console.info('[BankRewards] Empty database file');
        return;
      }

      const data = JSON.parse(rawData);
      let loadedCount = 0;

      if (Array.isArray(data)) {
        // Handle array format
        data.forEach((offer) => {
          if (this.validateOffer(offer)) {
            const uniqueKey = `${offer.id}-${offer.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            this.offers.set(uniqueKey, offer);
            loadedCount++;
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        // Handle object format
        Object.values(data).forEach((offer) => {
          if (this.validateOffer(offer)) {
            const uniqueKey = `${offer.id}-${offer.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            this.offers.set(uniqueKey, offer);
            loadedCount++;
          }
        });
      }

      console.info(`[BankRewards] Loaded ${loadedCount} valid offers from disk`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('[BankRewards] Invalid JSON in database file:', error);
        // Backup corrupted file
        const backupPath = `${this.dbPath}.backup.${Date.now()}`;
        fs.copyFileSync(this.dbPath, backupPath);
        console.info(`[BankRewards] Backed up corrupted database to ${backupPath}`);
        // Start fresh
        this.offers.clear();
      } else {
        console.error('[BankRewards] Error loading database from disk:', error);
        throw error;
      }
    }
  }

  private async saveToDisk() {
    try {
      // Convert Map to Array while preserving all offers
      const data = Array.from(this.offers.values());
      const tempPath = `${this.dbPath}.tmp`;

      // Write to temporary file first
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2));

      // Rename temporary file to actual file (atomic operation)
      await fs.promises.rename(tempPath, this.dbPath);

      this.log(`Saved ${data.length} offers to disk`);
    } catch (error) {
      this.log('Error saving database to disk:', error);
      throw error;
    }
  }

  public async saveOffer(offer: BankRewardsOffer): Promise<void> {
    if (!this.validateOffer(offer)) {
      throw new Error('Invalid offer data');
    }

    // Create a unique key using both the ID and title to handle duplicate IDs
    const uniqueKey = `${offer.id}-${offer.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    // Add or update the offer in memory
    this.offers.set(uniqueKey, {
      ...offer,
      id: offer.id,
      metadata: {
        ...offer.metadata,
        status: 'active',
        lastChecked: new Date(),
      },
    });

    // Save all offers to disk
    await this.saveToDisk();
    this.log(`Saved/updated offer: ${uniqueKey} (Total offers: ${this.offers.size})`);
  }

  public async markOffersAsExpired(): Promise<void> {
    console.info(`[BankRewards] Marking ${this.offers.size} offers as expired`);

    for (const [id, offer] of this.offers) {
      this.offers.set(id, {
        ...offer,
        metadata: {
          ...offer.metadata,
          status: 'expired',
          lastChecked: new Date(),
        },
      });
    }

    this.saveToDisk();
  }

  public async getOffers(): Promise<BankRewardsOffer[]> {
    return Array.from(this.offers.values());
  }

  public async getStats(): Promise<{ total: number; active: number; expired: number }> {
    const offers = Array.from(this.offers.values());
    const active = offers.filter((o) => o.metadata.status === 'active').length;
    const expired = offers.filter((o) => o.metadata.status === 'expired').length;

    return {
      total: offers.length,
      active,
      expired,
    };
  }

  public async deleteAllOffers(): Promise<{ deleted: number }> {
    const count = this.offers.size;
    console.info(`[BankRewards] Deleting ${count} offers`);

    this.offers.clear();
    this.saveToDisk();

    return { deleted: count };
  }

  private log(message: string, error?: unknown) {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[${timestamp}] [BankRewards] ${message}`, error);
    } else {
      console.info(`[${timestamp}] [BankRewards] ${message}`);
    }
  }
}
