import { Opportunity } from '../types/opportunity';

export interface ReviewRule {
  id: string;
  name: string;
  description: string;
  check: (opportunity: Opportunity) => boolean;
  getMessage: (opportunity: Opportunity) => string;
}

export const reviewRules: ReviewRule[] = [
  {
    id: 'expired-offer',
    name: 'Expired Offer',
    description: 'Checks if an offer has expired',
    check: (opportunity: Opportunity) => {
      const expiryDate = opportunity.details?.expiration;
      if (!expiryDate) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only return true if the date is in the past (negative difference)
      return diffDays < 0;
    },
    getMessage: (opportunity: Opportunity) => {
      const expiryDate = opportunity.details?.expiration;
      if (!expiryDate) return '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only return message if date is in the past
      if (diffDays < 0) {
        return `Offer expired ${Math.abs(diffDays)} days ago - needs removal or update`;
      }
      return '';
    },
  },
];

export const checkOpportunityForReview = (
  opportunity: Opportunity
): {
  needsReview: boolean;
  message: string;
} => {
  for (const rule of reviewRules) {
    if (rule.check(opportunity)) {
      return {
        needsReview: true,
        message: rule.getMessage(opportunity),
      };
    }
  }

  return {
    needsReview: false,
    message: '',
  };
};
