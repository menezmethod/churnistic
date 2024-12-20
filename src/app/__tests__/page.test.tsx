import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { AuthUser } from '@/types/auth';

import HomePage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: (): { push: (path: string) => void } => ({
    push: jest.fn(),
  }),
}));

// Mock auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: (): { user: AuthUser | null; loading: boolean } => ({
    user: null,
    loading: false,
  }),
}));

describe('HomePage', () => {
  it('renders the home page', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: /welcome to churnistic/i })
    ).toBeInTheDocument();
  });
});
