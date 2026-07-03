// modules/websiteScanner.js

export class WebsiteScanner {
  /**
   * Discovers all DOM nodes recursively, including open shadow roots and same-origin iframe documents.
   */
  static getAllElements(root = (typeof document !== 'undefined' ? document : null)) {
    const elements = [];
    if (!root) return elements;

    function traverse(node) {
      if (!node) return;

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
      
      // Standard input fields
      if (tagName === 'input') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        // Skip non-textual input types
        return !['submit', 'button', 'image', 'radio', 'checkbox', 'file', 'reset'].includes(type);
      }

      // Textareas and Select fields
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

  static scan(root = document) {
    const { FormDetector } = import('./formDetector.js');
    return FormDetector.detectFields(root);
  }
}