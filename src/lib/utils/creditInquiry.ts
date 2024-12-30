/**
 * Determines if a credit inquiry is a soft pull
 * @param inquiryType - The type of credit inquiry
 * @returns True if the inquiry is a soft pull, false otherwise
 */
export const isSoftPull = (inquiryType: string | { monthly?: boolean } | undefined): boolean => {
  if (!inquiryType) return false;
  if (typeof inquiryType === 'object') return !inquiryType.monthly;
  
  const softPullKeywords = [
    'soft',
    'prequalification',
    'pre-qualification',
    'preapproval',
    'pre-approval',
  ];
  return softPullKeywords.some((keyword) => inquiryType.toLowerCase().includes(keyword));
};
