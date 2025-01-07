import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { type AuthUser } from '@/lib/auth/types';

import HomePage from '../page';

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      email: 'test@example.com',
      displayName: 'Test User',
      customClaims: {
        role: 'user',
      },
    } as AuthUser,
    loading: false,
  }),
}));

describe('HomePage', () => {
  it('renders welcome message', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /welcome to churnistic/i })
      ).toBeInTheDocument();
    });
  });
});
