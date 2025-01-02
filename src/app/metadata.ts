import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Churnistic',
    default: 'Churnistic - Customer Churn Analytics',
  },
  description: 'Advanced analytics platform for tracking and preventing customer churn',
  keywords: [
    'churn analytics',
    'customer retention',
    'business analytics',
    'customer insights',
  ],
  authors: [{ name: 'Churnistic Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Churnistic',
    title: 'Churnistic - Customer Churn Analytics',
    description: 'Advanced analytics platform for tracking and preventing customer churn',
  },
};
