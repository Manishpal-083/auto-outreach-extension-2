// modules/autofillEngine.js
export class AutofillEngine {
  static fillInput(element, value) {
    if (!element) return;
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.blur();
  }
}