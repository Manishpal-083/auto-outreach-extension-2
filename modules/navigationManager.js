// modules/navigationManager.js

import { DOMUtils } from './domUtils.js';
import { StorageManager } from './storage.js';

export class NavigationManager {
  static getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  static fuzzyMatch(text, keyword) {
    if (!text) return 0;
    const cleanText = text.toLowerCase().trim();
    const cleanKw = keyword.toLowerCase().trim();

    if (cleanText.includes(cleanKw)) {
      return 1.0;
    }

    const textWords = cleanText.split(/[\s_\-]+/);
    const kwWords = cleanKw.split(/[\s_\-]+/);

    let bestMatch = 0;
    for (const textWord of textWords) {
      for (const kwWord of kwWords) {
        if (textWord === kwWord) {
          return 1.0;
        }
        if (textWord.length >= 4 && kwWord.length >= 4) {
          const dist = this.getLevenshteinDistance(textWord, kwWord);
          const maxLen = Math.max(textWord.length, kwWord.length);
          const similarity = 1 - (dist / maxLen);
          if (similarity > 0.75) {
            bestMatch = Math.max(bestMatch, similarity);
          }
        }
      }
    }

    return bestMatch;
  }

  static scoreNavigationElement(el) {
    let score = 0;
    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
    const href = el.tagName.toLowerCase() === 'a' ? (el.getAttribute('href') || '').trim().toLowerCase() : '';
    const idAttr = (el.getAttribute('id') || '').toLowerCase();
    const classList = el.className || '';
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const titleAttr = (el.getAttribute('title') || '').toLowerCase();

    const keywords = {
      'contact us': 15,
      'contact': 15,
      'reach': 12,
      'connect': 12,
      'book': 12,
      'schedule': 12,
      'meeting': 12,
      'demo': 10,
      'consultation': 10,
      'free audit': 10,
      'strategy': 10,
      'speak': 10,
      'sales': 10,
      'quote': 10,
      'estimate': 10,
      'support': 8,
      'partner': 8,
      'get started': 6,
      'talk': 6
    };

    if (href.includes('/login') || href.includes('/signup') || href.includes('/dashboard') || href.includes('/logout') || href.includes('/signin') || href.includes('/register')) {
      return -50;
    }

    for (const [kw, wt] of Object.entries(keywords)) {
      const similarity = this.fuzzyMatch(text, kw);
      if (similarity > 0) {
        score += wt * similarity * (text === kw ? 2.0 : 1.0);
      }
    }

    if (href) {
      if (href.includes('calendly.com')) {
        score += 25;
      }
      for (const [kw, wt] of Object.entries(keywords)) {
        const similarity = this.fuzzyMatch(href, kw);
        if (similarity > 0) {
          score += wt * similarity * 0.8;
        }
      }
    }

    for (const [kw, wt] of Object.entries(keywords)) {
      const similarity = this.fuzzyMatch(ariaLabel || titleAttr, kw);
      if (similarity > 0) {
        score += wt * similarity * 0.6;
      }
    }

    for (const [kw, wt] of Object.entries(keywords)) {
      const cleanKw = kw.replace(/\s+/g, '-');
      const similarity = this.fuzzyMatch(idAttr || classList, cleanKw);
      if (similarity > 0) {
        score += wt * similarity * 0.4;
      }
    }

    const style = window.getComputedStyle(el);
    const isHidden = style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0;
    const isZeroSized = el.offsetWidth === 0 && el.offsetHeight === 0;
    if (isHidden || isZeroSized) {
      return -100;
    }

    return score;
  }

  static async findContactPageAndRedirect() {
    const currentUrl = window.location.href;
    const redirectedUrl = StorageManager.getSessionItem("redirectedURL");

    if (
      currentUrl.includes("/new-meeting") ||
      currentUrl.includes("2026-") ||
      document.querySelector('input[name="name"]') ||
      window.calendlyFormFilled
    ) {
      chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
      return "Calendly form detected.";
    }

    if (
      currentUrl.includes("/contact") ||
      currentUrl.includes("/book") ||
      currentUrl.includes("/schedule") ||
      window.location.hostname.includes("calendly.com")
    ) {
      chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
      return "Already on contact page.";
    }

    if (document.querySelector('iframe[src*="calendly.com"]') || document.querySelector(".calendly-inline-widget")) {
      chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
      return "Embedded Calendly detected.";
    }

    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="menuitem"], .btn, .button'));
    const scoredCandidates = [];

    for (const el of candidates) {
      const href = el.tagName.toLowerCase() === 'a' ? (el.href || '').trim() : '';
      if (href && (href === currentUrl || href.startsWith(currentUrl + '#') || (redirectedUrl && redirectedUrl === href))) {
        continue;
      }

      const score = this.scoreNavigationElement(el);
      if (score > 0) {
        scoredCandidates.push({
          element: el,
          score: score,
          href: href,
          text: (el.innerText || el.textContent || '').trim()
        });
      }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      const topCandidate = scoredCandidates[0];
      const el = topCandidate.element;
      const href = topCandidate.href;
      const text = topCandidate.text;
      const isCalendly = href.includes("calendly.com") || text.toLowerCase().includes("calendly");

      StorageManager.setSessionItem("redirectedURL", href || text);

      console.log("[Outreach Navigation] Ranked destinations:", scoredCandidates.slice(0, 5));
      console.log(`[Outreach Navigation] Visiting highest confidence destination: "${text}" with score ${topCandidate.score}`);

      if (isCalendly) {
        await new Promise(resolve => {
          chrome.runtime.sendMessage({ action: "OPEN_NEW_TAB_URL", url: href }, () => { resolve(); });
        });
        return `Calendly link detected. Opening in separate tab: ${href}`;
      } else if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        await new Promise(resolve => {
          chrome.runtime.sendMessage({ action: "FORCE_REDIRECT_URL", url: href }, () => { resolve(); });
        });
        return `Redirecting same tab to top-ranked page: ${href} (Score: ${topCandidate.score})`;
      } else {
        DOMUtils.realClick(el);
        return `Clicked top-ranked interactive navigation button: "${text}" (Score: ${topCandidate.score})`;
      }
    }

    if (document.querySelector("form") || document.querySelector("textarea") || document.querySelector('input[type="email"]')) {
      chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
      return "Native form structure detected.";
    }

    throw new Error("No Contact Page Found.");
  }
}