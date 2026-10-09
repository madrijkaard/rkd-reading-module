const MESSAGE_TYPES = new Set(['ready', 'open-external', 'select-text', 'highlight-result']);
const MAX_READY_TEXT = 2_000_000;
const MAX_URL_LENGTH = 2048;
const MAX_SELECTION = 200;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function externalHttpUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function sendHighlight(frame) {
  frame.contentWindow?.postMessage({ rkdBridge: 1, type: 'highlight', query: frame.dataset.filterQuery || '' }, '*');
}

export function renderInteractiveHtmlUseCase({ html, filterQuery, readerElement, injectBridge, createNonce, onReady, onOpenExternalRequest, onSelectText }) {
  const existing = readerElement.querySelector('.html-stage.interactive iframe.html-frame.interactive');
  if (existing && existing.rkdSourceHtml === html) {
    existing.dataset.filterQuery = filterQuery;
    if (existing.dataset.ready === '1') sendHighlight(existing);
    return { frame: existing };
  }

  const nonce = createNonce();
  readerElement.innerHTML = '<div class="document-stage html-stage interactive"><iframe class="html-frame interactive" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer" title="Documento HTML interativo"></iframe></div>';
  const stage = readerElement.querySelector('.html-stage.interactive');
  const frame = stage.querySelector('iframe');
  frame.rkdSourceHtml = html;
  frame.rkdNonce = nonce;
  frame.dataset.filterQuery = filterQuery;

  const fit = () => {
    if (!frame.isConnected) return;
    const readerStyle = getComputedStyle(readerElement);
    const padding = parseFloat(readerStyle.paddingTop) + parseFloat(readerStyle.paddingBottom);
    const stageStyle = getComputedStyle(stage);
    const zoom = parseFloat(stageStyle.zoom) || 1;
    const stagePadding = parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);
    const height = Math.max(0, Math.floor((readerElement.clientHeight - padding) / zoom - stagePadding));
    frame.style.height = `${height}px`;
  };
  let fitScheduled = false;
  const resizeObserver = new ResizeObserver(() => {
    if (!frame.isConnected) {
      resizeObserver.disconnect();
      return;
    }
    // Deferred so resizing inside the callback never triggers a ResizeObserver loop error.
    if (fitScheduled) return;
    fitScheduled = true;
    requestAnimationFrame(() => {
      fitScheduled = false;
      fit();
    });
  });
  resizeObserver.observe(readerElement);
  // The reader keeps its size when the zoom changes, but the zoomed stage does not.
  resizeObserver.observe(stage);

  const onMessage = (event) => {
    if (!frame.isConnected) {
      window.removeEventListener('message', onMessage);
      resizeObserver.disconnect();
      return;
    }
    if (event.source !== frame.contentWindow || event.origin !== 'null') return;
    const data = event.data;
    if (!isPlainObject(data) || data.rkdBridge !== 1 || data.nonce !== frame.rkdNonce || !MESSAGE_TYPES.has(data.type)) return;
    if (data.type === 'ready') {
      if (typeof data.text !== 'string' || data.text.length > MAX_READY_TEXT) return;
      frame.dataset.ready = '1';
      onReady(data.text);
      sendHighlight(frame);
      return;
    }
    if (data.type === 'open-external') {
      const url = externalHttpUrl(data.url);
      if (url && navigator.userActivation.isActive) onOpenExternalRequest(url);
      return;
    }
    if (data.type === 'select-text') {
      if (typeof data.text === 'string' && data.text.length <= MAX_SELECTION && data.text.trim() && navigator.userActivation.isActive) onSelectText(data.text.trim());
    }
  };
  window.addEventListener('message', onMessage);

  frame.srcdoc = injectBridge({ html, nonce, maxTextLength: MAX_READY_TEXT });
  fit();
  return { frame };
}
