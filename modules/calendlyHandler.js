// modules/calendlyHandler.js
export class CalendlyHandler {
  static isCalendlyContext() {
    return window.location.href.includes("calendly.com");
  }

  static getAvailableSlots() {
    return document.querySelectorAll('button[data-selenium="calendar-day"]:not([disabled])');
  }
}