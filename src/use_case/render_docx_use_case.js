import { highlightHtmlUseCase } from './highlight_html_use_case.js';

export async function renderDocxUseCase({ html, filterQuery, readerElement }) {
  readerElement.innerHTML = `<div class="document-stage docx-stage">${highlightHtmlUseCase({ html, filterQuery })}</div>`;
}
