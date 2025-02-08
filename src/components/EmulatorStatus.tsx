'use client';

import { useEffect, useState } from 'react';

import { getFirebaseServices } from '@/lib/firebase/config';
import { getEmulatorConfig } from '@/lib/firebase/emulator/config';
import {
  ConnectionStatus,
  subscribeToConnectionStatus,
} from '@/lib/firebase/utils/connection';
import { shouldUseEmulators } from '@/lib/firebase/utils/environment';

export function EmulatorStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    async function initializeEmulatorStatus() {
      // Only show in development and when emulators are enabled
      if (!shouldUseEmulators()) {
        return;
      }

      try {
        setIsVisible(true);
        await getFirebaseServices();
        const unsubscribe = subscribeToConnectionStatus(setConnectionStatus);
        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize emulator status:', error);
        setIsVisible(false);
      }
    }

    void initializeEmulatorStatus();
  }, []);

  if (!isVisible || !connectionStatus) {
    return null;
  }

  const config = getEmulatorConfig();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Firebase Emulators</h3>
        <span
          className={`h-2 w-2 rounded-full ${
            connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </div>

      <div className="space-y-2 text-sm">
        {Object.entries(connectionStatus.services).map(([service, isConnected]) => (
          <div key={service} className="flex items-center justify-between">
            <span className="capitalize">{service}</span>
            <div className="flex items-center space-x-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-300">
                {config.host}:{config.ports[service as keyof typeof config.ports]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {connectionStatus.lastConnectedAt && (
        <div className="mt-2 text-xs text-gray-400">
          Last connected: {connectionStatus.lastConnectedAt.toLocaleTimeString()}
        </div>
      )}

      {connectionStatus.lastDisconnectedAt && !connectionStatus.isConnected && (
        <div className="mt-1 text-xs text-gray-400">
          Last disconnected: {connectionStatus.lastDisconnectedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
