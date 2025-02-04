import { BankRewardsOffer } from '../types/opportunity';

export const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const calculateProcessingRate = (
  stagedCount: number,
  approvedCount: number
): string => {
  const totalToProcess = stagedCount + approvedCount;
  const totalProcessed = approvedCount;

  return totalToProcess > 0 ? ((totalProcessed / totalToProcess) * 100).toFixed(1) : '0';
};

export const getRowClassName = (status: string) => `opportunity-row-${status}`;

export const parseRequirements = (
  description: string = '',
  type: 'bank' | 'credit_card' | 'brokerage',
  details: BankRewardsOffer['details']
) => {
  const requirements = [];

  // Minimum deposit requirement
  if (details?.minimum_deposit) {
    const amount = parseFloat(details.minimum_deposit.replace(/[^0-9.]/g, ''));
    requirements.push({
      type: 'minimum_deposit',
      details: { amount, period: 0 },
      description: `Maintain a minimum deposit of ${formatCurrency(amount)}`,
      title: 'Minimum Deposit Requirement',
    });
  }

  // Spending requirement pattern
  const spendMatch = description.match(
    /spend\s*\$?(\d+[,\d]*)\s*(?:in|within)?\s*(\d+)\s*(month|months|day|days)/i
  );
  if (spendMatch && type === 'credit_card') {
    const amount = parseInt(spendMatch[1].replace(/,/g, ''));
    const period =
      parseInt(spendMatch[2]) *
      (spendMatch[3].toLowerCase().startsWith('month') ? 30 : 1);
    requirements.push({
      type: 'spending',
      details: { amount, period },
      description: `Spend ${formatCurrency(amount)} within ${period} days`,
      title: 'Spending Requirement',
    });
  }

  // Direct deposit pattern
  const ddMatch = description.match(
    /(?:direct )?deposit\s*(?:of)?\s*\$?(\d+[,\d]*(?:\.\d+)?)/i
  );
  if (ddMatch && type === 'bank') {
    const amount = parseFloat(ddMatch[1].replace(/,/g, ''));
    requirements.push({
      type: 'direct_deposit',
      details: { amount, period: 60 },
      description: `Make a direct deposit of ${formatCurrency(amount)}`,
      title: 'Direct Deposit Requirement',
    });
  }

  return requirements;
};
