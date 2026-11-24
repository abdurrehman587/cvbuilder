const BOLD_CLASS = 'cv-user-bold';

let boldPersistenceInstalled = false;

export function installBoldPhrasePersistence() {
  if (boldPersistenceInstalled || typeof localStorage === 'undefined') return;
  try {
    const nativeSetItem = localStorage.setItem.bind(localStorage);
    const nativeGetItem = localStorage.getItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === 'cvFormData' && typeof value === 'string') {
        try {
          const data = JSON.parse(value);
          if (data && typeof data === 'object') {
            const previousRaw = nativeGetItem('cvFormData');
            const previous = previousRaw ? JSON.parse(previousRaw) : null;
            const sameCv = !previous?.name || !data.name || previous.name === data.name;
            const hasList = Object.prototype.hasOwnProperty.call(data, 'boldPhrases') && Array.isArray(data.boldPhrases);
            if (!hasList && sameCv && Array.isArray(previous?.boldPhrases)) {
              data.boldPhrases = previous.boldPhrases;
              value = JSON.stringify(data);
            }
          }
        } catch (error) {
          // Keep the original value when it is not CV JSON.
        }
      }
      nativeSetItem(key, value);
    };
    boldPersistenceInstalled = true;
  } catch (error) {
    boldPersistenceInstalled = false;
  }
}

export function pickBoldPhrases(primary, fallback) {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  if (Array.isArray(primary)) return primary;
  if (Array.isArray(fallback)) return fallback;
  return [];
}

function phraseList(phrases) {
  return [...new Set((phrases || []).map((phrase) => String(phrase).trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
}

function isSkipped(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('button, script, style, textarea, input'));
}

export function clearUserBold(root) {
  if (!root) return;
  root.querySelectorAll(`strong.${BOLD_CLASS}`).forEach((element) => {
    const text = document.createTextNode(element.textContent || '');
    element.replaceWith(text);
  });
  root.normalize();
}

function wrapPhrase(root, phrase) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const matches = [];
  let current = walker.nextNode();
  while (current) {
    if (
      current.nodeValue &&
      current.nodeValue.includes(phrase) &&
      !isSkipped(current) &&
      !current.parentElement.closest(`strong.${BOLD_CLASS}`)
    ) {
      matches.push(current);
    }
    current = walker.nextNode();
  }

  matches.forEach((node) => {
    const value = node.nodeValue || '';
    const fragment = document.createDocumentFragment();
    let start = 0;
    let index = value.indexOf(phrase);
    while (index !== -1) {
      if (index > start) {
        fragment.appendChild(document.createTextNode(value.slice(start, index)));
      }
      const strong = document.createElement('strong');
      strong.className = BOLD_CLASS;
      strong.textContent = phrase;
      fragment.appendChild(strong);
      start = index + phrase.length;
      index = value.indexOf(phrase, start);
    }
    if (start < value.length) {
      fragment.appendChild(document.createTextNode(value.slice(start)));
    }
    if (node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  });
}

export function applyBoldPhrases(root, phrases) {
  if (!root) return;
  clearUserBold(root);
  phraseList(phrases).forEach((phrase) => wrapPhrase(root, phrase));
}

export function selectionInPreview(root, phrases) {
  if (!root) return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const anchor = range.commonAncestorContainer.nodeType === 1
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const boldParent = anchor?.closest(`strong.${BOLD_CLASS}`);
  const raw = boldParent ? boldParent.textContent : selection.toString();
  if (raw && raw.includes('\n')) return { text: '', multiline: true };
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const listed = phraseList(phrases);
  return {
    text,
    alreadyBold: Boolean(boldParent) || listed.includes(text),
  };
}
