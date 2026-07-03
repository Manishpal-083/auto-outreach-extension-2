// utils/helpers.js
import { APP_CONFIG } from './config.js';

/**
 * Custom delay function utilizing microtask promises
 * @param {number} ms - Milliseconds to pause execution
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates human-like random intervals for asynchronous events
 */
export const getRandomTypingDelay = () => {
  return Math.floor(Math.random() * (APP_CONFIG.HUMAN_TYPING_DELAY_MAX - APP_CONFIG.HUMAN_TYPING_DELAY_MIN + 1)) + APP_CONFIG.HUMAN_TYPING_DELAY_MIN;
};

/**
 * Simulates real human typing into an input element to trigger native React/Vue framework state updates
 * @param {HTMLInputElement} element - Target DOM node
 * @param {string} value - Value to type programmatically
 */
export async function simulateHumanTyping(element, value) {
  if (!element) return;
  
  element.focus();
  element.value = ''; // Clear existing garbage data

  for (let i = 0; i < value.length; i++) {
    element.value += value[i];
    // Trigger mandatory browser input events so websites know data is typed
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value[i] }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: value[i] }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: value[i] }));
    
    await delay(getRandomTypingDelay());
  }
  
  element.blur();
}

/**
 * Safely extracts sitekeys or captcha parameters from DOM elements
 * @param {string} regexPattern - Regular expression string
 * @param {string} contextString - Target source HTML string
 */
export function extractRegexMatch(regexPattern, contextString) {
  const regex = new RegExp(regexPattern, 'i');
  const match = contextString.match(regex);
  return match ? match[1] : null;
}