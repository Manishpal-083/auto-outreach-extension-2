// modules/schedulerEngine.js

import { DOMUtils } from './domUtils.js';
import { NavigationManager } from './navigationManager.js';

export class SchedulerEngine {
  static triggerSchedulerButtonClicks() {
    if (window.location.hostname.includes("calendly.com") || window.schedulerButtonClicked) return;

    const buttons = document.querySelectorAll('a[href], button, [role="button"]');
    for (const btn of buttons) {
      const text = (btn.innerText || btn.textContent || "").trim().toLowerCase();
      const href = (btn.href || btn.getAttribute("href") || "").trim().toLowerCase();

      if (!btn.offsetParent) continue;
      if (href.includes("/login") || href.includes("/signup") || href.includes("/dashboard")) continue;

      const isCalendlyLink = href.includes("calendly.com");
      const score = NavigationManager.scoreNavigationElement(btn);
      const isBookingButton = score > 0;

      if (!isCalendlyLink && !isBookingButton) continue;

      window.schedulerButtonClicked = true;

      if (isCalendlyLink) {
        btn.setAttribute('target', '_blank');
      } else {
        btn.setAttribute('target', '_self');
      }

      console.log("[Engine] Clicking element cleanly.");
      DOMUtils.realClick(btn);
      break;
    }
  }
}
