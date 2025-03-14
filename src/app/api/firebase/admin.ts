import { getAdminDb } from '@/lib/firebase/admin';

console.log('Firebase Admin importing shared instance...');

// Use the shared Firebase Admin instance
export const db = getAdminDb();

// No need for separate initialization or emulator settings
// as they are handled in the shared admin module
