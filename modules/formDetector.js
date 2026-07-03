// modules/formDetector.js

export class FormDetector {
  // Define keyword dictionaries for scoring target fields
  static get FIELD_KEYWORDS() {
    return {
      name: {
        strong: ['name', 'fullname', 'full-name', 'first-name', 'firstname', 'last-name', 'lastname', 'leadname', 'given-name', 'family-name'],
        medium: ['user', 'fname', 'lname', 'contact', 'profile', 'usr']
      },
      email: {
        strong: ['email', 'e-mail', 'mail', 'emailaddr', 'email-address', 'emailaddress'],
        medium: ['address', 'contact', 'recipient']
      },
      message: {
        strong: ['message', 'comment', 'desc', 'description', 'note', 'notes', 'body', 'feedback', 'help', 'details', 'inquiry', 'enquiry', 'question'],
        medium: ['text', 'textarea', 'about', 'content', 'msg']
      },
      phone: {
        strong: ['phone', 'telephone', 'mobile', 'cell', 'tel', 'phone-number', 'phonenumber', 'contact-number'],
        medium: ['number', 'contact']
      },
      company: {
        strong: ['company', 'organization', 'org', 'business', 'firm', 'workplace', 'employer'],
        medium: ['site', 'website', 'employer']
      },
      subject: {
        strong: ['subject', 'title', 'topic', 'reason', 'purpose'],
        medium: ['header', 'about']
      }
    };
  }

  /**
   * Recursively traverses standard DOM, Shadow DOM roots, and same-origin iframes
   * to find all candidate interactive elements.
   */
  static getAllElements(root = (typeof document !== 'undefined' ? document : null)) {
    const elements = [];

    function traverse(node) {
      if (!node) return;

      // Handle element nodes
      if (node.nodeType === Node.ELEMENT_NODE) {
        elements.push(node);

        // Traverse Open Shadow DOM
        if (node.shadowRoot) {
          traverse(node.shadowRoot);
        }

        // Traverse same-origin iframes
        if (node.tagName === 'IFRAME') {
          try {
            const iframeDoc = node.contentDocument || node.contentWindow.document;
            if (iframeDoc) {
              traverse(iframeDoc);
            }
          } catch (e) {
            // Ignore cross-origin iframes safely
          }
        }
      }

      // Traverse children
      let child = node.firstChild;
      while (child) {
        traverse(child);
        child = child.nextSibling;
      }
    }

    traverse(root);
    return elements;
  }

