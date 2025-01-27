import { collection, doc, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

import { db } from '@/lib/firebase/config';
import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly dbPath: string;
  private readonly dataDir: string;
  private readonly useEmulator: boolean;

  constructor() {
    this.useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
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
    await this.saveToDisk();

    if (!this.useEmulator) {
      try {
        const offersRef = collection(db, 'bankrewards');
        const snapshot = await getDocs(offersRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (error) {
        console.error(
          '[BankRewards] Firestore delete failed, but disk delete succeeded:',
          error
        );
      }
    }

    return { deleted: count };
  }
}
