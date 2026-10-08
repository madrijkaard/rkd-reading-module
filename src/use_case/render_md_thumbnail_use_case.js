export function renderMdThumbnailUseCase({ html, maxBlocks }) {
  const container = document.createElement('div');
  container.innerHTML = html;
  [...container.children].slice(maxBlocks).forEach((child) => child.remove());
  return { html: `<div class="md-stage md-thumb-preview"><article class="markdown-body">${container.innerHTML}</article></div>` };
}
