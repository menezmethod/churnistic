import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View and analyze your customer churn metrics and insights',
  robots: {
    index: false, // Typically dashboard should be private
  },
};
