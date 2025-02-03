import { FirestoreError } from 'firebase/firestore';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 10000; // 10 seconds

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Implements exponential backoff delay
 * @param attempt Current attempt number
 * @param initialDelay Initial delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Delay time in milliseconds
 */
function getExponentialDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 100;
}

/**
 * Default retry condition for Firebase operations
 * @param error Error to check
 * @returns Whether the operation should be retried
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof FirestoreError) {
    // Retry on network errors and server errors
    return [
      'network-request-failed',
      'unavailable',
      'internal',
      'resource-exhausted',
    ].includes(error.code);
  }
  return false;
}

/**
 * Retries an async operation with exponential backoff
 * @param operation Async operation to retry
 * @param options Retry options
 * @returns Promise that resolves with the operation result
 * @throws Last error encountered if all retries fail
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelay = DEFAULT_INITIAL_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = getExponentialDelay(attempt, initialDelay, maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError;
}

/**
 * Creates a retryable version of an async function
 * @param fn Function to make retryable
 * @param options Retry options
 * @returns Retryable version of the function
 */
export function makeRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retryOperation(() => fn(...args), options);
}
