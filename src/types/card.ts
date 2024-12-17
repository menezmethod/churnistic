/* eslint-disable no-unused-vars */
export enum CardStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED',
}
/* eslint-enable no-unused-vars */

export interface Card {
  id: string;
  issuer: string;
  name: string;
  type: string;
  network: string;
  rewardType: string;
  signupBonus: number;
  minSpend: number;
  minSpendPeriod: number;
  annualFee: number;
  isActive: boolean;
  creditScoreMin?: number;
  businessCard: boolean;
  velocityRules: string[];
  churningRules: string[];
  referralBonus?: number;
  referralBonusCash?: number;
}

export interface CardApplication {
  id: string;
  userId: string;
  cardId: string;
  status: CardStatus;
  appliedAt: Date;
  approvedAt?: Date;
  bonusEarnedAt?: Date;
  closedAt?: Date;
  creditPullId?: string;
  annualFeePaid: boolean;
  annualFeeDue?: Date;
  spendProgress: number;
  spendDeadline?: Date;
  notes?: string;
}

export interface RetentionOffer {
  id: string;
  cardId: string;
  applicationId: string;
  offerDate: Date;
  pointsOffered?: number;
  statementCredit?: number;
  spendRequired?: number;
  accepted?: boolean;
  notes?: string;
}

export interface IssuerRule {
  id: string;
  cardId: string;
  ruleType: string;
  description: string;
  cooldownPeriod: number;
  maxCards?: number;
  isActive: boolean;
}

export interface RuleViolation {
  rule: string;
  message: string;
}

export interface EligibilityCheck {
  eligible: boolean;
  violations: RuleViolation[];
}

// Export utility functions to check card status
export const isPending = (status: CardStatus): boolean => status === CardStatus.PENDING;
export const isApproved = (status: CardStatus): boolean => status === CardStatus.APPROVED;
export const isDenied = (status: CardStatus): boolean => status === CardStatus.DENIED;
export const isCancelled = (status: CardStatus): boolean => status === CardStatus.CANCELLED;
