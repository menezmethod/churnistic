import { render, screen, waitFor } from '@testing-library/react';

import { useAuth } from '@/lib/auth/AuthContext';

import DashboardPage from '../page';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({
      email: 'test@example.com',
      getIdToken: () => Promise.resolve('test-token'),
    });
    return () => {};
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  enableIndexedDbPersistence: jest.fn().mockResolvedValue(undefined),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      displayName: 'Test User',
      customDisplayName: 'Churner',
      email: 'test@example.com',
    }),
  }),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
}));

// Mock auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
    });
  });

  it('renders welcome message', async () => {
    render(<DashboardPage />);
    await waitFor(async () => {
      expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  it('renders summary cards', async () => {
    render(<DashboardPage />);
    await waitFor(async () => {
      expect(await screen.findByText('Active Cards')).toBeInTheDocument();
      expect(await screen.findByText('Bank Bonuses')).toBeInTheDocument();
      expect(await screen.findByText('Next Deadline')).toBeInTheDocument();
      expect(await screen.findByText('Total Value')).toBeInTheDocument();
    });
  });

  it('renders recent applications section', async () => {
    render(<DashboardPage />);
    await waitFor(async () => {
      expect(await screen.findByText('Recent Card Applications')).toBeInTheDocument();
    });
  });

  it('renders settings button', async () => {
    render(<DashboardPage />);
    await waitFor(async () => {
      expect(await screen.findByText('Settings')).toBeInTheDocument();
    });
  });
});
