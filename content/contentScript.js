// console.log("[Outreach Engine] Dual-Engine + Auto-Clicker Mode (Infinite Loop Fixed).");

// const DOM_SELECTORS = {
//   name: 'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i], input[type="text"][autocomplete*="name" i], input[aria-label*="name" i], .name input, input[placeholder*="Full" i]',
//   email: 'input[type="email" i], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i], input[placeholder*="mail" i], .email input',
//   message: 'textarea[name*="message" i], textarea[id*="message" i], textarea[placeholder*="message" i], textarea[name*="comment" i], textarea[placeholder*="help" i], textarea',
//   submit: 'button[type="submit"], input[type="submit"], form button, .submit-btn, button[class*="submit" i]'
// };

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "PROCESS_PAGE_STAGE") {
//     if (request.stage === 'SEARCHING_CONTACT') {
//       findContactPageAndRedirect()
//         .then((msg) => sendResponse({ success: true, status: msg }))
//         .catch((err) => sendResponse({ success: false, status: err.message }));
//     } else if (request.stage === 'FILLING_FORM') {
//       handleFormOrCalendlyFilling(request.payload)
//         .then((msg) => sendResponse({ success: true, status: msg }))
//         .catch((err) => sendResponse({ success: false, status: err.message }));
//     }
//     return true;
//   }
// });

// async function findContactPageAndRedirect() {
//   const currentUrl = window.location.href;

//   if (
//     currentUrl.includes("/new-meeting") || 
//     currentUrl.includes("2026-") || 
//     document.querySelector('input[name="name"]') || 
//     window.calendlyFormFilled
//   ) {
//     chrome.storage.local.set({ pipeline_step: "FILLING_FORM" });
//     return "On Calendly operational form view - halting redirection scans.";
//   }

//   if (
//     currentUrl.includes("contact") ||
//     currentUrl.includes("book") ||
//     window.location.hostname.includes("calendly.com")
//   ) {
//     chrome.storage.local.set({ pipeline_step: "FILLING_FORM" });
//     return "Already on target page.";
//   }

//   if (
//     document.querySelector('iframe[src*="calendly.com"]') ||
//     document.querySelector(".calendly-inline-widget")
//   ) {
//     chrome.storage.local.set({ pipeline_step: "FILLING_FORM" });
//     return "Embedded Calendly detected.";
//   }

//   const links = document.querySelectorAll("a[href]");

//   for (const link of links) {
//     const href = (link.href || "").trim();
//     const text = (link.innerText || "").trim().toLowerCase();

//     if (!href) continue;
//     if (href === currentUrl || href.startsWith(currentUrl + "#")) continue;

//     if (sessionStorage.getItem("redirectedURL") === href) {
//       continue;
//     }

//     const valid =
//       href.includes("/contact") ||
//       href.includes("calendly.com") ||
//       text.includes("contact") ||
//       text.includes("book") ||
//       text.includes("schedule") ||
//       text.includes("strategy call") ||
//       text.includes("book demo");

//     if (!valid) continue;

//     sessionStorage.setItem("redirectedURL", href);
//     chrome.runtime.sendMessage({
//       action: "FORCE_REDIRECT_URL",
//       url: href
//     });

//     return `Redirecting to target node: ${href}`;
//   }

//   if (
//     document.querySelector("form") ||
//     document.querySelector("textarea") ||
//     document.querySelector('input[type="email"]')
//   ) {
//     chrome.storage.local.set({ pipeline_step: "FILLING_FORM" });
//     return "Native form structure detected.";
//   }

//   throw new Error("No Contact Page Found.");
// }

// // ======================================
// // DUAL ENGINE CONTROLLER 
// // ======================================
// async function handleFormOrCalendlyFilling(data) {
//   console.log("[Outreach Engine] Starting Automation Loops...");

//   if (window.location.hostname.includes("calendly.com")) {
//     try {
//       const onetrustBanner = document.querySelector('#onetrust-banner-sdk, .onetrust-pc-dark-filter, #onetrust-consent-sdk');
//       const acceptBtn = document.querySelector('#onetrust-accept-btn-handler, #onetrust-reject-all-handler, button[id*="accept" i]');

//       if (onetrustBanner || acceptBtn) {
//         if (acceptBtn) {
//           acceptBtn.click(); 
//         }
//         if (onetrustBanner) onetrustBanner.remove();
//         const darkFilter = document.querySelector('.onetrust-pc-dark-filter, .onetrust-fade-in');
//         if (darkFilter) darkFilter.remove();

//         document.body.style.setProperty('overflow', 'auto', 'important');
//         document.documentElement.style.setProperty('overflow', 'auto', 'important');
//       }
//     } catch (cookieErr) {
//       console.log("Cookie bypass safe catch:", cookieErr.message);
//     }
//   }

//   let nativeFormStatus = "No Native Form";
//   let calendlyStatus = "Calendly Not Found";

//   try {
//     const hasNativeForm =
//       document.querySelector(DOM_SELECTORS.name) ||
//       document.querySelector(DOM_SELECTORS.email) ||
//       document.querySelector(DOM_SELECTORS.message);

//     if (hasNativeForm) {
//       nativeFormStatus = await fillStandardFormFields(data);
//     }
//   } catch (err) {
//     nativeFormStatus = err.message;
//   }

//   if (!window.location.hostname.includes("calendly.com")) {
//     setTimeout(() => {
//       triggerSchedulerButtonClicks();
//     }, 800);
//   }

//   try {
//     if (window.location.hostname.includes("calendly.com")) {
//       calendlyStatus = await fillCalendlyFieldsDirect(data);
//     } else {
//       const iframe = document.querySelector('iframe[src*="calendly.com"]');
//       if (iframe) {
//         calendlyStatus = await fillCalendlyInsideIframe(iframe, data);
//       }
//     }
//   } catch (err) {
//     calendlyStatus = err.message;
//   }

//   console.log({ nativeFormStatus, calendlyStatus });
//   return `Native Form: ${nativeFormStatus} | Calendly: ${calendlyStatus}`;
// }

// function triggerSchedulerButtonClicks() {
//   if (window.location.hostname.includes("calendly.com")) return;
//   if (window.schedulerButtonClicked) return;

//   const buttons = document.querySelectorAll('a[href], button, [role="button"]');

//   for (const btn of buttons) {
//     const text = (btn.innerText || btn.textContent || "").trim().toLowerCase();
//     const href = (btn.href || btn.getAttribute("href") || "").trim().toLowerCase();

//     if (!btn.offsetParent) continue; 

//     if (
//       href.includes("/app") ||
//       href.includes("/dashboard") ||
//       href.includes("/login") ||
//       href.includes("/signup") ||
//       href.includes("/meeting_types") ||
//       href.includes("/availability") ||
//       href.includes("/event_types") ||
//       href.includes("/notetaker")
//     ) {
//       continue;
//     }

//     if (
//       btn.closest(".calendly-popup") ||
//       btn.closest(".calendly-overlay") ||
//       btn.closest(".calendly-inline-widget")
//     ) {
//       continue;
//     }

//     const isCalendlyLink = href.includes("calendly.com");
//     const isBookingButton =
//       text.includes("schedule free strategy call") ||
//       text.includes("schedule call") ||
//       text.includes("book a call") ||
//       text.includes("book demo") ||
//       text.includes("book consultation") ||
//       text.includes("book meeting");

//     if (!isCalendlyLink && !isBookingButton) continue;

//     console.log("[Scheduler] Target clicked successfully:", text || href);
//     window.schedulerButtonClicked = true;

//     setTimeout(() => {
//       btn.click();
//     }, 500);

//     break;
//   }
// }

// async function fillStandardFormFields(data) {
//   const inputs = {
//     name: document.querySelector(DOM_SELECTORS.name),
//     email: document.querySelector(DOM_SELECTORS.email),
//     message: document.querySelector(DOM_SELECTORS.message)
//   };

//   let filledSomething = false;
//   const simulateTyping = (el, val) => {
//     if (!el || !val) return;
//     el.focus(); el.value = val;
//     el.dispatchEvent(new Event('input', { bubbles: true }));
//     el.dispatchEvent(new Event('change', { bubbles: true }));
//     el.blur(); filledSomething = true;
//   };

//   simulateTyping(inputs.name, data.name);
//   simulateTyping(inputs.email, data.email);
//   simulateTyping(inputs.message, data.message);

//   const recaptchaResponseArea = document.querySelector('#g-recaptcha-response, [name="g-recaptcha-response"]');
//   if (recaptchaResponseArea) {
//     recaptchaResponseArea.innerHTML = "MOCK_TEST_TOKEN_SUCCESS_2CAPTCHA_VALIDATION";
//     recaptchaResponseArea.dispatchEvent(new Event('change', { bubbles: true }));
//   }

//   if (filledSomething) {
//     setTimeout(() => {
//       const submitBtn = document.querySelector(DOM_SELECTORS.submit);
//       if (submitBtn) {
//         submitBtn.click();
//       } else {
//         const fallbackForm = inputs.email ? inputs.email.closest('form') : document.querySelector('form');
//         if (fallbackForm) {
//           fallbackForm.submit();
//         }
//       }

//       setTimeout(() => {
//         chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
//       }, 1000);

//     }, 1500);

//     return "Form details populated and Auto-Submitted.";
//   }
//   throw new Error("No fillable native inputs detected.");
// }

// async function fillCalendlyInsideIframe(iframe, data) {
//   try {
//     const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
//     if (!iframeDocument) return "Calendly iframe secured by cross-origin policies.";
//     return await fillCalendlyDOM(iframeDocument, data);
//   } catch (e) {
//     setupCalendlyIframeObserver(iframe, data);
//     return "Calendly tracking injected. Waiting for user to confirm time-slot...";
//   }
// }

// async function fillCalendlyFieldsDirect(data) {
//   return await fillCalendlyDOM(document, data);
// }

// async function fillCalendlyDOM(docContext, data) {
//   // 🔥 FIXED LIVE LOGIC: Target matching criteria for actual calendar component grids
//   const hasCalendarView = docContext.querySelector('[data-component="calendar"], [data-testid="calendar-day"], [data-calendar-date], button[aria-label*=","]');
//   const hasTimeSlots = docContext.querySelector('[data-testid="slot-button"], [data-component="spot-list"] button, button[data-selenium-slot]');

//   // Case A: Calendar view available hai par koi date selected nahi hui h
//   if (hasCalendarView && !hasTimeSlots) {
//     console.log("[Calendly Engine] Calendar view active. Starting production precision date scanner...");

//     // Naye Calendly framework ke exact interactive active day elements ko query karo
//     const calendarButtons = [...docContext.querySelectorAll('button')];
//     const activeDateBtn = calendarButtons.find(btn => {
//       const label = (btn.getAttribute('aria-label') || '').toLowerCase();
//       const testId = (btn.getAttribute('data-testid') || '').toLowerCase();
//       const roleAttr = (btn.getAttribute('data-component') || '').toLowerCase();

//       // Filter components: Button disabled nahi hona chahiye aur usme standard available schedule commas ya layout identifiers hone chahiye
//       return !btn.disabled && (
//         testId.includes('day') || 
//         roleAttr.includes('day') ||
//         (label.includes(',') && !label.includes('next') && !label.includes('previous')) ||
//         btn.hasAttribute('data-calendar-date')
//       );
//     });

//     if (activeDateBtn) {
//       console.log("[Calendly Engine] Found active day element node! Simulating sequence click event.");
//       activeDateBtn.focus();
//       activeDateBtn.click();

//       // DOM updates are asynchronously batched inside React, force immediate watcher callback trigger
//       setTimeout(() => {
//         setupCalendlyObserver(docContext, data);
//       }, 500);
//       return "Date element successfully targeted. Moving step to time engine slot tracker...";
//     }
//   }

//   // Case B: Time Slots open ho chuke hain page par
//   if (hasTimeSlots) {
//     const nextConfirmBtn = [...docContext.querySelectorAll("button")].find(btn => {
//       const btnText = (btn.innerText || btn.textContent || "").toLowerCase();
//       return btnText.includes("next") || btnText.includes("confirm");
//     });

//     if (nextConfirmBtn) {
//       console.log("[Calendly Engine] Confirm button detected. Advancing interface...");
//       nextConfirmBtn.click();
//       setupCalendlyObserver(docContext, data);
//       return "Time verified. Transitioning to user submission form fields...";
//     } else {
//       const firstTimeSlot = docContext.querySelector('[data-testid="slot-button"], [data-component="spot-list"] button, button[data-selenium-slot]');
//       if (firstTimeSlot) {
//         console.log("[Calendly Engine] Clicking available slot.");
//         firstTimeSlot.click();

//         setTimeout(() => {
//           const dynamicNextBtn = [...docContext.querySelectorAll("button")].find(btn => {
//             const txt = (btn.innerText || btn.textContent || "").toLowerCase();
//             return txt.includes("next") || txt.includes("confirm");
//           });
//           if (dynamicNextBtn) dynamicNextBtn.click();
//         }, 500);

//         setupCalendlyObserver(docContext, data);
//         return "Time slot selected, triggering Next pipeline.";
//       }
//     }
//   }

//   // Case C: Date aur Time bypass ke baad main input form page entry point
//   if (window.calendlyFormFilled) {
//     return "Calendly already completed.";
//   }

//   const reactType = (el, value) => {
//     if (!el || !value) return false;

//     const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
//     const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;

//     el.focus();
//     if (el.tagName === "TEXTAREA") {
//       textareaSetter.call(el, value);
//     } else {
//       setter.call(el, value);
//     }

//     el.dispatchEvent(new Event("input", { bubbles: true }));
//     el.dispatchEvent(new Event("change", { bubbles: true }));
//     el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
//     el.blur();
//     return true;
//   };

//   const nameInput = docContext.querySelector('input[name="name"],input[autocomplete="name"],input[autocomplete="given-name"],input[type="text"]');
//   const emailInput = docContext.querySelector('input[type="email"],input[name="email"]');
//   const notesInput = docContext.querySelector('textarea,.ce1w0pwb textarea');

//   let filled = false;

//   if (nameInput) { reactType(nameInput, data.name); filled = true; }
//   if (emailInput) { reactType(emailInput, data.email); filled = true; }
//   if (notesInput) { reactType(notesInput, data.message); }

//   if (!filled) {
//     setupCalendlyObserver(docContext, data);
//     return "Waiting for form fields layout to finish rendering...";
//   }

//   window.calendlyFormFilled = true;
//   console.log("[Calendly] Fields Filled Successfully");

//   setTimeout(() => {
//     const scheduleBtn = [...docContext.querySelectorAll("button")].find(btn => {
//       const btnText = (btn.innerText || btn.textContent || "").toLowerCase();
//       return (
//         btnText.includes("schedule event") ||
//         btnText.includes("schedule") ||
//         btnText.includes("confirm") ||
//         btnText.includes("book")
//       );
//     });

//     if (scheduleBtn) {
//       console.log("[Calendly] Triggering final schedule dispatch event.");
//       scheduleBtn.click();

//       setTimeout(() => {
//         chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
//       }, 1500);
//     }
//   }, 1200);

//   return "Calendly Filled and Auto-Submitted.";
// }

// function setupCalendlyObserver(docContext, data) {
//   if (window.calendlyObserverRunning) return;
//   window.calendlyObserverRunning = true;

//   let retryCount = 0;
//   const observer = new MutationObserver(() => {
//     if (window.calendlyFormFilled) {
//       observer.disconnect();
//       return;
//     }

//     const hasCalendar = docContext.querySelector('[data-component="calendar"], [data-testid="calendar-day"], button[aria-label*=","]');
//     const nameInput = docContext.querySelector('input[name="name"],input[aria-label*="Name" i]');

//     if (hasCalendar || nameInput) {
//       observer.disconnect();
//       window.calendlyObserverRunning = false;
//       fillCalendlyDOM(docContext, data);
//       return;
//     }

//     retryCount++;
//     if (retryCount > 60) {
//       observer.disconnect();
//       window.calendlyObserverRunning = false;
//       console.log("[Calendly] Observer timeout.");
//     }
//   });

//   observer.observe(docContext.body, { childList: true, subtree: true });
// }

// function setupCalendlyIframeObserver(iframe, data) {
//   if (window.calendlyIframeWatcherRunning) return;
//   window.calendlyIframeWatcherRunning = true;

//   let attempts = 0;
//   const interval = setInterval(() => {
//     attempts++;
//     try {
//       const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
//       if (!iframeDoc) return;

//       const hasCalendar = iframeDoc.querySelector('[data-component="calendar"], [data-testid="calendar-day"]');
//       const emailInput = iframeDoc.querySelector('input[type="email"]');
//       if (hasCalendar || emailInput) {
//         clearInterval(interval);
//         window.calendlyIframeWatcherRunning = false;
//         fillCalendlyDOM(iframeDoc, data);
//       }
//     } catch (err) {
//     }

//     if (attempts > 60) {
//       clearInterval(interval);
//       window.calendlyIframeWatcherRunning = false;
//     }
//   }, 1000);
// }
// function resetAutomation() {
//   window.schedulerButtonClicked = false;
//   window.calendlyObserverRunning = false;
//   window.calendlyIframeWatcherRunning = false;
//   window.calendlyFormFilled = false;

//   sessionStorage.removeItem("redirectedURL");
//   sessionStorage.removeItem("hasSchedulerBeenClicked");
//   console.log("[Automation] Reset Complete");
// }











// content/content.js
// content.js
// content/content.js
// content.js
console.log("[Outreach Engine] Dual-Engine Active (Separate Calendly Tab Fix).");

const DOM_SELECTORS = {
  name: 'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i], input[type="text"][autocomplete*="name" i], input[aria-label*="name" i], .name input, input[placeholder*="Full" i]',
  email: 'input[type="email" i], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i], input[placeholder*="mail" i], .email input',
  message: 'textarea[name*="message" i], textarea[id*="message" i], textarea[placeholder*="message" i], textarea[name*="comment" i], textarea[placeholder*="help" i], textarea',
  submit: 'button[type="submit"], input[type="submit"], form button, .submit-btn, button[class*="submit" i]'
};

function realClick(el) {
  if (!el) return;
  try {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.click();
    console.log("[Engine] Click dispatched cleanly.");
  } catch (err) {
    console.error("[Engine] Click failed:", err);
  }
}

window.schedulerButtonClicked = false;
window.calendlyObserverRunning = false;
window.calendlyIframeWatcherRunning = false;
window.calendlyFormFilled = false;
window.dateClicked = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "PROCESS_PAGE_STAGE") return;

  (async () => {
    try {
      if (request.stage === "SEARCHING_CONTACT") {
        const result = await findContactPageAndRedirect();
        sendResponse({ success: true, status: result });
        return;
      }

      if (request.stage === "FILLING_FORM") {
        const result = await handleFormOrCalendlyFilling(request.payload);
        sendResponse({ success: true, status: result });
        return;
      }
      sendResponse({ success: true, status: "Nothing To Process" });
    }
    catch (error) {
      sendResponse({ success: false, status: error.message });
    }
  })();
  return true;
});

