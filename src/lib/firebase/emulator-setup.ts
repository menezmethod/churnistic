export function setupEmulators() {
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  console.log('Emulator setup - Environment:', {
    useEmulator,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });

  if (useEmulator) {
    console.log('Setting up Firebase emulators');
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
  }
}

// Call setupEmulators immediately to ensure environment variables are set
// before any Firebase initialization
setupEmulators();
