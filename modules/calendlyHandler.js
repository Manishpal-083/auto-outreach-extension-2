// modules/calendlyHandler.js
import { FormDetector } from './formDetector.js';
import { AutofillEngine } from './autofillEngine.js';

export class CalendlyHandler {
  /**
   * Automates the Calendly scheduling flow recursively.
   * Monitors dynamic React rendering changes using MutationObserver and polling.
   */
  static automate(docContext, data) {
    if (!docContext) return "No document context provided.";

    // Initialize state flags on document to prevent parallel loops
    const state = docContext._calendlyState || {
      dateClicked: false,
      timeClicked: false,
      formFilled: false,
      observerActive: false
    };
    docContext._calendlyState = state;

    const realClick = (el) => {
      if (!el) return;
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
        console.log("[CalendlyHandler] Element clicked successfully.");
      } catch (err) {
        console.error("[CalendlyHandler] Click failed:", err);
      }
    };

    // Date Selectors (Calendly V1, V2, and Custom Routing grids)
    const DATE_SELECTORS = [
      'button[data-selenium="calendar-day"]:not([disabled])',
      'button[data-testid="calendar-day"]:not([disabled])',
      'button[aria-label*="Available"]:not([disabled])',
      'button[aria-label*="available"]:not([disabled])',
      '[data-component="day"]:not([disabled])',
      '[role="gridcell"] button:not([disabled])'
    ];

    // Time Selectors (V1, V2 spot-lists)
    const TIME_SELECTORS = [
      '[data-testid="slot-button"]',
      '[data-component="time-slots"] button',
      '[data-component="spot-list"] button',
      'button[data-selenium-slot]',
      'button[aria-label*="select time" i]',
      'button[aria-label*="am" i]',
      'button[aria-label*="pm" i]'
    ];

    const getFirstAvailableDate = () => {
      for (const selector of DATE_SELECTORS) {
        const btn = docContext.querySelector(selector);
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && btn.offsetParent !== null) {
          // Additional check: exclude unavailable dates
          const text = (btn.getAttribute('aria-label') || btn.innerText || '').toLowerCase();
          if (!text.includes('unavailable')) return btn;
        }
      }

