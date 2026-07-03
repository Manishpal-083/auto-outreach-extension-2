// modules/multiStepNavigationEngine.js
import { FormDetector } from './formDetector.js';
import { AutofillEngine } from './autofillEngine.js';

export class MultiStepNavigationEngine {
  /**
   * Orchestrates the multi-step outreach flow.
   * Tracks steps using state flags stored on the target context.
   */
  static run(docContext, data) {
    if (!docContext) return "No document context.";

    const state = docContext._multiStepState || {
      currentStep: 'FIND_CTA',
      ctaClicked: false,
      modalOpened: false,
      iframeDetected: false,
      animationWaited: false,
      formFilled: false,
      submitted: false,
      loopIntervalId: null,
      observer: null
    };
    docContext._multiStepState = state;

    const realClick = (el) => {
      if (!el) return;
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
        console.log("[NavigationEngine] Clicked:", el);
      } catch (err) {
        console.error("[NavigationEngine] Click failed:", err);
      }
    };

    // Modal selectors matching Bootstrap, React, HubSpot, Elementor, Popup Maker, Webflow, Framer
    const MODAL_SELECTORS = [
      '.modal', '.modal-dialog', '.modal-content',
      '[role="dialog"]', '.ReactModal__Content',
      '.elementor-popup-modal', '.dialog-widget-content',
      '.pum-container', '.pum-overlay',
      '.w-lightbox', '.modal-wrapper', '.modal-container',
      '.framer-modal', '[data-framer-component]',
      '.leadinModal', '.hs-form-iframe', '.hs-messages-widget'
    ];

    const findModalContainer = () => {
      for (const selector of MODAL_SELECTORS) {
        const modal = docContext.querySelector(selector);
        if (modal && modal.offsetParent !== null) {
          return modal;
        }
      }
      return null;
    };

