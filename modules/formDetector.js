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
        medium: ['site', 'employer']
      },
      website: {
        strong: ['website', 'url', 'site', 'domain', 'web-page', 'webpage'],
        medium: ['link', 'online', 'page']
      },
      budget: {
        strong: ['budget', 'price', 'cost', 'spend', 'amount', 'investment', 'range', 'revenue', 'funding'],
        medium: ['tier']
      },
      service: {
        strong: ['service', 'interest', 'product', 'solution', 'request', 'package', 'needs', 'requirement'],
        medium: ['type', 'category', 'option']
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
   * Performs recursive Shadow DOM traversal following:
   * document -> shadowRoot -> nested shadowRoot -> forms -> inputs
   * Returns a merged list of discovered input elements.
   */
  static traverseShadowDOM(root = (typeof document !== 'undefined' ? document : null)) {
    const inputs = [];
    const forms = [];
    const orphanInputs = [];

    function findFormsAndInputs(node) {
      if (!node) return;

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        if (tagName === 'form') {
          forms.push(node);
        }

        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' ||
                        (node.hasAttribute('contenteditable') && node.getAttribute('contenteditable') !== 'false') ||
                        node.getAttribute('role') === 'textbox';
                        
        if (isInput) {
          orphanInputs.push(node);
        }

        if (node.shadowRoot) {
          findFormsAndInputs(node.shadowRoot);
        }

        if (tagName === 'iframe') {
          try {
            const iframeDoc = node.contentDocument || node.contentWindow.document;
            if (iframeDoc) {
              findFormsAndInputs(iframeDoc);
            }
          } catch (e) {}
        }
      }

      let child = node.firstChild;
      while (child) {
        findFormsAndInputs(child);
        child = child.nextSibling;
      }
    }

    findFormsAndInputs(root);

    if (forms.length > 0) {
      forms.forEach(form => {
        function collectInputs(subNode) {
          if (!subNode) return;
          if (subNode.nodeType === Node.ELEMENT_NODE) {
            const tagName = subNode.tagName.toLowerCase();
            const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' ||
                            (subNode.hasAttribute('contenteditable') && subNode.getAttribute('contenteditable') !== 'false') ||
                            subNode.getAttribute('role') === 'textbox';
            if (isInput && !inputs.includes(subNode)) {
              inputs.push(subNode);
            }
            if (subNode.shadowRoot) {
              collectInputs(subNode.shadowRoot);
            }
          }
          let child = subNode.firstChild;
          while (child) {
            collectInputs(child);
            child = child.nextSibling;
          }
        }
        collectInputs(form);
      });
    }

    const merged = inputs.length > 0 ? inputs : orphanInputs;
    
    return merged.filter(el => {
      if (el.tagName.toLowerCase() === 'input') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return !['submit', 'button', 'image', 'radio', 'checkbox', 'file', 'reset'].includes(type);
      }
      return true;
    });
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
   * Helper function to extract direct parent text contents excluding the element itself
   */
  static getParentText(el) {
    const parent = el.parentElement;
    if (!parent) return '';
    const childTexts = [];
    for (const node of parent.childNodes) {
      if (node !== el && node.nodeType === Node.TEXT_NODE) {
        childTexts.push(node.textContent.trim());
      }
    }
    return childTexts.join(' ').trim();
  }

  /**
   * Helper function to extract nearby text surrounding the element
   */
  static getNearbyText(el) {
    const texts = [];
    let siblingBefore = el.previousElementSibling;
    let count = 0;
    while (siblingBefore && count < 2) {
      const txt = (siblingBefore.innerText || siblingBefore.textContent || '').trim();
      if (txt) {
        texts.push(txt);
        count++;
      }
      siblingBefore = siblingBefore.previousElementSibling;
    }
    let siblingAfter = el.nextElementSibling;
    count = 0;
    while (siblingAfter && count < 2) {
      const txt = (siblingAfter.innerText || siblingAfter.textContent || '').trim();
      if (txt) {
        texts.push(txt);
        count++;
      }
      siblingAfter = siblingAfter.nextElementSibling;
    }
    return texts.join(' ');
  }

  /**
   * Helper function to find the nearest preceding heading/legend section title
   */
  static getSectionHeading(el) {
    let curr = el;
    const bodyNode = typeof document !== 'undefined' ? document.body : null;
    while (curr && curr !== bodyNode) {
      let sibling = curr.previousElementSibling;
      while (sibling) {
        const tag = sibling.tagName.toLowerCase();
        if (/h[1-6]|legend/i.test(tag) || sibling.getAttribute('role') === 'heading') {
          return (sibling.innerText || sibling.textContent || '').trim();
        }
        const headerInside = typeof sibling.querySelector === 'function' ? sibling.querySelector('h1, h2, h3, h4, h5, h6, legend, [role="heading"]') : null;
        if (headerInside) {
          return (headerInside.innerText || headerInside.textContent || '').trim();
        }
        sibling = sibling.previousElementSibling;
      }
      curr = curr.parentElement;
    }
    return '';
  }

  /**
   * Performs weighted heuristic classification for an element.
   * Collects: label, placeholder, aria, id, name, nearby text, parent text, section heading.
   * Returns: Name, Email, Phone, Company, Website, Budget, Service, Message, Unknown
   */
  static classifyElement(el) {
    const metadata = {
      label: this.getLabelText(el) || '',
      placeholder: el.getAttribute('placeholder') || '',
      aria: el.getAttribute('aria-label') || '',
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
      testid: el.getAttribute('data-testid') || '',
      dataname: el.getAttribute('data-name') || '',
      classlist: el.className || '',
      vmodel: el.getAttribute('v-model') || el.getAttribute(':value') || '',
      angularmodel: el.getAttribute('formcontrolname') || el.getAttribute('ng-model') || el.getAttribute('ng-reflect-name') || '',
      nearbyText: this.getNearbyText(el) || '',
      parentText: this.getParentText(el) || '',
      sectionHeading: this.getSectionHeading(el) || ''
    };

    const targetFields = ['name', 'email', 'phone', 'company', 'website', 'budget', 'service', 'message'];
    const scores = {};
    let highestScore = 0;
    let bestField = 'unknown';

    const weights = {
      label: 9,
      name: 10,
      id: 7,
      placeholder: 8,
      aria: 8,
      autocomplete: 10,
      testid: 8,
      dataname: 8,
      classlist: 5,
      vmodel: 8,
      angularmodel: 8,
      sectionHeading: 8,
      parentText: 6,
      nearbyText: 6
    };

    for (const field of targetFields) {
      let fieldScore = 0;
      
      for (const [metaKey, metaVal] of Object.entries(metadata)) {
        if (!metaVal) continue;
        const matchFactor = this.evaluateText(metaVal, field);
        if (matchFactor > 0) {
          fieldScore += matchFactor * (weights[metaKey] || 1.0);
        }
      }

      // Special direct type enhancements
      const tagName = el.tagName.toLowerCase();
      const typeAttr = (el.getAttribute('type') || '').toLowerCase();
      if (field === 'email' && typeAttr === 'email') fieldScore += 15;
      if (field === 'phone' && typeAttr === 'tel') fieldScore += 15;
      if (field === 'message' && tagName === 'textarea') fieldScore += 12;

      // Role-textbox and contenteditable checks
      const roleAttr = el.getAttribute('role');
      const isContentEditable = el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') !== 'false';
      if (roleAttr === 'textbox' || isContentEditable) {
        if (field === 'message') fieldScore += 5;
        else fieldScore += 2;
      }

      scores[field] = fieldScore;
      if (fieldScore > highestScore) {
        highestScore = fieldScore;
        bestField = field;
      }
    }

    if (highestScore < 2) {
      bestField = 'unknown';
    }

    return {
      classification: bestField,
      score: highestScore,
      scores: scores,
      metadata: metadata
    };
  }

  /**
   * Scores a candidate element against a target field (backward compatibility wrapper)
   */
  static scoreElement(el, targetField) {
    const res = this.classifyElement(el);
    return res.scores[targetField] || 0;
  }

  /**
   * Scans the document recursively and resolves matching fields.
   * Returns a map of target fields with matched element, raw score, and normalized confidence.
   */
  static detectFields(root = (typeof document !== 'undefined' ? document : null)) {
    const candidates = this.getCandidates(root);
    const targetFields = ['name', 'email', 'phone', 'company', 'website', 'budget', 'service', 'message'];
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
      website: detected.website?.element || null,
      budget: detected.budget?.element || null,
      service: detected.service?.element || null
    };
  }
}