  /**
   * Filters all candidate interactive inputs from the element list
   */
  static getCandidates(root = (typeof document !== 'undefined' ? document : null)) {
    const allElements = this.getAllElements(root);
    return allElements.filter(el => {
      const tagName = el.tagName.toLowerCase();

      // Basic input types
      if (tagName === 'input') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        const ignoredTypes = ['submit', 'button', 'image', 'radio', 'checkbox', 'file', 'reset'];
        return !ignoredTypes.includes(type);
      }

      // Textareas and selects
      if (tagName === 'textarea' || tagName === 'select') {
        return true;
      }

      // Contenteditable elements
      if (el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') !== 'false') {
        return true;
      }

      // Generic textboxes
      const role = el.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox') {
        return true;
      }

      return false;
    });
  }

  /**
   * Finds any label text associated with the element
   */
  static getLabelText(el) {
    const rootNode = el.getRootNode();

    // 1. Explicit association via label[for="id"]
    if (el.id && typeof rootNode.querySelector === 'function') {
      try {
        const label = rootNode.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return label.innerText || label.textContent;
      } catch (e) {}
    }

    // 2. Implicit association (input wrapped inside a label tag)
    const parentLabel = el.closest('label');
    if (parentLabel) {
      return parentLabel.innerText || parentLabel.textContent;
    }

    // 3. Explicit association via aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy && typeof rootNode.getElementById === 'function') {
      const labelEl = rootNode.getElementById(labelledBy);
      if (labelEl) return labelEl.innerText || labelEl.textContent;
    }

    // 4. Fallback: Search preceding DOM siblings or parent container text
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName.toLowerCase() === 'label' || sibling.classList.contains('label')) {
        return sibling.innerText || sibling.textContent;
      }
      sibling = sibling.previousElementSibling;
    }

    // Check parent text (if parent text is relatively short, it's likely a form label)
    const parent = el.parentElement;
    if (parent) {
      // Get direct text contents of the parent element, excluding the input itself
      const childTexts = [];
      for (const node of parent.childNodes) {
        if (node !== el && node.nodeType === Node.TEXT_NODE) {
          childTexts.push(node.textContent.trim());
        } else if (node !== el && node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'input') {
          childTexts.push(node.innerText || node.textContent);
        }
      }
      const combinedText = childTexts.join(' ').trim();
      if (combinedText.length > 0 && combinedText.length < 80) {
        return combinedText;
      }
    }

    return null;
  }

  /**
   * Evaluates text strings against field keywords to return a match factor
   * Strong match exact = 2.0, Strong match partial = 1.0, Medium match = 0.5, No match = 0
   */
  static evaluateText(text, targetField) {
    if (!text) return 0;
    const cleanText = text.toLowerCase().trim();
    const config = this.FIELD_KEYWORDS[targetField];
    if (!config) return 0;

    // Direct exact match with strong keywords
    for (const kw of config.strong) {
      if (cleanText === kw) return 2.0;
    }

    // Exact word boundary matches or partial strong matches
    for (const kw of config.strong) {
      const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
      if (regex.test(cleanText)) return 1.5;
      if (cleanText.includes(kw)) return 1.0;
    }

    // Medium keyword match
    for (const kw of config.medium) {
      if (cleanText.includes(kw)) return 0.5;
    }

    return 0;
  }

  /**
   * Scores a candidate element against a target field using multiple selectors
   */
  static scoreElement(el, targetField) {
    let score = 0;
    const nameAttr = el.getAttribute('name');
    const idAttr = el.getAttribute('id');
    const placeholderAttr = el.getAttribute('placeholder');
    const autocompleteAttr = el.getAttribute('autocomplete');
    const ariaLabel = el.getAttribute('aria-label');
    const testId = el.getAttribute('data-testid');
    const dataName = el.getAttribute('data-name');
    const classList = el.className || '';

    // Vue binding v-model
    const vModel = el.getAttribute('v-model') || el.getAttribute(':value');
    // Angular attributes
    const formControlName = el.getAttribute('formcontrolname') || el.getAttribute('ng-model') || el.getAttribute('ng-reflect-name');

    // 1. Evaluate Name Attribute (+10 max)
    const nameMatch = this.evaluateText(nameAttr, targetField);
    score += nameMatch * 10;

    // 2. Evaluate Placeholder Attribute (+8 max)
    const placeholderMatch = this.evaluateText(placeholderAttr, targetField);
    score += placeholderMatch * 8;

    // 3. Evaluate Label Tag Mapping (+9 max)
    const labelText = this.getLabelText(el);
    const labelMatch = this.evaluateText(labelText, targetField);
    score += labelMatch * 9;

    // 4. Evaluate Aria Attribute (+8 max)
    const ariaMatch = this.evaluateText(ariaLabel, targetField);
    score += ariaMatch * 8;

    // 5. Evaluate Autocomplete Attribute (+10 max)
    const autocompleteMatch = this.evaluateText(autocompleteAttr, targetField);
    score += autocompleteMatch * 10;

    // 6. Evaluate Test ID Attribute (+8 max)
    const testIdMatch = this.evaluateText(testId, targetField);
    score += testIdMatch * 8;

    // 7. Evaluate Data-Name Attribute (+8 max)
    const dataNameMatch = this.evaluateText(dataName, targetField);
    score += dataNameMatch * 8;

    // 8. Evaluate Framework Binding Attributes (+8 max)
    const frameworkMatch = this.evaluateText(vModel || formControlName, targetField);
    score += frameworkMatch * 8;

    // 9. Evaluate ID Attribute (+7 max)
    const idMatch = this.evaluateText(idAttr, targetField);
    score += idMatch * 7;

    // 10. Evaluate Class List (+5 max)
    const classMatch = this.evaluateText(classList, targetField);
    score += classMatch * 5;

    // 11. Adjust based on Element Tag/Type Properties (Direct matching signals)
    const tagName = el.tagName.toLowerCase();
    const typeAttr = (el.getAttribute('type') || '').toLowerCase();

    if (targetField === 'email') {
      if (typeAttr === 'email') score += 15;
    } else if (targetField === 'phone') {
      if (typeAttr === 'tel') score += 15;
    } else if (targetField === 'message') {
      if (tagName === 'textarea') score += 12;
    }

    // Role-textbox check
    const roleAttr = el.getAttribute('role');
    const isContentEditable = el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') !== 'false';
    if (roleAttr === 'textbox' || isContentEditable) {
      if (targetField === 'message') score += 5;
      else score += 2;
    }

    // Visual Visibility Checks (Penalize invisible/hidden inputs, but keep React hidden inputs discoverable)
    const style = window.getComputedStyle(el);
    const isHiddenStyle = style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0;
    const isZeroSized = el.offsetWidth === 0 && el.offsetHeight === 0;
    const isHiddenType = typeAttr === 'hidden';

    if (isHiddenType) {
      score -= 5; // React hidden input penalty
    } else if (isHiddenStyle || isZeroSized) {
      score -= 8; // Element is styled invisible penalty
    }

    return score;
  }

  /**
   * Scans the document recursively and resolves matching fields.
   * Returns a map of target fields with matched element, raw score, and normalized confidence.
   */
  static detectFields(root = (typeof document !== 'undefined' ? document : null)) {
    const candidates = this.getCandidates(root);
    const targetFields = ['name', 'email', 'message', 'phone', 'company', 'subject'];
    const scoringMatrix = [];

    // Score every candidate element against all target fields
    candidates.forEach((el, index) => {
      targetFields.forEach(field => {
        const score = this.scoreElement(el, field);
        if (score > 0) {
          scoringMatrix.push({ el, field, score, index });
        }
      });
    });

    // Sort matrix by score descending
    scoringMatrix.sort((a, b) => b.score - a.score);

    // Greedy matching to avoid assigning the same element to multiple target fields
    const matches = {};
    const assignedElements = new Set();
    const assignedFields = new Set();

    for (const match of scoringMatrix) {
      if (assignedElements.has(match.el) || assignedFields.has(match.field)) {
        continue;
      }

      // Compute normalized confidence: map typical score of 30+ to 1.0
      const confidence = Math.min(1.0, parseFloat((match.score / 30).toFixed(2)));

      matches[match.field] = {
        element: match.el,
        score: match.score,
        confidence: confidence
      };

      assignedElements.add(match.el);
      assignedFields.add(match.field);
    }

    // Fill in default empty slots for missing fields
    targetFields.forEach(field => {
      if (!matches[field]) {
        matches[field] = {
          element: null,
          score: 0,
          confidence: 0.0
        };
      }
    });

    return matches;
  }

  /**
   * Helper function to get simple element objects mapping for backward compatibility
   */
  static getInputs(root = (typeof document !== 'undefined' ? document : null)) {
    const detected = this.detectFields(root);
    return {
      name: detected.name.element,
      email: detected.email.element,
      message: detected.message.element,
      phone: detected.phone.element,
      company: detected.company.element,
      subject: detected.subject.element
    };
  }
}