import { render } from '@testing-library/react';

import SignInPage from '../page';

import type { JSX } from "react";

// Mock the SignIn component
jest.mock('../../components/SignIn', () => ({
  SignIn: (): JSX.Element => <div data-testid="mock-sign-in">Mock SignIn Component</div>,
}));

describe('SignInPage', () => {
  it('renders the SignIn component', (): void => {
    const { getByTestId } = render(<SignInPage />);
    expect(getByTestId('mock-sign-in')).toBeInTheDocument();
  });
});
