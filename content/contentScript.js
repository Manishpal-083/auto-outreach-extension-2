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
        globalLeadData = request.payload;
        startGlobalMutationObserver();
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

  // Query every interactive element: anchor, button, role=button, role=menuitem
  const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="menuitem"], .btn, .button'));
  const scoredCandidates = [];

  for (const el of candidates) {
    const href = el.tagName.toLowerCase() === 'a' ? (el.href || '').trim() : '';
    // Skip matching current page URLs or previously attempted redirect URLs
    if (href && (href === currentUrl || href.startsWith(currentUrl + '#') || (redirectedUrl && redirectedUrl === href))) {
      continue;
    }

    const score = scoreNavigationElement(el);
    if (score > 0) {
      scoredCandidates.push({
        element: el,
        score: score,
        href: href,
        text: (el.innerText || el.textContent || '').trim()
      });
    }
  }

  // Rank all possible destinations
  scoredCandidates.sort((a, b) => b.score - a.score);

  if (scoredCandidates.length > 0) {
    const topCandidate = scoredCandidates[0];
    const el = topCandidate.element;
    const href = topCandidate.href;
    const text = topCandidate.text;
    const isCalendly = href.includes("calendly.com") || text.toLowerCase().includes("calendly");

    sessionStorage.setItem("redirectedURL", href || text);

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
      realClick(el);
      return `Clicked top-ranked interactive navigation button: "${text}" (Score: ${topCandidate.score})`;
    }
  }

  if (document.querySelector("form") || document.querySelector("textarea") || document.querySelector('input[type="email"]')) {
    chrome.runtime.sendMessage({ action: "UPDATE_STAGE", stage: "FILLING_FORM" });
    return "Native form structure detected.";
  }

  throw new Error("No Contact Page Found.");
}

