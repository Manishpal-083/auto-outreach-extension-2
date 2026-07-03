// modules/successDetector.js

export class SuccessDetector {
  /**
   * Monitors the page context (DOM, URL, modals, toasts) to verify submission success or failure.
   * @param {string} initialUrl - The URL of the page before submission was clicked.
   * @param {number} timeoutMs - Max verification timeframe in milliseconds.
   * @returns {Promise<Object>} Resolves with { success: boolean, reason: string }
   */
  static verifySubmission(initialUrl, timeoutMs = 10000) {
    const successKeywords = [
      "thank you", "message sent", "success", "we'll contact you",
      "appointment scheduled", "booked", "request received", "lead created",
      "thanks for contacting", "form submitted", "booking confirmed", "meeting scheduled"
    ];

    const failureKeywords = [
      "error", "failed", "invalid", "required", "try again",
      "correct the errors", "unable to submit", "something went wrong"
    ];

    return new Promise((resolve) => {
      let isSettled = false;
      const startTime = Date.now();

      const settle = (success, reason) => {
        if (isSettled) return;
        isSettled = true;
        clearInterval(pollInterval);
        if (observer) observer.disconnect();
        resolve({ success, reason });
      };

      const checkState = () => {
        // 1. Check URL Changes (Redirect to confirmation paths)
        const currentUrl = window.location.href;
        if (currentUrl !== initialUrl) {
          const lowerUrl = currentUrl.toLowerCase();
          if (lowerUrl.includes('success') || lowerUrl.includes('thank') || lowerUrl.includes('confirm') || lowerUrl.includes('done')) {
            settle(true, `URL changed to confirmation landing page: ${currentUrl}`);
            return;
          }
        }

        // 2. Scan Toast Notifications, Modals & Alert containers
        const overlayContainers = Array.from(document.querySelectorAll(
          '.toast, .notification, .alert, .modal, [role="dialog"], [role="alert"], .alert-success, .success-message'
        ));

        for (const container of overlayContainers) {
          const text = (container.innerText || container.textContent || '').toLowerCase();
          for (const kw of successKeywords) {
            if (text.includes(kw)) {
              settle(true, `Success signal "${kw}" found inside modal/toast container.`);
              return;
            }
          }
          for (const kw of failureKeywords) {
            if (text.includes(kw)) {
              settle(false, `Failure warning "${kw}" detected in alert overlay.`);
              return;
            }
          }
        }

        // 3. Scan DOM Text Mutations
        const bodyText = (document.body ? document.body.innerText : '').toLowerCase();
        for (const kw of successKeywords) {
          if (bodyText.includes(kw)) {
            settle(true, `Success keyword "${kw}" detected in page body.`);
            return;
          }
        }

        // 4. Scan Input Field Validation Errors
        const errorLabels = Array.from(document.querySelectorAll(
          '.error-message, .validation-error, [aria-invalid="true"], .is-invalid'
        ));
        for (const err of errorLabels) {
          if (err.offsetParent !== null && (err.innerText || '').trim().length > 0) {
            settle(false, `Validation error flag active: "${err.innerText.trim()}"`);
            return;
          }
        }
      };

      // Setup MutationObserver to scan immediately on DOM structural changes
      let observer = null;
      if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
          checkState();
        });
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }

      // Setup Polling Interval for fallbacks
      const pollInterval = setInterval(() => {
        checkState();

        if (Date.now() - startTime >= timeoutMs) {
          settle(false, "Timeout waiting for submission confirmation signals.");
        }
      }, 500);

      // Perform initial check
      checkState();
    });
  }
}
