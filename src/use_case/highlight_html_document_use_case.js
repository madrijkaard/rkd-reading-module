const SKIPPED_PARENTS = 'script, style, textarea, title, template';

export function highlightHtmlDocumentUseCase({ document, filterQuery }) {
  document.querySelectorAll('mark[data-rkd-highlight]').forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize();
  });
  if (!filterQuery || !document.body) return { count: 0, first: null };
  if (!document.getElementById('rkd-highlight-style')) {
    const style = document.createElement('style');
    style.id = 'rkd-highlight-style';
    style.textContent = 'mark[data-rkd-highlight]{background:#b8efb8!important;color:inherit!important;padding:0 2px;border-radius:2px}';
    (document.head || document.documentElement).append(style);
  }
  const pattern = new RegExp(filterQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest(SKIPPED_PARENTS)) continue;
    pattern.lastIndex = 0;
    if (pattern.test(node.nodeValue)) nodes.push(node);
  }
  let count = 0;
  let first = null;
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    const text = node.nodeValue;
    let lastIndex = 0;
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (!match[0]) continue;
      fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'content-highlight';
      mark.setAttribute('data-rkd-highlight', '');
      mark.textContent = match[0];
      fragment.append(mark);
      first ||= mark;
      count += 1;
      lastIndex = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(lastIndex)));
    node.replaceWith(fragment);
  }
  return { count, first };
}
