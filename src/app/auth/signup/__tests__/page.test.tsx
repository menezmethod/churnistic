import { render } from '@testing-library/react';

import SignUpPage from '../page';

// Mock the SignUpForm component
jest.mock('../../components/SignUpForm', () => {
  return function MockSignUpForm(): JSX.Element {
    return <div data-testid="mock-sign-up-form">Mock SignUpForm Component</div>;
  };
});

describe('SignUpPage', () => {
  it('renders the SignUpForm component', (): void => {
    const { getByTestId } = render(<SignUpPage />);
    expect(getByTestId('mock-sign-up-form')).toBeInTheDocument();
  });
});
