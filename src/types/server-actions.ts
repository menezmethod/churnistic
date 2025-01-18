/**
 * Standard response type for server actions
 */
export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ServerActionError };

/**
 * Standard error type for server actions
 */
export type ServerActionError = {
  message: string;
  code?: string;
  validationErrors?: ValidationError[];
};

/**
 * Validation error type for form validation
 */
export type ValidationError = {
  path: string[];
  message: string;
};

/**
 * Type for optimistic update handlers
 */
export type OptimisticUpdateHandler<TInput, TOutput> = (
  input: TInput,
  action: (input: TInput) => Promise<TOutput>
) => Promise<TOutput>;

// Export all types from this module
export * from './server-actions';
