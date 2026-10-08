function externalHttpUrl(href) {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function renderHtmlUseCase({ html, filterQuery, readerElement, highlightDocument, onOpenExternal, onSelectText, onFirstLayout }) {
  const existing = readerElement.querySelector('.html-stage iframe.html-frame');
  if (existing && existing.srcdoc === html) {
    existing.dataset.filterQuery = filterQuery;
    if (existing.dataset.loaded === '1') {
      highlightDocument({ document: existing.contentDocument, filterQuery });
      existing.rkdMeasure?.();
    }
    return { frame: existing };
  }

  readerElement.innerHTML = '<div class="document-stage html-stage"><iframe class="html-frame" sandbox="allow-same-origin" referrerpolicy="no-referrer" title="Documento HTML"></iframe></div>';
  const frame = readerElement.querySelector('iframe.html-frame');
  frame.dataset.filterQuery = filterQuery;

  frame.addEventListener('load', () => {
    if (!frame.isConnected) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    frame.dataset.loaded = '1';

    const handleLink = (event) => {
      const anchor = event.target.closest?.('a[href], area[href]');
      if (!anchor) return;
      event.preventDefault();
      const href = anchor.getAttribute('href').trim();
      if (href.startsWith('#')) {
        const id = decodeURIComponent(href.slice(1));
        const target = id ? doc.getElementById(id) || doc.getElementsByName(id)[0] : doc.body;
        target?.scrollIntoView({ block: 'start' });
        return;
      }
      if (event.type === 'click' || event.button === 1) {
        const url = externalHttpUrl(href);
        if (url) onOpenExternal(url);
      }
    };
    doc.addEventListener('click', handleLink, true);
    doc.addEventListener('auxclick', handleLink, true);
    doc.addEventListener('submit', (event) => event.preventDefault(), true);
    doc.addEventListener('dblclick', () => {
      setTimeout(() => {
        const text = frame.contentWindow?.getSelection()?.toString().trim();
        if (text) onSelectText(text);
      }, 0);
    });

    highlightDocument({ document: doc, filterQuery: frame.dataset.filterQuery });

    let measuring = false;
    const measure = () => {
      if (!frame.isConnected || !frame.contentDocument) return;
      measuring = true;
      const root = doc.documentElement;
      // Shrinking the frame while measuring would clamp the reader's scroll position; keep it.
      const { scrollTop, scrollLeft } = readerElement;
      frame.style.width = '100%';
      frame.style.height = '1px';
      const width = root.scrollWidth;
      if (width > frame.clientWidth) frame.style.width = `${width}px`;
      let height = root.scrollHeight;
      frame.style.height = `${height}px`;
      const scrollbar = frame.contentWindow.innerHeight - root.clientHeight;
      if (scrollbar > 0) {
        height += scrollbar;
        frame.style.height = `${height}px`;
      }
      readerElement.scrollTop = scrollTop;
      readerElement.scrollLeft = scrollLeft;
      requestAnimationFrame(() => { measuring = false; });
    };
    frame.rkdMeasure = measure;
    measure();

    let scheduled = false;
    // The frame's own ResizeObserver: an observer from the app window watching nodes of another
    // document never settles in Chromium ("ResizeObserver loop completed…" on every frame).
    const observer = new frame.contentWindow.ResizeObserver(() => {
      if (measuring || scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!frame.isConnected) {
          observer.disconnect();
          return;
        }
        measure();
      });
    });
    observer.observe(doc.documentElement);
    if (doc.body) observer.observe(doc.body);
    onFirstLayout();
  });
  frame.srcdoc = html;
  return { frame };
}
