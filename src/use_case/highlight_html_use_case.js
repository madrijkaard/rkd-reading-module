export function highlightHtmlUseCase({ html, filterQuery }) {
  if (!filterQuery) return html;
  const container = document.createElement('div');
  container.innerHTML = html;
  const escaped = filterQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, 'gi');
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  for (const textNode of textNodes) {
    if (!textNode.nodeValue || !pattern.test(textNode.nodeValue)) { pattern.lastIndex = 0; continue; }
    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    textNode.nodeValue.replace(pattern, (match, offset) => {
      fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex, offset)));
      const mark = document.createElement('mark');
      mark.className = 'content-highlight';
      mark.textContent = match;
      fragment.append(mark);
      lastIndex = offset + match.length;
      return match;
    });
    fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex)));
    textNode.parentNode.replaceChild(fragment, textNode);
  }
  return container.innerHTML;
}