      // Check all buttons in calendar grid
      const buttons = Array.from(docContext.querySelectorAll('button'));
      for (const btn of buttons) {
        const label = (btn.getAttribute('aria-label') || btn.innerText || '').toLowerCase();
        const isAvailable = label.includes('available') || (label.includes(',') && !label.includes('next') && !label.includes('previous') && !label.includes('month'));
        const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true' || label.includes('unavailable');
        if (isAvailable && !isDisabled && btn.offsetParent !== null) {
          return btn;
        }
      }
      return null;
    };

    const getFirstAvailableTime = () => {
      for (const selector of TIME_SELECTORS) {
        const slots = Array.from(docContext.querySelectorAll(selector)).filter(s => !s.disabled && s.getAttribute('aria-disabled') !== 'true' && s.offsetParent !== null);
        if (slots.length > 0) return slots[0];
      }
      return null;
    };

    const getNextButton = () => {
      // Direct Select/Next button by Test ID
      const nextTest = docContext.querySelector('button[data-testid="select-button"]');
      if (nextTest && !nextTest.disabled && nextTest.offsetParent !== null) return nextTest;

      // Find by text content
      const buttons = Array.from(docContext.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = (btn.innerText || btn.textContent || '').toLowerCase();
        if ((text.includes('next') || text.includes('confirm') || text.includes('select')) && !btn.disabled && btn.offsetParent !== null) {
          return btn;
        }
      }
      return null;
    };

    const getScheduleButton = () => {
      const buttons = Array.from(docContext.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = (btn.innerText || btn.textContent || '').toLowerCase();
        if ((text.includes('schedule event') || text.includes('schedule') || text.includes('book') || text.includes('confirm')) && !btn.disabled && btn.offsetParent !== null) {
          return btn;
        }
      }
      return null;
    };

    const runAutomationStep = () => {
      // 1. Check if Form View is open (Standard, Popup or Embedded iframe)
      const detected = FormDetector.detectFields(docContext);
      const isFormOpen = detected.name.element || detected.email.element;

      if (isFormOpen) {
        if (state.formFilled) return "Form already filled/filling.";
        state.formFilled = true;
        console.log("[CalendlyHandler] Form view detected. Populating outreach details...");

        if (detected.name.element && data.name) {
          AutofillEngine.fillInput(detected.name.element, data.name);
        }
        if (detected.email.element && data.email) {
          AutofillEngine.fillInput(detected.email.element, data.email);
        }
        
        // Find company/organization field inside custom Calendly questions
        if (detected.company.element && data.company) {
          AutofillEngine.fillInput(detected.company.element, data.company);
        } else {
          // Fallback check for question inputs containing "company" or "organization"
          const inputs = Array.from(docContext.querySelectorAll('input[type="text"], textarea'));
          for (const inp of inputs) {
            const labelText = FormDetector.getLabelText(inp) || '';
            if (/company|organization|org/i.test(labelText)) {
              AutofillEngine.fillInput(inp, data.company || '');
              break;
            }
          }
        }

        // Fill outreach message/notes
        if (detected.message.element && data.message) {
          AutofillEngine.fillInput(detected.message.element, data.message);
        } else {
          // Fallback: fill first textarea on form
          const textAreas = docContext.querySelectorAll('textarea');
          if (textAreas.length > 0) {
            AutofillEngine.fillInput(textAreas[0], data.message || '');
          }
        }

        // Submit Schedule Event
        setTimeout(() => {
          const scheduleBtn = getScheduleButton();
          if (scheduleBtn) {
            console.log("[CalendlyHandler] Finalizing: clicking Schedule Button...");
            realClick(scheduleBtn);
            setTimeout(() => {
              chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
            }, 1500);
          } else {
            console.warn("[CalendlyHandler] Schedule button not found. Attempting form submit...");
            const form = detected.email.element ? detected.email.element.closest('form') : docContext.querySelector('form');
            if (form) form.submit();
          }
        }, 1200);

        return "Form fields populated and auto-submit dispatched.";
      }

      // 2. Check if Time Slot View is open
      const nextBtn = getNextButton();
      const timeSlot = getFirstAvailableTime();

      if (nextBtn) {
        console.log("[CalendlyHandler] Next/Confirm button available. Clicking to advance...");
        realClick(nextBtn);
        return "Confirm button clicked.";
      }

      if (timeSlot) {
        console.log("[CalendlyHandler] Selecting first available time slot...");
        realClick(timeSlot);
        
        // React batching requires slot selection event loop cycle before next click
        setTimeout(() => {
          const next = getNextButton();
          if (next) realClick(next);
        }, 500);
        
        return "Time slot selected.";
      }

      // 3. Check if Calendar View is open
      const availableDate = getFirstAvailableDate();
      if (availableDate && !state.dateClicked) {
        state.dateClicked = true;
        console.log("[CalendlyHandler] Selecting first available date...");
        realClick(availableDate);
        return "Date selected.";
      }

      return "Waiting for active scheduler nodes...";
    };

    // Run first step immediately
    runAutomationStep();

    // 4. Setup MutationObserver to watch DOM modifications recursively
    if (!state.observerActive) {
      state.observerActive = true;
      const observer = new MutationObserver(() => {
        runAutomationStep();
      });
      observer.observe(docContext.body, { childList: true, subtree: true });

      // Polling fallback to retry if elements load slowly / observer misses lifecycle transitions
      const intervalId = setInterval(() => {
        const status = runAutomationStep();
        if (state.formFilled) {
          clearInterval(intervalId);
          observer.disconnect();
          state.observerActive = false;
        }
      }, 1000);
    }

    return "Calendly Automation Active.";
  }
}