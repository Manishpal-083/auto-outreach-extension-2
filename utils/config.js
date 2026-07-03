// utils/config.js

export const APP_CONFIG = {
  // Engine Thresholds
  MAX_RETRIES: 3,                 // Agar form submission fail ho toh kitni baar retry kare
  DOM_LOAD_TIMEOUT: 15000,        // Max time to wait for a website to load (15 seconds)
  HUMAN_TYPING_DELAY_MIN: 50,     // Human-like typing simulation delay min (ms)
  HUMAN_TYPING_DELAY_MAX: 150,    // Human-like typing simulation delay max (ms)

  // Third-Party API Endpoints for CAPTCHA
  CAPTCHA_PROVIDERS: {
    TWO_CAPTCHA: 'https://2captcha.com/in.php',
    TWO_CAPTCHA_RES: 'https://2captcha.com/res.php',
    ANTI_CAPTCHA: 'https://api.anti-captcha.com/createTask'
  },

  // System Flags
  DEBUG_MODE: true                // Developer console me logs active rakhne ke liye
};