async function findContactPageAndRedirect() {
  const currentUrl = window.location.href;
  const redirectedUrl = sessionStorage.getItem("redirectedURL");

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

  const links = document.querySelectorAll("a[href]");
  for (const link of links) {
    const href = (link.href || "").trim();
    const text = (link.innerText || "").trim().toLowerCase();

    if (!href || href === currentUrl || href.startsWith(currentUrl + "#") || (redirectedUrl && redirectedUrl === href)) continue;

    const isCalendly = href.includes("calendly.com") || text.includes("calendly");
    const valid = href.includes("/contact") || isCalendly || text.includes("contact") || text.includes("book") || text.includes("schedule") || text.includes("strategy call") || text.includes("book demo");

    if (!valid) continue;

    sessionStorage.setItem("redirectedURL", href);

    // 🔥 FIX: Agar Calendly link hai toh Background ko action badal kar bhejo taaki NAYA tab khule
    if (isCalendly) {
      await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "OPEN_NEW_TAB_URL", url: href }, () => { resolve(); });
      });
      return `Calendly link detected. Opening in separate tab: ${href}`;
    } else {
      await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "FORCE_REDIRECT_URL", url: href }, () => { resolve(); });
      });
      return `Redirecting same tab: ${href}`;
    }
  }

  if (document.querySelector("form") || document.querySelector("textarea") || document.querySelector('input[type="email"]')) {
    chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
    return "Native form structure detected.";
  }

  throw new Error("No Contact Page Found.");
}

