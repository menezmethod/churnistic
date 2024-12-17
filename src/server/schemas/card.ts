import { z } from 'zod';

export const cardApplicationSchema = z.object({
  cardId: z.string(),
  creditScore: z.number().optional(),
  income: z.number().optional(),
  notes: z.string().optional(),
});

export const retentionOfferSchema = z.object({
  applicationId: z.string(),
  pointsOffered: z.number().optional(),
  statementCredit: z.number().optional(),
  spendRequired: z.number().optional(),
  notes: z.string().optional(),
}); 