export async function readMdUseCase({ file, parseMarkdown, sanitizeHtml }) {
  const source = await file.text();
  const rawHtml = parseMarkdown(source);
  const html = sanitizeHtml(rawHtml);
  const container = document.createElement('div');
  container.innerHTML = html;
  const text = container.textContent;
  return { html, text };
}
