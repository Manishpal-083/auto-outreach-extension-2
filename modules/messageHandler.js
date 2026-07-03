// modules/messageHandler.js

import { NavigationManager } from './navigationManager.js';
import { FormFiller } from './formFiller.js';
import { ObserverManager } from './observerManager.js';
import { CalendlyHandler } from './calendlyHandler.js';
import { SchedulerEngine } from './schedulerEngine.js';
import { DOMUtils } from './domUtils.js';
import { MultiStepNavigationEngine } from './multiStepNavigationEngine.js';
import { FormDetector } from './formDetector.js';

export class MessageHandler {
  static init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action !== "PROCESS_PAGE_STAGE") return;

      (async () => {
        try {
          if (request.stage === "SEARCHING_CONTACT") {
            const result = await NavigationManager.findContactPageAndRedirect();
            sendResponse({ success: true, status: result });
            return;
          }

          if (request.stage === "FILLING_FORM") {
            window.globalLeadData = request.payload;
            ObserverManager.startGlobalMutationObserver();
            const result = await this.handleFormOrCalendlyFilling(request.payload);
            sendResponse({ success: true, status: result });
            return;
          }
          sendResponse({ success: true, status: "Nothing To Process" });
        } catch (error) {
          sendResponse({ success: false, status: error.message });
        }
      })();
      return true;
    });
  }

  static async handleFormOrCalendlyFilling(data) {
    if (window.location.hostname.includes("calendly.com")) {
      try {
        const onetrustBanner = document.querySelector('#onetrust-banner-sdk, .onetrust-pc-dark-filter, #onetrust-consent-sdk');
        const acceptBtn = document.querySelector('#onetrust-accept-btn-handler, #onetrust-reject-all-handler, button[id*="accept" i]');
        if (onetrustBanner || acceptBtn) {
          if (acceptBtn) DOMUtils.realClick(acceptBtn);
          if (onetrustBanner) onetrustBanner.remove();
          document.body.style.setProperty('overflow', 'auto', 'important');
        }
      } catch (cookieErr) {}
    }

    let nativeFormStatus = "No Native Form";
    let calendlyStatus = "Calendly Not Found";

    try {
      const detected = FormDetector ? FormDetector.detectFields() : null;
      const hasNativeForm = detected ? (detected.name.element || detected.email.element || detected.message.element) : null;

      if (hasNativeForm) {
        nativeFormStatus = await FormFiller.fillStandardFormFields(data);
      } else {
        const hasPotentiallyDynamicForm = document.querySelector("form") || document.querySelector("input") || document.querySelector("textarea") || document.querySelector('[role="textbox"]') || document.querySelector('[contenteditable]');
        if (hasPotentiallyDynamicForm) {
          nativeFormStatus = await FormFiller.waitForAndFillStandardFields(data);
        } else if (MultiStepNavigationEngine) {
          console.log("[Outreach Engine] No forms found. Initiating Multi-Step Navigation Engine...");
          nativeFormStatus = MultiStepNavigationEngine.run(document, data);
        }
      }
    } catch (err) {
      nativeFormStatus = err.message;
    }

    if (!window.location.hostname.includes("calendly.com") && !document.querySelector('iframe[src*="calendly.com"]')) {
      setTimeout(() => {
        SchedulerEngine.triggerSchedulerButtonClicks();
      }, 800);
    }

    try {
      if (window.location.hostname.includes("calendly.com")) {
        calendlyStatus = await CalendlyHandler.fillCalendlyFieldsDirect(data);
      } else {
        const iframe = document.querySelector('iframe[src*="calendly.com"]');
        if (iframe) {
          calendlyStatus = await CalendlyHandler.fillCalendlyInsideIframe(iframe, data);
        }
      }
    } catch (err) {
      calendlyStatus = err.message;
    }

    return `Native Form: ${nativeFormStatus} | Calendly: ${calendlyStatus}`;
  }
}
