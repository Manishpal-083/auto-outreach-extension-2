// utils/constants.js

export const PIPELINE_ACTIONS = {
  START_AUTOMATION: "START_AUTOMATION",
  EXECUTE_DOM_AUTOMATION: "EXECUTE_DOM_AUTOMATION",

  LOG_MESSAGE: "LOG_MESSAGE",
  UPDATE_STATUS: "UPDATE_STATUS",

  EXECUTION_COMPLETE: "EXECUTION_COMPLETE",
  EXECUTION_FAILED: "EXECUTION_FAILED"
};

export const STORAGE_KEYS = {
  USER_SETTINGS: "outreach_engine_settings"
};

export const CONTACT_KEYWORDS = [
  "contact",
  "contact us",
  "contact-us",
  "get in touch",
  "talk to us",
  "talk",
  "support",
  "sales",
  "book demo",
  "demo",
  "enquiry",
  "inquiry",
  "help"
];

export const FORM_SELECTORS = {
  name: [
    'input[name*="name" i]',
    'input[id*="name" i]',
    'input[placeholder*="name" i]',
    'input[autocomplete="name"]'
  ],

  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[placeholder*="email" i]'
  ],

  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]',
    'input[id*="phone" i]'
  ],

  company: [
    'input[name*="company" i]',
    'input[id*="company" i]'
  ],

  message: [
    'textarea',
    'textarea[name*="message" i]',
    'textarea[id*="message" i]',
    'textarea[name*="comment" i]'
  ]
};