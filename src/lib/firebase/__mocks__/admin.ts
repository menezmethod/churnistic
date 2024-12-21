import { jest } from '@jest/globals';

export const mockFirebaseAdminConfig = {
  projectId: 'test-project',
  clientEmail: 'test@test-project.iam.gserviceaccount.com',
  privateKey:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9QFxMkfXEsqm5\n-----END PRIVATE KEY-----\n',
};

process.env.FIREBASE_PROJECT_ID = mockFirebaseAdminConfig.projectId;
process.env.FIREBASE_CLIENT_EMAIL = mockFirebaseAdminConfig.clientEmail;
process.env.FIREBASE_PRIVATE_KEY = mockFirebaseAdminConfig.privateKey;

export const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  createCustomToken: jest.fn(),
};

export const mockApp = {
  auth: (): typeof mockAuth => mockAuth,
};

export const initAdmin = jest.fn();

export const admin = {
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
    setCustomUserClaims: jest.fn(),
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(),
  })),
};

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => mockApp),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
}));

export { mockApp as app, mockAuth as auth };
