// modules/autofillEngine.js

export class AutofillEngine {
  /**
   * Safely fills values into target fields. Handles standard inputs, textareas,
   * select dropdowns, contenteditable elements, role=textbox elements, and supports
   * React (bypassing native value tracking), Vue, and Angular event bindings.
   */
  static fillInput(element, value) {
    if (!element) return false;

    try {
      element.focus();
    } catch (e) {}

    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    const isContentEditable = element.hasAttribute && element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') !== 'false';
    const roleAttr = element.getAttribute ? element.getAttribute('role') : null;

    // 1. Contenteditable or role=textbox filling
    if (isContentEditable || roleAttr === 'textbox') {
      element.innerText = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      try {
        element.blur();
      } catch (e) {}
      return true;
    }

    // 2. Select dropdown selection
    if (tagName === 'select') {
      let optionToSelect = null;
      const lowerVal = value.toString().toLowerCase();

      // Look for a close match in option text or value
      for (const option of element.options) {
        if (option.value.toLowerCase().includes(lowerVal) || option.text.toLowerCase().includes(lowerVal)) {
          optionToSelect = option;
          break;
        }
      }

      // Fallback: select first non-placeholder option if available
      if (!optionToSelect && element.options.length > 1) {
        optionToSelect = element.options[1] || element.options[0];
      } else if (!optionToSelect && element.options.length > 0) {
        optionToSelect = element.options[0];
      }

      if (optionToSelect) {
        element.value = optionToSelect.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      try {
        element.blur();
      } catch (e) {}
      return true;
    }

    // 3. React / Vue / Angular controlled input & textarea filling
    const prototype = tagName === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter) {
      // Bypass React's value tracking mechanism
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Trigger Angular and Vue framework updates
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // Send key events for validation forms that listen to keystrokes
    const lastChar = value[value.length - 1] || '';
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: lastChar }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: lastChar }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: lastChar }));

    try {
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      element.blur();
    } catch (e) {}

    return true;
  }
}