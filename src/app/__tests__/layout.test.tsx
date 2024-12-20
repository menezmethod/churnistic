import { render } from '@testing-library/react';

import RootLayout from '../layout';

jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-mock',
  }),
}));

describe('RootLayout', () => {
  it('renders children correctly', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    );

    // Check if the html element has the correct lang attribute
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');

    // Check if the body has the correct class
    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-mock');
  });
});
