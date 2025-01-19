import { z } from 'zod';

// Input types for procedures
export const userInputs = {
  getById: z.object({ id: z.string() }),
  update: z.object({
    id: z.string(),
    displayName: z.string().optional(),
    email: z.string().email().optional(),
  }),
  delete: z.object({ id: z.string() }),
  list: z
    .object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      search: z.string().optional(),
    })
    .optional(),
} as const;

// Type-only exports
export type UserRouter = {
  me: Record<string, never>;
  getById: typeof userInputs.getById;
  update: typeof userInputs.update;
  delete: typeof userInputs.delete;
  list: typeof userInputs.list;
};
