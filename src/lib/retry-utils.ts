/**
 * Retry utility for Google Sheets API calls
 * Handles 429 (Quota Exceeded) errors with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 2000, // 2 seconds
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [429, 500, 502, 503, 504], // Quota exceeded, server errors
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableErrors: number[]): boolean {
  if (!error) return false;
  
  // Check HTTP status code
  const status = error.status || error.response?.status || error.code;
  if (status && retryableErrors.includes(status)) {
    return true;
  }
  
  // Check for specific error messages
  const message = error.message || String(error);
  if (message.includes('Quota exceeded') || message.includes('429')) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxRetries || !isRetryableError(error, opts.retryableErrors)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      console.log(
        `⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`,
        error.message || error
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Wrapper for Google Sheets operations with automatic retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(operation, options);
}

