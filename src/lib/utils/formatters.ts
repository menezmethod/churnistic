// Utility functions for formatting data

/**
 * Formats a number as currency in USD format
 * @param value - The number to format
 * @returns A string representing the value in USD format
 */
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericValue);
};
