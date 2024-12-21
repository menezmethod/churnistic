import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

import { withAuth } from '../withAuth';

// Mock the useAuth hook
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('withAuth HOC', () => {
  const mockPush = jest.fn();
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  // Test component
  const TestComponent = () => <div>Protected Content</div>;
  const WrappedComponent = withAuth(TestComponent);

  it('renders the wrapped component', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      hasRole: () => true,
      hasPermission: () => true,
    });

    render(<WrappedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('passes props to the wrapped component', () => {
    const TestComponentWithProps = ({ message }: { message: string }) => (
      <div>{message}</div>
    );
    const WrappedComponentWithProps = withAuth(TestComponentWithProps);

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      hasRole: () => true,
      hasPermission: () => true,
    });

    render(<WrappedComponentWithProps message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
