import { EmulatorError } from '@/lib/errors/firebase';
import { EmulatorConfig } from '@/types/firebase';

/**
 * Emulator configuration
 */
export const EMULATOR_CONFIG = {
  host: '127.0.0.1',
  ports: {
    auth: 9099,
    firestore: 8080,
    storage: 9199,
    functions: 5001,
  },
} as const;

/**
 * Gets the emulator configuration
 * @returns Emulator configuration
 */
export function getEmulatorConfig() {
  return EMULATOR_CONFIG;
}

/**
 * Gets the emulator host URL for a service
 * @param service Service name
 * @returns Host URL for the service
 */
export function getEmulatorUrl(service: keyof (typeof EMULATOR_CONFIG)['ports']): string {
  const { host, ports } = EMULATOR_CONFIG;
  return `http://${host}:${ports[service]}`;
}

/**
 * Validates the emulator configuration
 * @param config EmulatorConfig to validate
 * @throws EmulatorError if configuration is invalid
 */
export function validateEmulatorConfig(config: EmulatorConfig): void {
  const { host, ports } = config;

  if (!host) {
    throw new EmulatorError('emulator/invalid-host', 'Emulator host is required');
  }

  Object.entries(ports).forEach(([service, port]) => {
    if (!port || port < 0 || port > 65535) {
      throw new EmulatorError(
        'emulator/invalid-port',
        `Invalid port for ${service} emulator: ${port}`
      );
    }
  });
}
