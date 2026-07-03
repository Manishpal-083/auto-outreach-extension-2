// modules/formDetector.js
export class FormDetector {
  static getInputs() {
    return {
      name: document.querySelector('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]'),
      email: document.querySelector('input[type="email" i], input[name*="email" i]'),
      message: document.querySelector('textarea[name*="message" i], textarea[id*="message" i]')
    };
  }
}