import { highlightHtmlUseCase } from './highlight_html_use_case.js';

export async function renderMdUseCase({ html, filterQuery, readerElement }) {
  readerElement.innerHTML = `<div class="document-stage md-stage"><article class="markdown-body">${highlightHtmlUseCase({ html, filterQuery })}</article></div>`;
}
