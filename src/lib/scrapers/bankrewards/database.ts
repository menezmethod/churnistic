import { Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getAdminApp, getAdminDb } from '@/lib/firebase/admin-app';
import { BankRewardsOffer } from '@/types/scraper';

export class BankRewardsDatabase {
  private offers: Map<string, BankRewardsOffer> = new Map();
  private readonly useEmulator: boolean;
  private readonly storagePath: string;
  private readonly storage: ReturnType<typeof getStorage>;
  private readonly bucketName: string;

  constructor() {
    try {
      this.useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
      this.storagePath = 'bankrewards/bankrewards.json';

      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic';
      this.bucketName = `${projectId}.appspot.com`;

      const app = getAdminApp();
      if (!app) throw new Error('Failed to initialize Firebase Admin App');

      this.storage = getStorage(app);
      console.log(
        `[BankRewards] Initialized storage (${this.getEnvironment()}) with bucket: ${this.bucketName}`
      );

      this.initializeStorage().catch((error) => {
        console.error('[BankRewards] Failed to initialize storage:', error);
      });
    } catch (error) {
      console.error('[BankRewards] Error in constructor:', error);
      throw error;
    }
  }

  private getEnvironment(): string {
    if (this.useEmulator) return 'emulator';
    if (process.env.NODE_ENV === 'development') return 'local-development';
    return process.env.VERCEL_ENV || 'production';
  }

  private async initializeStorage() {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.storagePath);

      const [exists] = await file.exists();
      if (!exists) {
        console.info('[BankRewards] Creating initial storage structure');
        await file.save(JSON.stringify([]), {
          contentType: 'application/json',
          metadata: {
            created: new Date().toISOString(),
            environment: this.getEnvironment(),
            emulator: this.useEmulator,
          },
        });
      }

      await this.loadFromStorage();
    } catch (error) {
      console.error('[BankRewards] Error initializing storage:', error);
      throw error;
    }
  }

  private async loadFromStorage() {
    try {
      console.log(
        `[BankRewards] Loading from ${this.useEmulator ? 'emulator' : 'production'} storage`
      );
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.storagePath);

      const exists = await file.exists();
      if (!exists[0]) {
        console.info('[BankRewards] No existing database file in storage');
        return;
      }

      const [content] = await file.download({
        validation: !this.useEmulator,
      });
      const data = JSON.parse(content.toString());
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

      console.info(`[BankRewards] Loaded ${loadedCount} valid offers from storage`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('[BankRewards] Invalid JSON in storage file:', error);
        await this.createBackup();
        this.offers.clear();
      } else {
        console.error('[BankRewards] Error loading from storage:', error);
      }
    }
  }

  private async saveToStorage() {
    try {
      console.log(
        `[BankRewards] Saving to ${this.useEmulator ? 'emulator' : 'production'} storage`
      );
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.storagePath);

      const data = Array.from(this.offers.values());
      await file.save(JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        metadata: {
          updated: new Date().toISOString(),
          environment: this.getEnvironment(),
        },
      });

      console.info(`[BankRewards] Saved ${data.length} offers to storage`);
    } catch (error) {
      console.error('[BankRewards] Error saving to storage:', error);
      throw error;
    }
  }

  private async createBackup() {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const sourceFile = bucket.file(this.storagePath);
      const backupPath = `${this.storagePath}.backup.${Date.now()}`;
      const backupFile = bucket.file(backupPath);

      await sourceFile.copy(backupFile);
      console.info(`[BankRewards] Created backup at ${backupPath}`);
    } catch (error) {
      console.error('[BankRewards] Failed to create backup:', error);
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

    await this.saveToStorage();

    try {
      await this.saveToFirestore([...this.offers.values()]);
    } catch (error) {
      console.error(
        '[BankRewards] Firestore save failed, but storage save succeeded:',
        error
      );
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

    await this.saveToStorage();

    try {
      await this.saveToFirestore([...this.offers.values()]);
    } catch (error) {
      console.error(
        '[BankRewards] Firestore save failed, but storage save succeeded:',
        error
      );
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

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.storagePath);
      await file.delete();

      const db = getAdminDb();
      const offersRef = db.collection('bankrewards');
      const snapshot = await offersRef.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error('[BankRewards] Error deleting offers:', error);
      throw error;
    }

    return { deleted: count };
  }
}
