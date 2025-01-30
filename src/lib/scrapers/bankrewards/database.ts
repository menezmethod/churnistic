import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { join } from 'path';

import { db } from '@/lib/firebase/config';
import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly dbPath: string;
  private readonly dataDir: string;
  private readonly useEmulator: boolean;
  private storagePath: string;
  private offersPath: string;

  constructor() {
    this.useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbPath = path.join(this.dataDir, 'bankrewards.json');
    this.storagePath =
      process.env.NODE_ENV === 'production' ? '/tmp/bankrewards' : './data/bankrewards';
    this.offersPath = join(this.storagePath, 'offers.json');
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

  private async loadFromDisk() {
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
        data.forEach((offer) => {
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
        const backupPath = `${this.dbPath}.backup.${Date.now()}`;
        fs.copyFileSync(this.dbPath, backupPath);
        console.info(`[BankRewards] Backed up corrupted database to ${backupPath}`);
        this.offers.clear();
      } else {
        console.error('[BankRewards] Error loading database from disk:', error);
      }
    }
  }

  private async saveToDisk() {
    try {
      const data = Array.from(this.offers.values());
      const tempPath = `${this.dbPath}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2));
      await fs.promises.rename(tempPath, this.dbPath);
      console.info(`[BankRewards] Saved ${data.length} offers to disk`);
    } catch (error) {
      console.error('[BankRewards] Error saving to disk:', error);
      throw error; // Propagate error since disk storage is our fallback
    }
  }

  private async saveToFirestore(offers: BankRewardsOffer[]) {
    if (this.useEmulator) {
      console.info('[BankRewards] In emulator mode, skipping Firestore save');
      return;
    }

    try {
      const offersRef = collection(db, 'bankrewards');
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < offers.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchOffers = offers.slice(i, i + batchSize);

        for (const offer of batchOffers) {
          const docRef = doc(offersRef);
          batch.set(docRef, {
            ...offer,
            metadata: {
              ...offer.metadata,
              lastChecked: Timestamp.fromDate(new Date()),
              lastUpdated: Timestamp.fromDate(new Date()),
            },
          });
        }

        batches.push(batch);
      }

      console.info(`[BankRewards] Committing ${batches.length} batches to Firestore`);
      await Promise.all(batches.map((batch) => batch.commit()));
      console.info(
        `[BankRewards] Successfully saved ${offers.length} offers to Firestore`
      );
    } catch (error) {
      console.error('[BankRewards] Error saving to Firestore:', error);
      throw error;
    }
  }

  public async saveOffer(offer: BankRewardsOffer): Promise<void> {
    if (!this.validateOffer(offer)) {
      throw new Error('Invalid offer data');
    }

    const uniqueKey = `${offer.id}-${offer.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    this.offers.set(uniqueKey, {
      ...offer,
      metadata: {
        ...offer.metadata,
        status: 'active',
        lastChecked: new Date(),
      },
    });

    // Always save to disk first
    await this.saveToDisk();

    // Only try Firestore in production
    if (!this.useEmulator) {
      try {
        await this.saveToFirestore([...this.offers.values()]);
      } catch (error) {
        console.error(
          '[BankRewards] Firestore save failed, but disk save succeeded:',
          error
        );
      }
    }
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

    // Always save to disk first
    await this.saveToDisk();

    // Only try Firestore in production
    if (!this.useEmulator) {
      try {
        await this.saveToFirestore([...this.offers.values()]);
      } catch (error) {
        console.error(
          '[BankRewards] Firestore save failed, but disk save succeeded:',
          error
        );
      }
    }
  }

  public async getOffers(): Promise<BankRewardsOffer[]> {
    try {
      await this.ensureStorageExists();

      try {
        const data = await readFile(this.offersPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          // If file doesn't exist, return empty array
          return [];
        }
        throw error;
      }
    } catch (error) {
      console.error('Error reading offers:', error);
      return [];
    }
  }

  public async getStats(): Promise<{ total: number; active: number; expired: number }> {
    const offers = await this.getOffers();
    return {
      total: offers.length,
      active: offers.filter((offer) => offer.metadata?.status === 'active').length,
      expired: offers.filter((offer) => offer.metadata?.status === 'expired').length,
    };
  }

  public async deleteAllOffers(): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureStorageExists();
      await writeFile(this.offersPath, JSON.stringify([], null, 2));
      return { success: true, message: 'All offers deleted successfully' };
    } catch (error) {
      console.error('Error deleting offers:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async ensureStorageExists() {
    try {
      await mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        console.error('Error creating storage directory:', error);
        throw error;
      }
    }
  }
}
