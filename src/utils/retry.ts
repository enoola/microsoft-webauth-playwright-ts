import * as loggerModule from './logger.js';
const logger = loggerModule.default;

interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    operationName?: string;
    silent?: boolean;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry options
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 500,
        maxDelayMs = 5000,
        backoffMultiplier = 2,
        operationName = 'Operation',
        silent = false
    } = options;

    let lastError: Error | undefined;
    let delayMs = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === maxAttempts) {
                if (!silent) {
                    logger.error(`${operationName} failed after ${maxAttempts} attempts:`, lastError);
                }
                throw lastError;
            }

            if (!silent) {
                logger.warn(`${operationName} failed (attempt ${attempt}/${maxAttempts}): ${lastError.message}`);
                logger.info(`Will wait ${delayMs / 1000} seconds to retry`);
                logger.debug(`  Retrying in ${delayMs}ms...`);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delayMs));

            // Exponential backoff with max cap
            delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
        }
    }

    throw lastError;
}

export { withRetry };
