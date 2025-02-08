import { Auth, onAuthStateChanged } from 'firebase/auth';
import { Firestore, onSnapshotsInSync } from 'firebase/firestore';

import { FirebaseServices } from '@/types/firebase';

export type ConnectionStatus = {
  isConnected: boolean;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  services: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
    functions: boolean;
  };
};

type ConnectionStatusListener = (status: ConnectionStatus) => void;

let currentStatus: ConnectionStatus = {
  isConnected: false,
  services: {
    auth: false,
    firestore: false,
    storage: false,
    functions: false,
  },
};

const listeners: Set<ConnectionStatusListener> = new Set();

/**
 * Updates the connection status and notifies listeners
 * @param updates Partial updates to the connection status
 */
function updateStatus(updates: Partial<ConnectionStatus>) {
  currentStatus = {
    ...currentStatus,
    ...updates,
    services: {
      ...currentStatus.services,
      ...(updates.services || {}),
    },
  };

  // Update timestamps
  if (currentStatus.isConnected && !updates.lastConnectedAt) {
    currentStatus.lastConnectedAt = new Date();
  } else if (!currentStatus.isConnected && !updates.lastDisconnectedAt) {
    currentStatus.lastDisconnectedAt = new Date();
  }

  // Notify listeners
  listeners.forEach((listener) => listener(currentStatus));
}

/**
 * Monitors Firestore connection status
 * @param firestore Firestore instance
 */
function monitorFirestore(firestore: Firestore) {
  // Set up snapshot sync listener for the provided Firestore instance
  const unsubscribe = onSnapshotsInSync(firestore, () => {
    updateStatus({
      services: {
        ...currentStatus.services,
        firestore: true,
      },
      isConnected: true,
    });
  });

  // Monitor offline status
  const handleOffline = () => {
    updateStatus({
      services: {
        ...currentStatus.services,
        firestore: false,
      },
      isConnected: false,
    });
  };

  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    unsubscribe();
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Monitors Auth connection status
 * @param auth Auth instance
 */
function monitorAuth(auth: Auth) {
  return onAuthStateChanged(
    auth,
    () => {
      updateStatus({
        services: {
          ...currentStatus.services,
          auth: true,
        },
      });
    },
    () => {
      updateStatus({
        services: {
          ...currentStatus.services,
          auth: false,
        },
      });
    }
  );
}

let cleanupFunctions: (() => void)[] = [];

/**
 * Starts monitoring connection status for all Firebase services
 * @param services Firebase services to monitor
 * @returns Cleanup function to stop monitoring
 */
export async function startConnectionMonitoring(services: FirebaseServices) {
  // Clean up any existing monitors
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];

  // Monitor Firestore
  if (services.firestore) {
    cleanupFunctions.push(monitorFirestore(services.firestore));
  }

  // Monitor Auth
  if (services.auth) {
    cleanupFunctions.push(monitorAuth(services.auth));
  }

  // Monitor general online/offline status
  const handleOnline = () => {
    updateStatus({ isConnected: true });
  };

  const handleOffline = () => {
    updateStatus({ isConnected: false });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  cleanupFunctions.push(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];
  };
}

/**
 * Subscribes to connection status updates
 * @param listener Function to call when connection status changes
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToConnectionStatus(
  listener: ConnectionStatusListener
): () => void {
  listeners.add(listener);
  // Call immediately with current status
  listener(currentStatus);
  return () => listeners.delete(listener);
}

/**
 * Gets the current connection status
 * @returns Current connection status
 */
export function getCurrentConnectionStatus(): ConnectionStatus {
  return { ...currentStatus };
}
