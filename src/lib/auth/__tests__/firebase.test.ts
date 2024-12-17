import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

describe('Firebase Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Firebase when no app exists', () => {
    (getApps as jest.Mock).mockReturnValue([]);
    (initializeApp as jest.Mock).mockReturnValue('new-app');
    (getAuth as jest.Mock).mockReturnValue('auth-instance');

    // Import firebase.ts to trigger initialization
    require('../firebase');

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    expect(getAuth).toHaveBeenCalledWith('new-app');
  });

  it('reuses existing Firebase app', () => {
    const existingApp = 'existing-app';
    (getApps as jest.Mock).mockReturnValue([existingApp]);
    (getAuth as jest.Mock).mockReturnValue('auth-instance');

    jest.isolateModules(() => {
      require('../firebase');
    });

    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).toHaveBeenCalledWith(existingApp);
  });
}); 