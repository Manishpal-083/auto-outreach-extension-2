// modules/formFiller.js

import { FormDetector } from './formDetector.js';
import { AutofillEngine } from './autofillEngine.js';
import { SuccessDetector } from './successDetector.js';
import { DOMUtils } from './domUtils.js';

export const DOM_SELECTORS = {
  name: 'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i], input[type="text"][autocomplete*="name" i], input[aria-label*="name" i], .name input, input[placeholder*="Full" i]',
  email: 'input[type="email" i], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i], input[placeholder*="mail" i], .email input',
  message: 'textarea[name*="message" i], textarea[id*="message" i], textarea[placeholder*="message" i], textarea[name*="comment" i], textarea[placeholder*="help" i], textarea',
  submit: 'button[type="submit"], input[type="submit"], form button, .submit-btn, button[class*="submit" i]'
};

export class FormFiller {
  static async fillStandardFormFields(data) {
    if (!FormDetector || !AutofillEngine) {
      console.warn("[Outreach Engine] Fallback form filling active.");
      return await this.fillStandardFormFieldsFallback(data);
    }

    console.log("[Outreach Engine] Scanning DOM with Universal Form Detection System...");
    const detected = FormDetector.detectFields();

    // Log confidence scores
    console.log("[Outreach Engine] Field Detection Scores & Confidence:", {
      name: { element: detected.name.element, score: detected.name.score, confidence: detected.name.confidence },
      email: { element: detected.email.element, score: detected.email.score, confidence: detected.email.confidence },
      message: { element: detected.message.element, score: detected.message.score, confidence: detected.message.confidence },
      phone: { element: detected.phone.element, score: detected.phone.score, confidence: detected.phone.confidence },
      company: { element: detected.company.element, score: detected.company.score, confidence: detected.company.confidence },
      website: { element: detected.website?.element, score: detected.website?.score, confidence: detected.website?.confidence },
      budget: { element: detected.budget?.element, score: detected.budget?.score, confidence: detected.budget?.confidence },
      service: { element: detected.service?.element, score: detected.service?.score, confidence: detected.service?.confidence }
    });

    let filledSomething = false;

    if (detected.name.element && data.name) {
      AutofillEngine.fillInput(detected.name.element, data.name);
      filledSomething = true;
    }
    if (detected.email.element && data.email) {
      AutofillEngine.fillInput(detected.email.element, data.email);
      filledSomething = true;
    }
    if (detected.message.element && data.message) {
      AutofillEngine.fillInput(detected.message.element, data.message);
      filledSomething = true;
    }
    if (detected.phone.element && data.phone && detected.phone.confidence > 0.2) {
      AutofillEngine.fillInput(detected.phone.element, data.phone);
      filledSomething = true;
    }
    if (detected.company.element && data.company && detected.company.confidence > 0.2) {
      AutofillEngine.fillInput(detected.company.element, data.company);
      filledSomething = true;
    }
    if (detected.website?.element && data.website && detected.website.confidence > 0.2) {
      AutofillEngine.fillInput(detected.website.element, data.website);
      filledSomething = true;
    }
    if (detected.budget?.element && data.budget && detected.budget.confidence > 0.2) {
      AutofillEngine.fillInput(detected.budget.element, data.budget);
      filledSomething = true;
    }
    if (detected.service?.element && data.service && detected.service.confidence > 0.2) {
      AutofillEngine.fillInput(detected.service.element, data.service);
      filledSomething = true;
    }

    if (filledSomething) {
      setTimeout(() => {
        const submitBtn = document.querySelector(DOM_SELECTORS.submit);
        if (submitBtn) {
          DOMUtils.realClick(submitBtn);
        } else {
          const matchedEl = detected.email.element || detected.name.element || detected.message.element;
          const fallbackForm = matchedEl ? matchedEl.closest('form') : document.querySelector('form');
          if (fallbackForm && fallbackForm.isConnected) {
            fallbackForm.requestSubmit ? fallbackForm.requestSubmit() : fallbackForm.submit();
          }
        }
        if (SuccessDetector) {
          const initialUrl = window.location.href;
          SuccessDetector.verifySubmission(initialUrl).then(verification => {
            console.log("[Outreach Engine] Submission verification result:", verification);
            if (verification.success) {
              chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS", reason: verification.reason });
            } else {
              chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_FAILURE", reason: verification.reason });
            }
            if (typeof window.resetAutomation === 'function') {
              window.resetAutomation();
            }
          });
        } else {
          setTimeout(() => {
            if (typeof window.resetAutomation === 'function') {
              window.resetAutomation();
            }
            chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
          }, 3000);
        }
      }, 1500);
      const scoresStatus = `Name: ${detected.name.confidence} Conf, Email: ${detected.email.confidence} Conf, Msg: ${detected.message.confidence} Conf`;
      return `Form details populated and Auto-Submitted. (${scoresStatus})`;
    }
    throw new Error("No fillable native inputs detected.");
  }

  static async fillStandardFormFieldsFallback(data) {
    const inputs = {
      name: document.querySelector(DOM_SELECTORS.name),
      email: document.querySelector(DOM_SELECTORS.email),
      message: document.querySelector(DOM_SELECTORS.message)
    };

    let filledSomething = false;
    const simulateTyping = (el, val) => {
      if (!el || !val) return;
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
      filledSomething = true;
    };

    simulateTyping(inputs.name, data.name);
    simulateTyping(inputs.email, data.email);
    simulateTyping(inputs.message, data.message);

    if (filledSomething) {
      setTimeout(() => {
        const submitBtn = document.querySelector(DOM_SELECTORS.submit);
        if (submitBtn) {
          DOMUtils.realClick(submitBtn);
        } else {
          const fallbackForm = inputs.email ? inputs.email.closest('form') : document.querySelector('form');
          if (fallbackForm && fallbackForm.isConnected) {
            fallbackForm.requestSubmit ? fallbackForm.requestSubmit() : fallbackForm.submit();
          }
        }
        setTimeout(() => {
          if (typeof window.resetAutomation === 'function') {
            window.resetAutomation();
          }
          chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
        }, 3000);
      }, 1500);
      return "Form details populated and Auto-Submitted.";
    }
    throw new Error("No fillable native inputs detected.");
  }

  static async waitForAndFillStandardFields(data) {
    return new Promise((resolve, reject) => {
      console.log("[Outreach Engine] No fields detected immediately. Setting up dynamic field observer...");
      let observer;
      let timeoutId;
      let isFinished = false;

      const checkAndFill = async () => {
        try {
          const detected = FormDetector.detectFields();
          if (detected.name.element || detected.email.element) {
            if (isFinished) return;
            isFinished = true;
            if (observer) observer.disconnect();
            clearTimeout(timeoutId);

            const result = await this.fillStandardFormFields(data);
            resolve(result);
          }
        } catch (err) {
          if (isFinished) return;
          isFinished = true;
          if (observer) observer.disconnect();
          clearTimeout(timeoutId);
          reject(err);
        }
      };

      observer = new MutationObserver(() => {
        checkAndFill();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      const intervalId = setInterval(() => {
        if (isFinished) {
          clearInterval(intervalId);
        } else {
          checkAndFill();
        }
      }, 1000);

      timeoutId = setTimeout(() => {
        if (isFinished) return;
        isFinished = true;
        observer.disconnect();
        clearInterval(intervalId);
        reject(new Error("Timeout waiting for dynamically inserted form fields."));
      }, 15000);
    });
  }
}
