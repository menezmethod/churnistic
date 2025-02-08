import { connectAuthEmulator, Auth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, Functions } from 'firebase/functions';
import { connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

import { EmulatorError } from '@/lib/errors/firebase';

import { getEmulatorUrl, validateEmulatorConfig } from './config';
import { shouldUseEmulators } from '../utils/environment';

/**
 * Connects Firebase services to their respective emulators
 * @param services Object containing Firebase service instances
 */
export function connectToEmulators(services: {
  auth?: Auth;
  firestore?: Firestore;
  storage?: FirebaseStorage;
  functions?: Functions;
}): void {
  if (!shouldUseEmulators()) {
    return;
  }

  try {
    if (services.auth) {
      connectAuthEmulator(services.auth, getEmulatorUrl('auth'), {
        disableWarnings: true,
      });
    }

    if (services.firestore) {
      const url = new URL(getEmulatorUrl('firestore'));
      connectFirestoreEmulator(services.firestore, url.hostname, parseInt(url.port));
    }

    if (services.storage) {
      const url = new URL(getEmulatorUrl('storage'));
      connectStorageEmulator(services.storage, url.hostname, parseInt(url.port));
    }

    if (services.functions) {
      const url = new URL(getEmulatorUrl('functions'));
      connectFunctionsEmulator(services.functions, url.hostname, parseInt(url.port));
    }
  } catch (error) {
    throw new EmulatorError(
      'emulator/connection-failed',
      'Failed to connect to Firebase emulators',
      error
    );
  }
}

/**
 * Checks if emulators are properly configured and available
 * @returns Promise that resolves when emulators are ready
 */
export async function checkEmulatorAvailability(): Promise<void> {
  if (!shouldUseEmulators()) {
    return;
  }

  try {
    const config = await fetch('/__/firebase/emulators/config.json').then((res) =>
      res.json()
    );
    validateEmulatorConfig(config);
  } catch (error) {
    throw new EmulatorError(
      'emulator/not-available',
      'Firebase emulators are not available',
      error
    );
  }
}
