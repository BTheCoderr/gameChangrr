const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export class RetryError extends Error {
  constructor(message, attempts, lastError) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async (operation, config = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempts = 0;
  let delay = retryConfig.initialDelay;

  while (attempts < retryConfig.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempts++;

      // Check if we should retry based on error status
      const shouldRetry = error.response?.status 
        ? retryConfig.retryableStatuses.includes(error.response.status)
        : true;

      if (!shouldRetry || attempts >= retryConfig.maxRetries) {
        throw new RetryError(
          `Operation failed after ${attempts} attempts`,
          attempts,
          error
        );
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(
        delay * retryConfig.backoffFactor,
        retryConfig.maxDelay
      );

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 200 - 100;
      await sleep(delay + jitter);
    }
  }
}; 