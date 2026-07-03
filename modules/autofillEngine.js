// modules/autofillEngine.js

export class AutofillEngine {
  /**
   * Safely fills values into target fields. Uses the native value setter to bypass
   * framework interceptors, updates React Fiber value trackers, and dispatches the
   * required event chain (focus, keydown, keypress, input, keyup, change, blur) in order.
   */
  static fillInput(element, value) {
    if (!element) return false;

    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    const isContentEditable = element.hasAttribute && element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') !== 'false';
    const roleAttr = element.getAttribute ? element.getAttribute('role') : null;

    // 1. Dispatch focus event and focus element
    try {
      element.focus();
    } catch (e) {}
    element.dispatchEvent(new Event('focus', { bubbles: true }));

    // 2. Set value natively (with React Fiber and dropdown support)
    if (isContentEditable || roleAttr === 'textbox') {
      // Contenteditable / role=textbox
      element.innerText = value;
    } else if (tagName === 'select') {
      // Select dropdown option matcher
      let optionToSelect = null;
      const lowerVal = value.toString().toLowerCase();
      
      for (const option of element.options) {
        if (option.value.toLowerCase().includes(lowerVal) || option.text.toLowerCase().includes(lowerVal)) {
          optionToSelect = option;
          break;
        }
      }
      
      if (!optionToSelect && element.options.length > 1) {
        optionToSelect = element.options[1] || element.options[0];
      } else if (!optionToSelect && element.options.length > 0) {
        optionToSelect = element.options[0];
      }

      if (optionToSelect) {
        element.value = optionToSelect.value;
      }
    } else {
      // Input or Textarea
      const prototype = tagName === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      
      const lastValue = element.value;

      if (valueSetter) {
        // Use native value setter
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }

      // React Fiber controlled inputs: update React's internal value tracker
      const tracker = element._valueTracker;
      if (tracker) {
        tracker.setValue(lastValue);
      }
    }

    // 3. Dispatch the exact event chain requested: keydown, keypress, input, keyup, change, blur
    const lastChar = value.length > 0 ? value[value.length - 1] : '';

    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: lastChar }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: lastChar }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: lastChar }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    try {
      element.blur();
    } catch (e) {}

    return true;
  }
}