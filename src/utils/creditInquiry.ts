export interface CreditInquiry {
  monthly?: boolean;
}

export function isSoftPull(inquiry: string | CreditInquiry | undefined): boolean {
  if (!inquiry) return false;
  if (typeof inquiry === 'string') {
    return inquiry.toLowerCase().includes('soft');
  }
  return !inquiry.monthly;
}
