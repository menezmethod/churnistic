// Credit inquiry related utilities

export const calculateCreditScore = (inquiries: number): number => {
  // Simple example calculation
  const baseScore = 850;
  const deductionPerInquiry = 5;
  return Math.max(300, baseScore - inquiries * deductionPerInquiry);
};
