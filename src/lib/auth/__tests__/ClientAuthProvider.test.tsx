import { render } from '@testing-library/react';
import React from 'react';

import { ClientAuthProvider } from '../ClientAuthProvider';

// Mock the AuthProvider component
jest.mock('../AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-auth-provider">{children}</div>
  ),
}));

describe('ClientAuthProvider', () => {
  it('renders children within AuthProvider', () => {
    const testChild = <div data-testid="test-child">Test Child</div>;
    const { getByTestId } = render(<ClientAuthProvider>{testChild}</ClientAuthProvider>);

    // Verify that both the AuthProvider and child are rendered
    expect(getByTestId('mock-auth-provider')).toBeInTheDocument();
    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByTestId('test-child')).toHaveTextContent('Test Child');
  });
});
