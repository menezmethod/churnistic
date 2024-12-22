import { getAuth } from 'firebase-admin/auth';

import { firebaseAdmin } from './admin-app';

// Only export auth service, we don't need Firestore for session management
export const auth = getAuth(firebaseAdmin);
