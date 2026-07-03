// modules/observerManager.js

import { FormDetector } from './formDetector.js';
import { AutofillEngine } from './autofillEngine.js';
import { FormFiller } from './formFiller.js';
import { CalendlyHandler } from './calendlyHandler.js';

export class ObserverManager {
  static startGlobalMutationObserver() {
    if (window.observerActive) return;
    window.observerActive = true;

    console.log("[Outreach Engine] Starting global MutationObserver for dynamic forms...");

    const checkAndAutofill = async () => {
      if (!window.globalLeadData) return;
      if (!FormDetector || !AutofillEngine) return;

      const detected = FormDetector.detectFields();
      let filledSomething = false;
      const fieldsToFill = ['name', 'email', 'message', 'phone', 'company', 'subject'];

      for (const field of fieldsToFill) {
        const match = detected[field];
        const val = window.globalLeadData[field];

        if (match && match.element && val) {
          const el = match.element;

          if (window.filledElements.has(el) || document.activeElement === el) {
            continue;
          }

          console.log(`[Outreach Engine] Dynamic Form Event: Autofilling "${field}" (Confidence: ${match.confidence})`);
          AutofillEngine.fillInput(el, val);
          window.filledElements.add(el);
          filledSomething = true;
        }
      }

      if (filledSomething) {
        console.log("[Outreach Engine] Dynamically detected form fields populated.");
      }
    };

    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
        if (mutation.type === 'attributes') {
          const attr = mutation.attributeName;
          if (['name', 'id', 'placeholder', 'type', 'v-model', 'formcontrolname', 'contenteditable', 'role', 'aria-label', 'autocomplete'].includes(attr)) {
            shouldScan = true;
            break;
          }
        }
      }

      if (shouldScan) {
        checkAndAutofill();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'id', 'placeholder', 'type', 'v-model', 'formcontrolname', 'contenteditable', 'role', 'aria-label', 'autocomplete']
    });
  }

  static setupCalendlyObserver(docContext, data) {
    if (window.calendlyObserverRunning) return;
    window.calendlyObserverRunning = true;

    const observer = new MutationObserver(() => {
      if (window.calendlyFormFilled) {
        observer.disconnect();
        return;
      }
      const nameInput = docContext.querySelector('input[name="name"], input[type="email"]');
      if (nameInput) {
        observer.disconnect();
        window.calendlyObserverRunning = false;
        CalendlyHandler.fillCalendlyDOM(docContext, data);
      }
    });
    observer.observe(docContext.body, { childList: true, subtree: true });
  }

  static setupCalendlyIframeObserver(iframe, data) {
    if (window.calendlyIframeWatcherRunning) return;
    window.calendlyIframeWatcherRunning = true;

    const interval = setInterval(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;
        const emailInput = iframeDoc.querySelector('input[type="email"]') || iframeDoc.querySelector('button[aria-label*=","]');
        if (emailInput) {
          clearInterval(interval);
          window.calendlyIframeWatcherRunning = false;
          CalendlyHandler.fillCalendlyDOM(iframeDoc, data);
        }
      } catch (err) {}
    }, 1000);
  }
}
