// utils/selectors.js

export const FORM_SELECTORS = {
  // Fields detection using robust modern matching attributes
  inputs: {
    name: 'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i], input[type="text"][autocomplete*="name" i]',
    email: 'input[type="email" i], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i]',
    phone: 'input[type="tel" i], input[name*="phone" i], input[name*="tel" i], input[id*="phone" i]',
    company: 'input[name*="company" i], input[id*="company" i], input[name*="org" i]',
    subject: 'input[name*="subject" i], input[id*="subject" i], input[placeholder*="subject" i]',
    message: 'textarea[name*="message" i], textarea[id*="message" i], textarea[placeholder*="message" i], textarea[name*="comment" i]'
  },
  // Form submission triggers
  submit: 'button[type="submit"], input[type="submit"], form button, .submit-btn, button:has(span:contains("Submit"))',
  
  // Navigation pointers to find contact pages dynamically
  contactLinks: [
    'a[href*="contact" i]',
    'a[href*="get-in-touch" i]',
    'a[href*="reach-out" i]',
    'a[href*="support" i]',
    'a[href*="connect" i]'
  ]
};

export const CALENDLY_SELECTORS = {
  // Target tokens for iframe detection and slot navigation
  iframeAttribute: 'src*="calendly.com"',
  dateTile: 'button[data-selenium="calendar-day"]:not([disabled]), [data-component="day"]:not([disabled])',
  timeSlot: 'button[data-selenium="time-slot"], [data-component="time-slot"]',
  confirmBtn: 'button:has(span:contains("Next")), button:has(span:contains("Confirm")), .calendly-confirm-button'
};