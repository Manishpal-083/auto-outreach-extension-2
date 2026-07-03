// modules/retryEngine.js

export class RetryEngine {
  /**
   * Executes an asynchronous action function with automatic retries and exponential backoff.
   * @param {Function} actionFn - The async function containing the operation.
   * @param {string} actionName - A label describing the operation for logs.
   * @param {Object} options - Configuration overrides for retrying.
   * @returns {Promise<any>} The result of the successful operation.
   */
  static async execute(actionFn, actionName = 'Operation', options = {}) {
    const maxRetries = options.maxRetries ?? 5;
    let interval = options.initialInterval ?? 500; // 500ms initial interval
    const factor = options.factor ?? 2; // Exponential multiplier

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RetryEngine] Attempting "${actionName}" (Attempt ${attempt}/${maxRetries})...`);
        const result = await actionFn();
        console.log(`[RetryEngine] "${actionName}" succeeded on attempt ${attempt}.`);
        return result; // Recovered successfully: continue execution pipeline
      } catch (error) {
        console.warn(`[RetryEngine] Attempt ${attempt}/${maxRetries} for "${actionName}" failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          console.error(`[RetryEngine] All ${maxRetries} retries for "${actionName}" have failed.`);
          throw error; // Propagate final error to trigger pipeline failure states
        }

        console.log(`[RetryEngine] Waiting ${interval}ms (Exponential backoff) before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, interval));
        interval *= factor; // Apply exponential backoff
      }
    }
  }
}