function getLevenshteinDistance(a, b) {
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
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(text, keyword) {
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
        const dist = getLevenshteinDistance(textWord, kwWord);
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

function scoreNavigationElement(el) {
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
    const similarity = fuzzyMatch(text, kw);
    if (similarity > 0) {
      score += wt * similarity * (text === kw ? 2.0 : 1.0);
    }
  }

  if (href) {
    if (href.includes('calendly.com')) {
      score += 25;
    }
    for (const [kw, wt] of Object.entries(keywords)) {
      const similarity = fuzzyMatch(href, kw);
      if (similarity > 0) {
        score += wt * similarity * 0.8;
      }
    }
  }

  for (const [kw, wt] of Object.entries(keywords)) {
    const similarity = fuzzyMatch(ariaLabel || titleAttr, kw);
    if (similarity > 0) {
      score += wt * similarity * 0.6;
    }
  }

  for (const [kw, wt] of Object.entries(keywords)) {
    const cleanKw = kw.replace(/\s+/g, '-');
    const similarity = fuzzyMatch(idAttr || classList, cleanKw);
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

let FormDetector = null;
let AutofillEngine = null;
let CalendlyHandler = null;
let MultiStepNavigationEngine = null;

let filledElements = new WeakSet();
let observerActive = false;
let globalLeadData = null;

function startGlobalMutationObserver() {
  if (observerActive) return;
  observerActive = true;

  console.log("[Outreach Engine] Starting global MutationObserver for dynamic forms...");

  const checkAndAutofill = async () => {
    if (!globalLeadData) return;

    await loadModules();
    if (!FormDetector || !AutofillEngine) return;

    const detected = FormDetector.detectFields();
    let filledSomething = false;

    const fieldsToFill = ['name', 'email', 'message', 'phone', 'company', 'subject'];
    
    for (const field of fieldsToFill) {
      const match = detected[field];
      const val = globalLeadData[field];
      
      if (match && match.element && val) {
        const el = match.element;
        
        if (filledElements.has(el) || document.activeElement === el) {
          continue;
        }

        console.log(`[Outreach Engine] Dynamic Form Event: Autofilling "${field}" (Confidence: ${match.confidence})`);
        AutofillEngine.fillInput(el, val);
        filledElements.add(el);
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

async function loadModules() {
  if (FormDetector && AutofillEngine && CalendlyHandler && MultiStepNavigationEngine) return;
  try {
    const formDetectorUrl = chrome.runtime.getURL("modules/formDetector.js");
    const autofillEngineUrl = chrome.runtime.getURL("modules/autofillEngine.js");
    const calendlyHandlerUrl = chrome.runtime.getURL("modules/calendlyHandler.js");
    const navigationEngineUrl = chrome.runtime.getURL("modules/multiStepNavigationEngine.js");
    const [fdMod, aeMod, chMod, neMod] = await Promise.all([
      import(formDetectorUrl),
      import(autofillEngineUrl),
      import(calendlyHandlerUrl),
      import(navigationEngineUrl)
    ]);
    FormDetector = fdMod.FormDetector;
    AutofillEngine = aeMod.AutofillEngine;
    CalendlyHandler = chMod.CalendlyHandler;
    MultiStepNavigationEngine = neMod.MultiStepNavigationEngine;
    console.log("[Outreach Engine] Smart modules imported dynamically.");
  } catch (e) {
    console.error("[Outreach Engine] Dynamic import error: ", e);
  }
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
    await loadModules();
    const detected = FormDetector ? FormDetector.detectFields() : null;
    const hasNativeForm = detected ? (detected.name.element || detected.email.element || detected.message.element) : null;
    
    if (hasNativeForm) {
      nativeFormStatus = await fillStandardFormFields(data);
    } else {
      const hasPotentiallyDynamicForm = document.querySelector("form") || document.querySelector("input") || document.querySelector("textarea") || document.querySelector('[role="textbox"]') || document.querySelector('[contenteditable]');
      if (hasPotentiallyDynamicForm) {
        nativeFormStatus = await waitForAndFillStandardFields(data);
      } else if (MultiStepNavigationEngine) {
        console.log("[Outreach Engine] No forms found. Initiating Multi-Step Navigation Engine...");
        nativeFormStatus = MultiStepNavigationEngine.run(document, data);
      }
    }
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
    const score = scoreNavigationElement(btn);
    const isBookingButton = score > 0;

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
  await loadModules();

  if (!FormDetector || !AutofillEngine) {
    console.warn("[Outreach Engine] Fallback form filling active.");
    return await fillStandardFormFieldsFallback(data);
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
    subject: { element: detected.subject.element, score: detected.subject.score, confidence: detected.subject.confidence }
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
  if (detected.subject.element && data.subject && detected.subject.confidence > 0.2) {
    AutofillEngine.fillInput(detected.subject.element, data.subject);
    filledSomething = true;
  }

  if (filledSomething) {
    setTimeout(() => {
      const submitBtn = document.querySelector(DOM_SELECTORS.submit);
      if (submitBtn) { realClick(submitBtn); }
      else {
        const matchedEl = detected.email.element || detected.name.element || detected.message.element;
        const fallbackForm = matchedEl ? matchedEl.closest('form') : document.querySelector('form');
        if (fallbackForm && fallbackForm.isConnected) { 
          fallbackForm.requestSubmit ? fallbackForm.requestSubmit() : fallbackForm.submit(); 
        }
      }
      setTimeout(() => { resetAutomation(); chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE_SUCCESS" }); }, 3000);
    }, 1500);
    const scoresStatus = `Name: ${detected.name.confidence} Conf, Email: ${detected.email.confidence} Conf, Msg: ${detected.message.confidence} Conf`;
    return `Form details populated and Auto-Submitted. (${scoresStatus})`;
  }
  throw new Error("No fillable native inputs detected.");
}

async function fillStandardFormFieldsFallback(data) {
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

async function waitForAndFillStandardFields(data) {
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
          
          const result = await fillStandardFormFields(data);
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
  await loadModules();
  if (CalendlyHandler) {
    return CalendlyHandler.automate(docContext, data);
  }

  // Basic fallback
  console.warn("[Outreach Engine] CalendlyHandler not available. Falling back...");
  const emailInput = docContext.querySelector('input[type="email"]');
  if (emailInput) {
    emailInput.value = data.email;
    return "Fallback filled email.";
  }
  return "No Calendly Handler loaded.";
}
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
  globalLeadData = null;
  filledElements = new WeakSet();
}