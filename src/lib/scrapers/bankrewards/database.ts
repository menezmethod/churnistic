import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import { getBankRewardsConfig } from '@/app/api/bankrewards/config';
import { getAdminDb } from '@/lib/firebase/admin-app';
import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly dbPath: string;
  private readonly useEmulator: boolean;
  private storagePath: string;

  constructor() {
    this.useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

    // In Vercel, use /tmp directly. In local dev, use project directory
    if (process.env.VERCEL) {
      this.storagePath = '/tmp/bankrewards';
      this.dbPath = '/tmp/bankrewards/bankrewards.json';
    } else {
      const config = getBankRewardsConfig();
      this.storagePath = path.join(process.cwd(), config.storageDir);
      this.dbPath = path.join(this.storagePath, 'bankrewards.json');
    }

    // Log the paths for debugging
    console.log('[BankRewards] Running in Vercel:', !!process.env.VERCEL);
    console.log('[BankRewards] Storage path:', this.storagePath);
    console.log('[BankRewards] DB path:', this.dbPath);

    this.ensureDirectoryExists();
    this.loadFromDisk();
  }

  private async ensureDirectoryExists() {
    try {
      console.log('[BankRewards] Creating directory:', this.storagePath);
      await fsPromises.mkdir(this.storagePath, {
        recursive: true,
        mode: 0o777, // More permissive mode for Vercel
      });
      console.log('[BankRewards] Directory created successfully');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
        console.log('[BankRewards] Directory already exists:', this.storagePath);
        return;
      }
      console.error('[BankRewards] Failed to create directory:', error);
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
      // Use async file check
      await fsPromises.access(this.dbPath, fs.constants.F_OK);

      const rawData = await fsPromises.readFile(this.dbPath, 'utf-8');
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
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.info(`[BankRewards] No existing database file at ${this.dbPath}`);
        return;
      }
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
    const db = getAdminDb();
    if (!db) throw new Error('Firestore not initialized');

    const batch = db.batch();
    const offersRef = db.collection('bankrewards');

    offers.forEach((offer) => {
      const docRef = offersRef.doc();
      batch.set(docRef, {
        ...offer,
        metadata: {
          ...offer.metadata,
          lastChecked: Timestamp.fromDate(new Date()),
          lastUpdated: Timestamp.fromDate(new Date()),
        },
      });
    });

    await batch.commit();
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
        const db = getAdminDb();
        const offersRef = db.collection('bankrewards');
        const snapshot = await offersRef.get();
        const batch = db.batch();
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
