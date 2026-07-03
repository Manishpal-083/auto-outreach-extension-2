// modules/domUtils.js

export class DOMUtils {
  static realClick(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      el.click();
      console.log("[Engine] Click dispatched cleanly.");
    } catch (err) {
      console.error("[Engine] Click failed:", err);
    }
  }

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
}
