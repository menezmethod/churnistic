import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import { mkdir, access, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

import { db } from '@/lib/firebase/config';
import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly storagePath: string;
  private readonly offersPath: string;
  private readonly useEmulator: boolean;
  private isStorageReady: boolean = false;

  constructor() {
    this.useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

    // Use system temp directory as base
    const tempBase = process.env.VERCEL ? '/tmp' : tmpdir();
    this.storagePath = path.join(tempBase, 'bankrewards');
    this.offersPath = path.join(this.storagePath, 'offers.json');

    // Initialize storage asynchronously
    this.initializeStorage().catch((error) => {
      console.error('[BankRewards] Failed to initialize storage:', error);
    });
  }

  private async initializeStorage(): Promise<void> {
    try {
      await this.ensureStorageExists();
      await this.loadFromDisk();
      this.isStorageReady = true;
    } catch (error) {
      console.error('[BankRewards] Storage initialization failed:', error);
      this.isStorageReady = false;
      throw error;
    }
  }

  private async ensureStorageExists(): Promise<void> {
    try {
      // Check if directory exists and is writable
      try {
        await access(this.storagePath, fs.constants.W_OK);
      } catch {
        // Directory doesn't exist or isn't writable, try to create it
        await mkdir(this.storagePath, { recursive: true, mode: 0o755 });
        console.info(`[BankRewards] Created storage directory: ${this.storagePath}`);

        // Verify the directory was created and is writable
        await access(this.storagePath, fs.constants.W_OK);
      }

      // Create empty offers file if it doesn't exist
      try {
        await access(this.offersPath, fs.constants.F_OK);
      } catch {
        await writeFile(this.offersPath, '[]', { mode: 0o644 });
        console.info(`[BankRewards] Created empty offers file: ${this.offersPath}`);
      }
    } catch (error) {
      console.error('[BankRewards] Storage setup failed:', error);
      throw new Error(
        `Failed to setup storage: ${error instanceof Error ? error.message : String(error)}`
      );
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

  private async loadFromDisk(): Promise<void> {
    try {
      let rawData: string;
      try {
        rawData = await readFile(this.offersPath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.info(`[BankRewards] No existing offers file at ${this.offersPath}`);
          return;
        }
        throw error;
      }

      if (!rawData.trim()) {
        console.info('[BankRewards] Empty offers file');
        return;
      }

      let data;
      try {
        data = JSON.parse(rawData);
      } catch (error) {
        console.error('[BankRewards] Invalid JSON in offers file:', error);
        const backupPath = `${this.offersPath}.backup.${Date.now()}`;
        await writeFile(backupPath, rawData);
        console.info(`[BankRewards] Backed up corrupted file to ${backupPath}`);
        this.offers.clear();
        return;
      }

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
      console.error('[BankRewards] Error loading offers from disk:', error);
      throw new Error(
        `Failed to load offers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async saveToDisk(): Promise<void> {
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }

    try {
      const data = Array.from(this.offers.values());
      const tempPath = `${this.offersPath}.tmp`;

      // Write to temporary file first
      await writeFile(tempPath, JSON.stringify(data, null, 2), { mode: 0o644 });

      // Verify the write was successful
      const written = await readFile(tempPath, 'utf-8');
      try {
        JSON.parse(written); // Validate JSON
      } catch (error) {
        throw new Error(
          `Failed to write valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Atomic rename
      await fs.promises.rename(tempPath, this.offersPath);
      console.info(`[BankRewards] Saved ${data.length} offers to disk`);
    } catch (error) {
      console.error('[BankRewards] Error saving to disk:', error);
      throw new Error(
        `Failed to save offers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async saveToFirestore(offers: BankRewardsOffer[]): Promise<void> {
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
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }

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

  public async getOffers(): Promise<BankRewardsOffer[]> {
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }
    return [...this.offers.values()];
  }

  public async getStats(): Promise<{ total: number; active: number; expired: number }> {
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }

    const offers = [...this.offers.values()];
    return {
      total: offers.length,
      active: offers.filter((offer) => offer.metadata?.status === 'active').length,
      expired: offers.filter((offer) => offer.metadata?.status === 'expired').length,
    };
  }

  public async deleteAllOffers(): Promise<{ success: boolean; message: string }> {
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }

    try {
      this.offers.clear();
      await this.saveToDisk();
      return { success: true, message: 'All offers deleted successfully' };
    } catch (error) {
      console.error('Error deleting offers:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  public async markOffersAsExpired(): Promise<void> {
    if (!this.isStorageReady) {
      await this.initializeStorage();
    }

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

    await this.saveToDisk();

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
}
