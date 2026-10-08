export function renderXlsxThumbnailUseCase({ sheets, maxRows, maxColumns, maxCellLength, escapeHtml }) {
  const rows = sheets[0]?.rows || [];
  if (!rows.length) return { html: '' };
  const visibleRows = rows.slice(0, maxRows);
  const columnCount = Math.min(maxColumns, Math.max(1, ...visibleRows.map((row) => row.length)));
  const cell = (row, index) => escapeHtml(String(row[index] ?? '').slice(0, maxCellLength));
  const [header, ...body] = visibleRows;
  const headerCells = Array.from({ length: columnCount }, (_, index) => `<th>${cell(header, index)}</th>`).join('');
  const bodyRows = body.map((row) => `<tr>${Array.from({ length: columnCount }, (_, index) => `<td>${cell(row, index)}</td>`).join('')}</tr>`).join('');
  return { html: `<div class="xlsx-thumb-preview"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>` };
}
