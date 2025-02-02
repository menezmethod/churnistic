import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import OpportunityPage from './page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for testing
      gcTime: 0, // Disable cache for testing
    },
  },
});

describe('OpportunityPage', () => {
  it('should show loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OpportunityPage />
      </QueryClientProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state when query fails', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OpportunityPage />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('should display opportunity details when loaded', async () => {
    // Mock API response
    queryClient.setQueryData(['opportunity', 'test-id'], {
      id: 'test-id',
      name: 'Test Opportunity',
      // ... other fields
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OpportunityPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Test Opportunity')).toBeInTheDocument();
  });
});
