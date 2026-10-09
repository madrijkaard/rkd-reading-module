// Runs inside the sandboxed page (opaque origin), before any page script. It is serialized with
// Function.prototype.toString, so it must not reference anything outside its own body.
function htmlBridge(nonce, maxTextLength) {
  document.currentScript?.remove();
  const parentWindow = window.parent;
  const send = window.parent.postMessage.bind(window.parent);
  const closest = Element.prototype.closest;
  const getAttribute = Element.prototype.getAttribute;
  const getSelection = window.getSelection.bind(window);
  const setTimer = window.setTimeout.bind(window);
  const UrlConstructor = URL;
  const post = (type, payload = {}) => send({ ...payload, rkdBridge: 1, nonce, type }, '*');

  const memoryStorage = () => {
    const values = new Map();
    return {
      getItem: (key) => (values.has(String(key)) ? values.get(String(key)) : null),
      setItem: (key, value) => { values.set(String(key), String(value)); },
      removeItem: (key) => { values.delete(String(key)); },
      clear: () => values.clear(),
      key: (index) => [...values.keys()][index] ?? null,
      get length() { return values.size; },
    };
  };
  try {
    void window.localStorage;
  } catch {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage(), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: memoryStorage(), configurable: true });
  }
  try {
    void document.cookie;
  } catch {
    const jar = new Map();
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
      set: (cookie) => {
        const [pair] = String(cookie).split(';');
        const separator = pair.indexOf('=');
        if (separator > 0) jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
      },
    });
  }

  document.addEventListener('click', (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const anchor = closest.call(event.target, 'a[href], area[href]');
    if (!anchor) return;
    const href = String(getAttribute.call(anchor, 'href')).trim();
    if (/^javascript:/i.test(href)) return;
    event.preventDefault();
    if (href.startsWith('#')) {
      let id = href.slice(1);
      try { id = decodeURIComponent(id); } catch { /* keep raw id */ }
      const target = id ? document.getElementById(id) || document.getElementsByName(id)[0] : document.documentElement;
      target?.scrollIntoView({ block: 'start' });
      return;
    }
    try {
      const url = new UrlConstructor(href);
      if (url.protocol === 'http:' || url.protocol === 'https:') post('open-external', { url: url.href });
    } catch { /* relative, file: or invalid links do nothing */ }
  }, true);

  window.addEventListener('submit', (event) => event.preventDefault());

  document.addEventListener('dblclick', (event) => {
    if (!event.isTrusted) return;
    setTimer(() => {
      const text = String(getSelection() || '').trim();
      if (text) post('select-text', { text: text.slice(0, 200) });
    }, 0);
  });

  const sendText = () => post('ready', { text: String(document.body?.innerText || '').slice(0, maxTextLength) });
  window.addEventListener('load', () => {
    sendText();
    setTimer(sendText, 1000);
  });

  const SKIPPED_PARENTS = 'script, style, textarea, title, template';
  const clearHighlight = () => document.querySelectorAll('mark[data-rkd-highlight]').forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize();
  });
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (event.source !== parentWindow || !data || data.rkdBridge !== 1 || data.type !== 'highlight') return;
    clearHighlight();
    const query = String(data.query || '').slice(0, 200);
    let count = 0;
    if (query && document.body) {
      if (!document.getElementById('rkd-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'rkd-highlight-style';
        style.textContent = 'mark[data-rkd-highlight]{background:#b8efb8!important;color:inherit!important;padding:0 2px;border-radius:2px}';
        (document.head || document.documentElement).append(style);
      }
      const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement?.closest(SKIPPED_PARENTS)) continue;
        pattern.lastIndex = 0;
        if (pattern.test(node.nodeValue)) nodes.push(node);
      }
      for (const node of nodes) {
        const fragment = document.createDocumentFragment();
        const text = node.nodeValue;
        let lastIndex = 0;
        for (const match of text.matchAll(pattern)) {
          if (!match[0]) continue;
          fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
          const mark = document.createElement('mark');
          mark.className = 'content-highlight';
          mark.setAttribute('data-rkd-highlight', '');
          mark.textContent = match[0];
          fragment.append(mark);
          count += 1;
          lastIndex = match.index + match[0].length;
        }
        fragment.append(document.createTextNode(text.slice(lastIndex)));
        node.replaceWith(fragment);
      }
    }
    post('highlight-result', { count });
  });
}

export function injectHtmlBridgeUseCase({ html, nonce, maxTextLength }) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const script = parsed.createElement('script');
  script.textContent = `(${htmlBridge.toString()})(${JSON.stringify(nonce)}, ${Number(maxTextLength)});`;
  const cspMeta = parsed.head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
  if (cspMeta) cspMeta.after(script);
  else parsed.head.prepend(script);

  const { doctype } = parsed;
  let doctypeText = '';
  if (doctype) {
    doctypeText = `<!DOCTYPE ${doctype.name}`;
    if (doctype.publicId) doctypeText += ` PUBLIC "${doctype.publicId}"`;
    if (doctype.systemId) doctypeText += `${doctype.publicId ? '' : ' SYSTEM'} "${doctype.systemId}"`;
    doctypeText += '>';
  }
  return `${doctypeText}${parsed.documentElement.outerHTML}`;
}
