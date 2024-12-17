/* eslint-disable no-unused-vars */
export enum RequirementType {
  DIRECT_DEPOSIT = 'DIRECT_DEPOSIT',
  MINIMUM_BALANCE = 'MINIMUM_BALANCE',
  DEBIT_TRANSACTIONS = 'DEBIT_TRANSACTIONS',
  BILL_PAY = 'BILL_PAY',
}
/* eslint-enable no-unused-vars */

export interface BonusRequirement {
  id: string;
  bonusId: string;
  type: RequirementType;
  amount: number;
  count?: number;
  deadline: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface DirectDeposit {
  id: string;
  accountId: string;
  amount: number;
  source: string;
  date: Date;
  verified: boolean;
}

export interface DebitTransaction {
  id: string;
  accountId: string;
  amount: number;
  date: Date;
  description?: string;
}

export interface BonusProgress {
  completed: boolean;
  progress: number;
  total: number;
  deadline: Date;
}

// Export a utility function to check requirement type
export const isDirectDeposit = (type: RequirementType): boolean => type === RequirementType.DIRECT_DEPOSIT;
export const isMinimumBalance = (type: RequirementType): boolean => type === RequirementType.MINIMUM_BALANCE;
export const isDebitTransactions = (type: RequirementType): boolean => type === RequirementType.DEBIT_TRANSACTIONS;
export const isBillPay = (type: RequirementType): boolean => type === RequirementType.BILL_PAY; 