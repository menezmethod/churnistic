// Risk assessment utilities

export const calculateRiskScore = (factors: number[]): number => {
  return factors.reduce((acc, factor) => acc + factor, 0) / factors.length;
};