    const findIframe = (container) => {
      const root = container || docContext;
      const iframe = root.querySelector('iframe[src], iframe[data-src]');
      if (iframe && iframe.offsetParent !== null) {
        // Only return if same-origin or accessible
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc) return iframe;
        } catch (e) {
          console.warn("[NavigationEngine] Found cross-origin iframe. Restricting access.");
        }
      }
      return null;
    };

    const getActiveDocumentContext = () => {
      const modal = findModalContainer();
      if (modal) {
        const iframe = findIframe(modal);
        if (iframe) {
          try {
            return iframe.contentDocument || iframe.contentWindow.document;
          } catch (e) {}
        }
        return modal;
      }
      const iframe = findIframe();
      if (iframe) {
        try {
          return iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {}
      }
      return docContext;
    };

    const executeEngineStep = () => {
      const activeContext = getActiveDocumentContext();
      
      // If a form is immediately visible, fast-track to FILL_FORM
      const detected = FormDetector.detectFields(activeContext);
      const hasForm = detected.name.element || detected.email.element;

      if (hasForm && state.currentStep !== 'SUBMITTING') {
        state.currentStep = 'FILL_FORM';
      }

      console.log(`[NavigationEngine] Executing: ${state.currentStep}`);

      switch (state.currentStep) {
        case 'FIND_CTA':
          // Search every anchor, button, and role-button using Levenshtein navigation scoring
          const candidates = Array.from(docContext.querySelectorAll('a, button, [role="button"], .btn, .button'));
          let bestCta = null;
          let bestScore = 0;

          for (const el of candidates) {
            // Avoid clicking navigation paths that lead out of the site (login, dashboard)
            const href = el.getAttribute('href') || '';
            if (href.includes('/login') || href.includes('/dashboard') || href.includes('/logout')) continue;

            const text = (el.innerText || el.textContent || '').trim().toLowerCase();
            let score = 0;
            const keywords = ['contact', 'talk', 'book', 'demo', 'consultation', 'schedule', 'meeting', 'sales', 'get started', 'reach', 'connect', 'quote', 'free audit', 'strategy'];
            
            for (const kw of keywords) {
              if (text.includes(kw)) score += 10;
              if (text === kw) score += 10; // Exact match bonus
            }

            // Exclude invisible elements
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || el.offsetWidth === 0) continue;

            if (score > bestScore) {
              bestScore = score;
              bestCta = el;
            }
          }

          if (bestCta) {
            console.log(`[NavigationEngine] CTA Found: "${bestCta.innerText}" (Score: ${bestScore}). Transitioning to CLICK_CTA.`);
            state.currentStep = 'CLICK_CTA';
            realClick(bestCta);
          } else {
            console.log("[NavigationEngine] No CTA match found. Fallback to scans.");
            state.currentStep = 'WAIT_MODAL';
          }
          break;

        case 'CLICK_CTA':
          // Transition state and wait for modal rendering
          state.ctaClicked = true;
          state.currentStep = 'WAIT_MODAL';
          break;

        case 'WAIT_MODAL':
          const modal = findModalContainer();
          if (modal) {
            console.log("[NavigationEngine] Modal overlay detected. Transitioning to WAIT_IFRAME.");
            state.modalOpened = true;
            state.currentStep = 'WAIT_IFRAME';
          } else {
            // If no modal appears after delay, look for iframe or form directly
            const iframe = findIframe();
            if (iframe) {
              state.currentStep = 'WAIT_IFRAME';
            } else if (hasForm) {
              state.currentStep = 'FILL_FORM';
            }
          }
          break;

        case 'WAIT_IFRAME':
          const activeIframe = findIframe(findModalContainer());
          if (activeIframe) {
            console.log("[NavigationEngine] Embedded iframe detected. Loading content document...");
            state.iframeDetected = true;
          }
          state.currentStep = 'WAIT_ANIMATION';
          break;

        case 'WAIT_ANIMATION':
          // Delay briefly to allow transitions to settle
          console.log("[NavigationEngine] Waiting for entry transitions to settle...");
          setTimeout(() => {
            state.animationWaited = true;
            state.currentStep = 'FILL_FORM';
          }, 600);
          break;

        case 'FILL_FORM':
          if (state.formFilled) return;
          state.formFilled = true;
          console.log("[NavigationEngine] Filling active form context...");

          if (detected.name.element && data.name) {
            AutofillEngine.fillInput(detected.name.element, data.name);
          }
          if (detected.email.element && data.email) {
            AutofillEngine.fillInput(detected.email.element, data.email);
          }
          if (detected.company.element && data.company) {
            AutofillEngine.fillInput(detected.company.element, data.company);
          }
          if (detected.message.element && data.message) {
            AutofillEngine.fillInput(detected.message.element, data.message);
          }

          // Transition to submit
          state.currentStep = 'SUBMITTING';
          setTimeout(() => {
            const submitBtn = activeContext.querySelector('button[type="submit"], input[type="submit"]') ||
              Array.from(activeContext.querySelectorAll('button')).find(btn => {
                const text = (btn.innerText || btn.textContent || '').toLowerCase();
                return text.includes('submit') || text.includes('send') || text.includes('message') || text.includes('schedule') || text.includes('confirm');
              });

            if (submitBtn) {
              console.log("[NavigationEngine] Triggering form submission...");
              realClick(submitBtn);
              state.submitted = true;
              chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
            } else {
              const form = detected.email.element ? detected.email.element.closest('form') : activeContext.querySelector('form');
              if (form) {
                console.warn("[NavigationEngine] Submit button not found. Dispatching form submit...");
                form.submit();
                state.submitted = true;
                chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
              }
            }
          }, 1000);
          break;

        case 'SUBMITTING':
          if (state.submitted) {
            clearInterval(state.loopIntervalId);
            if (state.observer) state.observer.disconnect();
          }
          break;
      }
    };

    // Run first step immediately
    executeEngineStep();

    // Setup loop fallback and MutationObserver for reactive step execution
    if (!state.loopIntervalId) {
      state.loopIntervalId = setInterval(executeEngineStep, 1000);
    }

    if (!state.observer) {
      state.observer = new MutationObserver(() => {
        executeEngineStep();
      });
      state.observer.observe(docContext.body, { childList: true, subtree: true });
    }

    return "Multi-Step Navigation Engine Active.";
  }
}
