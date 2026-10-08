const spreadsheetRowHeight = 34;
const spreadsheetOverscan = 12;

function highlightCell(value, filterQuery, escapeHtml) {
  const escapedValue = escapeHtml(value);
  if (!filterQuery) return escapedValue;
  const escapedQuery = escapeHtml(filterQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedValue.replace(new RegExp(escapedQuery, 'gi'), (match) => `<mark class="content-highlight">${match}</mark>`);
}

function getSpreadsheetColumnWidths(rows, columnCount) {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const longest = rows.slice(0, 100).reduce((length, row) => Math.max(length, String(row[columnIndex] ?? '').length), 0);
    return Math.max(100, Math.min(360, 24 + longest * 8));
  });
}

function renderVirtualSheet(sheet, filterQuery, escapeHtml) {
  const rows = sheet.rows || [];
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const header = rows[0] || [];
  const widths = getSpreadsheetColumnWidths(rows, columnCount);
  const colgroup = widths.map((width) => `<col style="width:${width}px">`).join('');
  const headerCells = Array.from({ length: columnCount }, (_, index) => `<th scope="col">${highlightCell(header[index] ?? '', filterQuery, escapeHtml)}</th>`).join('');
  return `<div class="sheet-viewport"><table class="virtual-sheet"><colgroup>${colgroup}</colgroup><thead><tr>${headerCells}</tr></thead><tbody></tbody></table></div>`;
}

function renderVirtualRows(viewport, sheet, filterQuery, escapeHtml) {
  const rows = sheet.rows || [];
  const dataRows = rows.slice(1);
  const tableBody = viewport.querySelector('tbody');
  if (!tableBody) return;
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const firstVisible = Math.floor(viewport.scrollTop / spreadsheetRowHeight);
  const visibleCount = Math.ceil(viewport.clientHeight / spreadsheetRowHeight) + spreadsheetOverscan * 2;
  const start = Math.max(0, firstVisible - spreadsheetOverscan);
  const end = Math.min(dataRows.length, start + visibleCount);
  const topHeight = start * spreadsheetRowHeight;
  const bottomHeight = Math.max(0, (dataRows.length - end) * spreadsheetRowHeight);
  const topRow = `<tr class="sheet-spacer" aria-hidden="true"><td colspan="${columnCount}" style="height:${topHeight}px"></td></tr>`;
  const visibleRows = dataRows.slice(start, end).map((row, rowIndex) => `<tr>${Array.from({ length: columnCount }, (_, index) => `<td title="${escapeHtml(row[index] ?? '')}">${highlightCell(row[index] ?? '', filterQuery, escapeHtml)}</td>`).join('')}</tr>`).join('');
  const bottomRow = `<tr class="sheet-spacer" aria-hidden="true"><td colspan="${columnCount}" style="height:${bottomHeight}px"></td></tr>`;
  tableBody.innerHTML = topRow + visibleRows + bottomRow;
}

export function renderXlsxUseCase({ sheets, activeSheet, filterQuery, readerElement, escapeHtml, onSelectSheet }) {
  const tabs = sheets.map((sheet, index) => `<button type="button" class="sheet-tab ${index === activeSheet ? 'active' : ''}" data-sheet-index="${index}">${escapeHtml(sheet.name)}</button>`).join('');
  const sheet = sheets[activeSheet] || sheets[0];
  readerElement.innerHTML = `<div class="document-stage spreadsheet-stage"><div class="sheet-tabs" role="tablist">${tabs}</div><div class="sheet-content">${renderVirtualSheet(sheet, filterQuery, escapeHtml)}</div></div>`;
  readerElement.querySelectorAll('.sheet-tab').forEach((button) => {
    button.onclick = () => {
      onSelectSheet(Number(button.dataset.sheetIndex));
    };
  });
  const viewport = readerElement.querySelector('.sheet-viewport');
  let scheduled = false;
  viewport.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      renderVirtualRows(viewport, sheet, filterQuery, escapeHtml);
    });
  });
  renderVirtualRows(viewport, sheet, filterQuery, escapeHtml);
  return {
    redrawVisibleRows() {
      renderVirtualRows(viewport, sheet, filterQuery, escapeHtml);
    },
  };
}