async function handleFormOrCalendlyFilling(data) {
  if (window.location.hostname.includes("calendly.com")) {
    try {
      const onetrustBanner = document.querySelector('#onetrust-banner-sdk, .onetrust-pc-dark-filter, #onetrust-consent-sdk');
      const acceptBtn = document.querySelector('#onetrust-accept-btn-handler, #onetrust-reject-all-handler, button[id*="accept" i]');
      if (onetrustBanner || acceptBtn) {
        if (acceptBtn) realClick(acceptBtn);
        if (onetrustBanner) onetrustBanner.remove();
        document.body.style.setProperty('overflow', 'auto', 'important');
      }
    } catch (cookieErr) {}
  }

  let nativeFormStatus = "No Native Form";
  let calendlyStatus = "Calendly Not Found";

  try {
    const hasNativeForm = document.querySelector(DOM_SELECTORS.name) || document.querySelector(DOM_SELECTORS.email);
    if (hasNativeForm) { nativeFormStatus = await fillStandardFormFields(data); }
  } catch (err) { nativeFormStatus = err.message; }

  if (!window.location.hostname.includes("calendly.com") && !document.querySelector('iframe[src*="calendly.com"]')) {
    setTimeout(() => { triggerSchedulerButtonClicks(); }, 800);
  }

  try {
    if (window.location.hostname.includes("calendly.com")) {
      calendlyStatus = await fillCalendlyFieldsDirect(data);
    } else {
      const iframe = document.querySelector('iframe[src*="calendly.com"]');
      if (iframe) { calendlyStatus = await fillCalendlyInsideIframe(iframe, data); }
    }
  } catch (err) { calendlyStatus = err.message; }

  return `Native Form: ${nativeFormStatus} | Calendly: ${calendlyStatus}`;
}

