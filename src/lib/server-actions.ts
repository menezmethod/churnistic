import { ZodSchema } from 'zod';

import { ServerActionResponse } from '../types/server-actions';

/**
 * Wrapper for server actions with built-in error handling
 * @param action The server action function to wrap
 * @returns Wrapped server action with standardized error handling
 */
export function createServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  schema?: ZodSchema<TInput>
) {
  return async (input: TInput): Promise<ServerActionResponse<TOutput>> => {
    try {
      // Validate input if schema is provided
      if (schema) {
        const parsedInput = schema.parse(input);
        const result = await action(parsedInput);
        return { success: true, data: result };
      }

      // Execute action without validation
      const result = await action(input);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          code:
            error instanceof Error && 'code' in error ? String(error.code) : undefined,
        },
      };
    }
  };
}

/**
 * Creates an optimistic update handler for server actions
 * @param updateFn Function to update local state optimistically
 * @param rollbackFn Function to rollback the optimistic update on error
 * @returns Optimistic update handler
 */
export function createOptimisticUpdate<TInput, TOutput>(
  updateFn: (input: TInput) => void,
  rollbackFn: (input: TInput) => void
) {
  return async (input: TInput, action: (input: TInput) => Promise<TOutput>) => {
    try {
      // Apply optimistic update
      updateFn(input);

      // Execute server action
      const result = await action(input);
      return result;
    } catch (error) {
      // Rollback on error
      rollbackFn(input);
      throw error;
    }
  };
}

/**
 * Creates a validation middleware for server actions
 * @param schema Zod schema to validate against
 * @returns Validation middleware function
 */
export function createValidationMiddleware<TInput>(schema: ZodSchema<TInput>) {
  return (input: unknown): TInput => {
    return schema.parse(input);
  };
}
