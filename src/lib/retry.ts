/**
 * Exponential backoff retry utility
 * Retries failed operations with increasing delays
 */

export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    shouldRetry: (error: Error) => {
        // Retry on network errors and 5xx server errors
        // Don't retry on 4xx client errors
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
        );
    },
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry if this is the last attempt
            if (attempt === opts.maxAttempts) {
                break;
            }

            // Check if we should retry this error
            if (!opts.shouldRetry(lastError)) {
                throw lastError;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                opts.initialDelay * Math.pow(2, attempt - 1),
                opts.maxDelay
            );

            console.warn(
                `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${delay}ms...`,
                lastError.message
            );

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All attempts failed
    console.error(`[Retry] All ${opts.maxAttempts} attempts failed.`, lastError);
    throw lastError;
}

/**
 * Wrap a fetch call with retry logic
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withRetry(async () => {
        const response = await fetch(url, init);

        // Throw on HTTP errors to trigger retry
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    }, retryOptions);
}
