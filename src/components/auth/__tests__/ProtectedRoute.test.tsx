import { render, screen } from '@testing-library/react';

import { UserRole } from '@/lib/auth/types';

import { ProtectedRoute } from '../ProtectedRoute';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'test@example.com',
      role: UserRole.ADMIN,
    },
    loading: false,
    hasRole: (role: string) => role === UserRole.ADMIN,
    hasPermission: () => true,
  }),
}));

describe('ProtectedRoute', () => {
  it('renders children when authorized', () => {
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