function triggerSchedulerButtonClicks() {
  if (window.location.hostname.includes("calendly.com") || window.schedulerButtonClicked) return;

  const buttons = document.querySelectorAll('a[href], button, [role="button"]');
  for (const btn of buttons) {
    const text = (btn.innerText || btn.textContent || "").trim().toLowerCase();
    const href = (btn.href || btn.getAttribute("href") || "").trim().toLowerCase();

    if (!btn.offsetParent) continue;
    if (href.includes("/login") || href.includes("/signup") || href.includes("/dashboard")) continue;

    const isCalendlyLink = href.includes("calendly.com");
    const isBookingButton = text.includes("schedule") || text.includes("book a call") || text.includes("book demo") || text.includes("consultation");

    if (!isCalendlyLink && !isBookingButton) continue;

    window.schedulerButtonClicked = true;
    
    // 🔥 FIX: Agar Calendly link hai toh forcefully naye tab par bhejo target="_blank" set karke
    if (isCalendlyLink) {
      btn.setAttribute('target', '_blank');
    } else {
      btn.setAttribute('target', '_self');
    }
    
    console.log("[Engine] Clicking element cleanly.");
    realClick(btn);
    break;
  }
}

async function fillStandardFormFields(data) {
  const inputs = {
    name: document.querySelector(DOM_SELECTORS.name),
    email: document.querySelector(DOM_SELECTORS.email),
    message: document.querySelector(DOM_SELECTORS.message)
  };

  let filledSomething = false;
  const simulateTyping = (el, val) => {
    if (!el || !val) return;
    el.focus(); el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur(); filledSomething = true;
  };

  simulateTyping(inputs.name, data.name);
  simulateTyping(inputs.email, data.email);
  simulateTyping(inputs.message, data.message);

  if (filledSomething) {
    setTimeout(() => {
      const submitBtn = document.querySelector(DOM_SELECTORS.submit);
      if (submitBtn) { realClick(submitBtn); }
      else {
        const fallbackForm = inputs.email ? inputs.email.closest('form') : document.querySelector('form');
        if (fallbackForm && fallbackForm.isConnected) { 
          fallbackForm.requestSubmit ? fallbackForm.requestSubmit() : fallbackForm.submit(); 
        }
      }
      setTimeout(() => { resetAutomation(); chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" }); }, 3000);
    }, 1500);
    return "Form details populated and Auto-Submitted.";
  }
  throw new Error("No fillable native inputs detected.");
}

async function fillCalendlyInsideIframe(iframe, data) {
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    if (!iframeDocument) return "Calendly iframe secured by cross-origin policies.";
    return await fillCalendlyDOM(iframeDocument, data);
  } catch (e) {
    setupCalendlyIframeObserver(iframe, data);
    return "Calendly tracking injected into Iframe.";
  }
}

async function fillCalendlyFieldsDirect(data) {
  return await fillCalendlyDOM(document, data);
}

async function fillCalendlyDOM(docContext, data) {
  if (window.calendlyFormFilled) return "Calendly already completed.";

  let isTimePanelOpen = docContext.querySelector('[data-testid="slot-button"], [data-component="time-slots"], [data-component="spot-list"] button, button[aria-label*="select time" i], button[data-selenium-slot], button[aria-label*="am"], button[aria-label*="pm"]');

  if (!isTimePanelOpen && !window.dateClicked) {
    const dateButtons = [
      ...docContext.querySelectorAll('button[aria-label*="Available"], button[data-calendar-date], [role="gridcell"] button')
    ].filter(btn => {
      const txt = (btn.getAttribute("aria-label") || btn.innerText || "").toLowerCase();
      const isCcDisabled = btn.disabled ||
        btn.getAttribute("aria-disabled") === "true" ||
        btn.classList.contains("disabled") ||
        txt.includes("unavailable");
      return !isCcDisabled && btn.offsetParent !== null;
    });

    if (dateButtons.length) {
      window.dateClicked = true;
      const targetDate = dateButtons[0];
      realClick(targetDate);
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  const nextConfirmBtn = [...docContext.querySelectorAll("button")].find(btn => {
    const btnText = (btn.innerText || btn.textContent || "").toLowerCase();
    return btnText.includes("next") || btnText.includes("confirm");
  });

  if (nextConfirmBtn) {
    realClick(nextConfirmBtn);
    await new Promise(r => setTimeout(r, 2500)); 
  } else {
    const timeSlots = [
      ...docContext.querySelectorAll('[data-testid="slot-button"], [data-component="time-slots"] button, [data-component="spot-list"] button, button[aria-label*="select time" i], button[data-selenium-slot], button[aria-label*="am" i], button[aria-label*="pm" i]')
    ].filter(slot => !slot.disabled && slot.getAttribute("aria-disabled") !== "true" && slot.offsetParent !== null);

    if (timeSlots.length) {
      realClick(timeSlots[0]);

      const dynamicNextBtn = [...docContext.querySelectorAll("button")].find(b => {
        const btnText = (b.innerText || b.textContent || "").toLowerCase();
        return btnText.includes("next") ||
          btnText.includes("confirm") ||
          btnText.includes("select") ||
          b.getAttribute("data-testid") === "select-button" ||
          b.getAttribute("aria-label")?.toLowerCase().includes("next");
      });

      if (dynamicNextBtn) {
        realClick(dynamicNextBtn);
        await new Promise(r => setTimeout(r, 2500));
      }
    }
  }

  const reactType = (el, value) => {
    if (!el || !value) return false;
    const nativeSetter = Object.getOwnPropertyDescriptor(el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value")?.set;
    el.focus();
    nativeSetter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
    return true;
  };

  const nameInput = docContext.querySelector('input[name="name"], input[autocomplete="name"], input[id*="name" i], input[type="text"]');
  const emailInput = docContext.querySelector('input[type="email"], input[name="email"], input[id*="email" i]');
  const notesInput = docContext.querySelector('textarea');

  let filled = false;
  if (nameInput) { reactType(nameInput, data.name); filled = true; }
  if (emailInput) { reactType(emailInput, data.email); filled = true; }
  if (notesInput) { reactType(notesInput, data.message); }

  if (!filled) {
    setupCalendlyObserver(docContext, data);
    return "Waiting for final form layout to mount...";
  }

  window.calendlyFormFilled = true;

  setTimeout(() => {
    const finalScheduleBtn = [...docContext.querySelectorAll("button")].find(btn => {
      const text = (btn.innerText || btn.textContent || "").toLowerCase();
      return text.includes("schedule event") ||
        text.includes("schedule") ||
        text.includes("confirm") ||
        text.includes("book");
    });

    if (finalScheduleBtn) {
      realClick(finalScheduleBtn);
      setTimeout(() => {
        resetAutomation();
        chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" });
      }, 2500);
    }
  }, 1000);

  return "Calendly Workflow Executed Cleanly.";
}

function setupCalendlyObserver(docContext, data) {
  if (window.calendlyObserverRunning) return;
  window.calendlyObserverRunning = true;

  const observer = new MutationObserver(() => {
    if (window.calendlyFormFilled) { observer.disconnect(); return; }
    const nameInput = docContext.querySelector('input[name="name"], input[type="email"]');
    if (nameInput) {
      observer.disconnect();
      window.calendlyObserverRunning = false;
      fillCalendlyDOM(docContext, data);
    }
  });
  observer.observe(docContext.body, { childList: true, subtree: true });
}

function setupCalendlyIframeObserver(iframe, data) {
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
        fillCalendlyDOM(iframeDoc, data);
      }
    } catch (err) {}
  }, 1000);
}

function resetAutomation() {
  window.schedulerButtonClicked = false;
  window.calendlyObserverRunning = false;
  window.calendlyIframeWatcherRunning = false;
  window.calendlyFormFilled = false;
  window.dateClicked = false;
  sessionStorage.removeItem("redirectedURL");
}