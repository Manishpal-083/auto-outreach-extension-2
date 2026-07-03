// modules/captchaSolver.js

/**
 * Multi-Vendor Anti-CAPTCHA Rest API Connector
 */
export class CaptchaSolver {
  /**
   * Submits a CAPTCHA tracking request to 2Captcha API servers
   */
  static async submitCaptchaTask(apiKey, siteKey, pageUrl) {
    if (!apiKey || !siteKey) throw new Error("Captcha initialization parameters missing.");

    const endpoint = `https://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`;
    
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.status !== 1) {
      throw new Error(`Captcha vendor handshake failed: ${data.request}`);
    }

    return data.request; // This returns the Task/Captcha ID
  }

  /**
   * Dynamic short-polling mechanism to query token results till resolved
   */
  static async pollCaptchaResult(apiKey, taskId, retries = 20, delayMs = 5000) {
    const endpoint = `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${taskId}&json=1`;

    for (let i = 0; i < retries; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.status === 1) {
          return data.request; // This returns the finalized g-recaptcha-response Token string
        }
        
        if (data.request !== "CAPCHA_NOT_READY") {
          throw new Error(`Solver threw exception context: ${data.request}`);
        }
      } catch (err) {
        console.error("[Captcha Solver Pool Error]:", err);
      }
    }

    throw new Error("Captcha decoding lifecycle timeout exceeded threshold limit.");
  }
}