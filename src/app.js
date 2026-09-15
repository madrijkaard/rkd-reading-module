import { renderAsync } from 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.6/+esm';
import { getDocument, GlobalWorkerOptions } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

const docs = [];
let active = null;
let filterQuery = '';
const matchingDocs = new Set();
const $ = (id) => document.getElementById(id);
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-card"><b id="loadingTitle">Carregando planilha…</b><div class="loading-track"><div id="loadingProgress"></div></div><small id="loadingText">Preparando o arquivo…</small></div>';
document.body.append(loadingOverlay);
const loadingProgress = loadingOverlay.querySelector('#loadingProgress');
const loadingText = loadingOverlay.querySelector('#loadingText');
const setLoading = (visible, value = 0, text = 'Preparando o arquivo…') => {
  loadingOverlay.classList.toggle('visible', visible);
  loadingProgress.style.width = `${Math.max(0, Math.min(100, value))}%`;
  loadingText.textContent = text;
};
const isDocx = (file) => file.name.toLowerCase().endsWith('.docx');
const isPdf = (file) => file.name.toLowerCase().endsWith('.pdf');
const isXlsx = (file) => file.name.toLowerCase().endsWith('.xlsx');
const isSupported = (file) => isDocx(file) || isPdf(file) || isXlsx(file);

const documentHeading = document.querySelector('h4');
documentHeading.innerHTML = '<span>DOCUMENTOS CARREGADOS</span><button id="clearDocuments" type="button" title="Remover todos os documentos" aria-label="Remover todos os documentos">×</button>';
const clearDocumentsButton = $('clearDocuments');
clearDocumentsButton.onclick = () => {
  docs.splice(0, docs.length);
  active = null;
  matchingDocs.clear();
  filterQuery = '';
  contentFilter.value = '';
  $('title').textContent = 'Nenhum documento selecionado';
  $('top').querySelector('small').textContent = 'Selecione um documento na lista';
  $('reader').innerHTML = '<div class="welcome"><div class="bigLogo">R</div><h1>Seu espaço de leitura</h1><p>Carregue um ou mais documentos DOCX, PDF ou XLSX para visualizar os arquivos aqui.</p></div>';
  renderList();
};

const footer = document.querySelector('footer');
footer.innerHTML = '<div class="content-filter-control"><input id="contentFilter" type="text" placeholder="filtre por conteúdo..." aria-label="Filtre por conteúdo"><button id="clearContentFilter" type="button" title="Limpar busca" aria-label="Limpar busca">×</button></div>';
const contentFilter = $('contentFilter');
$('clearContentFilter').onclick = () => {
  if (contentFilter.value) {
    contentFilter.value = '';
    contentFilter.dispatchEvent(new Event('input', { bubbles: true }));
  }
  contentFilter.focus();
};
contentFilter.addEventListener('input', () => {
  filterQuery = contentFilter.value.trim();
  matchingDocs.clear();
  if (filterQuery) {
    for (const doc of docs) {
      const content = doc.type === 'pdf' ? doc.text : doc.type === 'xlsx' ? doc.text : doc.html.replace(/<[^>]*>/g, ' ');
      if (content.toLocaleLowerCase().includes(filterQuery.toLocaleLowerCase())) matchingDocs.add(doc);
    }
  }
  renderList();
  if (active) renderActiveDocument();
});

$('reader').addEventListener('dblclick', () => {
  setTimeout(() => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) return;
    contentFilter.value = selectedText;
    contentFilter.dispatchEvent(new Event('input', { bubbles: true }));
    contentFilter.focus();
  }, 0);
});

const themeButton = document.createElement('button');
themeButton.className = 'theme-toggle';
themeButton.type = 'button';
themeButton.title = 'Alternar modo escuro';
themeButton.setAttribute('aria-label', 'Alternar modo escuro');
themeButton.textContent = '💡';
$('top').append(themeButton);
themeButton.onclick = () => {
  document.body.classList.toggle('dark-mode');
  const dark = document.body.classList.contains('dark-mode');
  themeButton.title = dark ? 'Voltar ao modo claro' : 'Alternar modo escuro';
  themeButton.setAttribute('aria-label', themeButton.title);
};
const themeStyle = document.createElement('style');
themeStyle.textContent = `.theme-toggle{margin-left:auto;width:42px;height:42px;border:1px solid #d6dfeb;border-radius:50%;background:#fff;cursor:pointer;font-size:21px;line-height:1}.theme-toggle:hover{background:#fff7d6;border-color:#e5b93f}.dark-mode{background:#141a22;color:#e8edf5}.dark-mode #app{background:#141a22}.dark-mode aside,.dark-mode #top{background:#1d2632;color:#e8edf5;border-color:#303c4b}.dark-mode .actions,.dark-mode h4,.dark-mode footer{border-color:#303c4b}.dark-mode .actions button,.dark-mode .item{background:#222d3a;color:#e8edf5;border-color:#3b4a5d}.dark-mode .item.active{background:#263c5d;border-color:#5e91e6}.dark-mode .item small,.dark-mode header small,.dark-mode footer,.dark-mode .empty{color:#9dacbe}.dark-mode #reader{background:#111820}.dark-mode .docx-wrapper>section{box-shadow:0 2px 10px #0008!important}.dark-mode .theme-toggle{background:#2a3543;border-color:#526176}.dark-mode .theme-toggle:hover{background:#3a4656}`;
document.head.append(themeStyle);
const documentTitleStyle = document.createElement('style');
documentTitleStyle.textContent = '.dark-mode .open-document b{color:#9dacbe!important}.dark-mode .open-document small{color:#9dacbe!important}';
document.head.append(documentTitleStyle);
const filterStyle = document.createElement('style');
filterStyle.textContent = `footer{padding:12px}#contentFilter{width:100%;height:32px;padding:0 10px;border:1px solid #d6dfeb;border-radius:6px;background:#fff;color:#243244;font-size:10px;outline:none}#contentFilter::placeholder{color:#a7b1bd}#contentFilter:focus{border-color:#8ab0ed}.content-match{background:#dceaff!important;border-color:#8ab0ed!important}.content-highlight{background:#b8efb8!important;color:inherit!important;padding:0 2px;border-radius:2px}.dark-mode .content-match{background:#514a2c!important;border-color:#8e8041!important}.dark-mode #contentFilter{background:#2a3543;color:#e8edf5;border-color:#526176}.dark-mode #contentFilter::placeholder{color:#aab5c4}.dark-mode #contentFilter:focus{border-color:#d8bd57}`;
filterStyle.textContent += `
  .content-filter-control { position: relative; }
  .content-filter-control #contentFilter { padding-right: 34px; }
  #clearContentFilter {
    position: absolute;
    right: 3px;
    top: 3px;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #526273;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  #clearContentFilter:hover { background: #dce3eb; color: #243244; }
  #clearContentFilter:focus-visible { outline: 2px solid #2867d4; outline-offset: 1px; }
  .dark-mode #clearContentFilter { color: #aab5c4; }
  .dark-mode #clearContentFilter:hover { background: #3a4656; color: #e8edf5; }
`;
document.head.append(filterStyle);
const documentHeadingStyle = document.createElement('style');
documentHeadingStyle.textContent = 'h4{display:flex;align-items:center;justify-content:space-between}#clearDocuments{margin-right:22px;border:0;background:transparent;color:#91a0b0;font-size:20px;line-height:18px;padding:0 5px;cursor:pointer}#clearDocuments:hover{color:#c43e2e}.dark-mode #clearDocuments{color:#9dacbe}.dark-mode #clearDocuments:hover{color:#f08b7d}';
document.head.append(documentHeadingStyle);
const headingAlignmentStyle = document.createElement('style');
headingAlignmentStyle.textContent = '#clearDocuments{transform:translateX(8px)}';
document.head.append(headingAlignmentStyle);
const documentPaperStyle = document.createElement('style');
documentPaperStyle.textContent = '.dark-mode .document-stage .docx-wrapper>section,.dark-mode .document-stage .pdf-page,.dark-mode .document-stage .pdf-page canvas,.dark-mode .document-stage .sheet-content,.dark-mode .document-stage .sheet-content th{background:#fff9dc!important}.dark-mode .document-stage .pdf-page canvas{mix-blend-mode:multiply}';
document.head.append(documentPaperStyle);
let zoomLevel = 0;
const zoomButton = document.createElement('button');
zoomButton.className = 'zoom-toggle';
zoomButton.type = 'button';
zoomButton.title = 'Zoom 1 de 3 (100%). Clique para o zoom 2.';
zoomButton.setAttribute('aria-label', zoomButton.title);
zoomButton.textContent = '+ 1';
$('top').append(zoomButton);
zoomButton.onclick = () => {
  zoomLevel = (zoomLevel + 1) % 3;
  const reader = $('reader');
  reader.classList.remove('zoom-current', 'zoom-medium', 'zoom-fit', 'zoom-close');
  const classes = ['zoom-current', 'zoom-fit', 'zoom-close'];
  reader.classList.add(classes[zoomLevel]);
  const percentages = [100, 125, 150];
  zoomButton.textContent = `+ ${zoomLevel + 1}`;
  zoomButton.title = `Zoom ${zoomLevel + 1} de 3 (${percentages[zoomLevel]}%). Clique para o zoom ${(zoomLevel + 1) % 3 + 1}.`;
  zoomButton.setAttribute('aria-label', zoomButton.title);
};
const zoomStyle = document.createElement('style');
zoomStyle.textContent = `.zoom-toggle{width:42px;height:42px;margin-left:8px;border:1px solid #d6dfeb;border-radius:50%;background:#fff;color:#2867d4;cursor:pointer;font-size:25px;font-weight:400;line-height:1}.zoom-toggle:hover{background:#eef4ff;border-color:#8ab0ed}.zoom-fit{overflow-x:auto!important}.zoom-fit .document-stage{max-width:none;zoom:1.25}.zoom-fit .document-stage .docx-wrapper>section{width:100%!important;max-width:none!important}body:not(.dark-mode) .actions button{background:#2867d4;color:#fff;border-color:#2867d4}.dark-mode .zoom-toggle{background:#2a3543;color:#e8edf5;border-color:#526176}.dark-mode .zoom-toggle:hover{background:#3a4656}.xlsx-thumb{display:grid;place-items:center;color:#16864a;font-weight:800;font-size:10px}.spreadsheet-stage{padding:0 0 30px}.sheet-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 auto 16px;max-width:1200px}.sheet-tab{border:1px solid #d4dce5;border-radius:6px;background:#fff;color:#415166;padding:8px 12px;cursor:pointer}.sheet-tab:hover,.sheet-tab.active{background:#2867d4;border-color:#2867d4;color:#fff}.sheet-content{max-width:1200px;margin:0 auto;overflow:auto;background:#fff;box-shadow:0 2px 10px #26384d1c}.sheet-content table{border-collapse:collapse;width:max-content;min-width:100%;font-size:12px}.sheet-content td,.sheet-content th{border:1px solid #dfe4ea;padding:7px 10px;min-width:80px;white-space:pre-wrap;vertical-align:top}.sheet-content th{background:#f1f5fa;color:#243244;font-weight:700}.dark-mode .sheet-content{box-shadow:0 2px 10px #0008}.dark-mode .sheet-content table,.dark-mode .sheet-content td{color:#243244}.dark-mode .sheet-tab{background:#2a3543;color:#e8edf5;border-color:#526176}.dark-mode .sheet-tab:hover,.dark-mode .sheet-tab.active{background:#2867d4;border-color:#5e91e6}.dark-mode .sheet-content th{background:#dbe4ef;color:#243244}`;
zoomStyle.textContent += `
  .zoom-toggle { font-size: 18px; white-space: nowrap; flex-shrink: 0; }
  .zoom-close { overflow-x: auto !important; }
  .zoom-close .document-stage { max-width: none; zoom: 1.5; }
  /* Give PDFs 20% more width than zoom 2, so max-width:100% on the
     canvas does not shrink the enlarged page back to the reader width. */
  .zoom-close .pdf-stage { width: 120%; }
  #reader.zoom-close .docx-stage {
    width: max-content;
    min-width: 100%;
  }
  #reader.zoom-close .docx-wrapper {
    width: max-content;
    min-width: 100%;
  }
  #reader.zoom-close .docx-wrapper > section {
    max-width: none !important;
    overflow: visible;
  }
`;
document.head.append(zoomStyle);
const sidebar = document.querySelector('#app > aside');
sidebar.id = 'documentSidebar';
const sidebarButton = document.createElement('button');
sidebarButton.className = 'sidebar-toggle';
sidebarButton.type = 'button';
sidebarButton.title = 'Recolher menu lateral';
sidebarButton.setAttribute('aria-label', sidebarButton.title);
sidebarButton.setAttribute('aria-controls', sidebar.id);
sidebarButton.setAttribute('aria-expanded', 'true');
sidebarButton.textContent = '⇤';
sidebarButton.onclick = () => {
  const collapsed = $('app').classList.toggle('sidebar-collapsed');
  sidebarButton.textContent = collapsed ? '⇥' : '⇤';
  sidebarButton.title = collapsed ? 'Mostrar menu lateral' : 'Recolher menu lateral';
  sidebarButton.setAttribute('aria-label', sidebarButton.title);
  sidebarButton.setAttribute('aria-expanded', String(!collapsed));
  requestAnimationFrame(() => {
    const viewport = $('reader').querySelector('.sheet-viewport');
    if (active?.type === 'xlsx' && viewport) {
      renderVirtualRows(viewport, active.sheets[active.activeSheet]);
    }
  });
};
$('top').append(zoomButton, sidebarButton, themeButton);
const buttonLayoutStyle = document.createElement('style');
buttonLayoutStyle.textContent = '.zoom-toggle{margin-left:auto!important}.theme-toggle{margin-left:8px!important}';
buttonLayoutStyle.textContent += `
  #app.sidebar-collapsed { grid-template-columns: minmax(0, 1fr); }
  #app.sidebar-collapsed > aside { display: none; }
  #app.sidebar-collapsed .sheet-tabs,
  #app.sidebar-collapsed .sheet-content { max-width: none; }
  #top > div:first-child { min-width: 0; }
  #title { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sidebar-toggle {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border: 1px solid #d6dfeb;
    border-radius: 50%;
    background: var(--light-paper, #e6e8e5);
    color: #2867d4;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
  }
  .sidebar-toggle:hover { background: #dce3eb; border-color: #8ab0ed; }
  .sidebar-toggle:focus-visible { outline: 2px solid #2867d4; outline-offset: 2px; }
  .dark-mode .sidebar-toggle { background: #2a3543; color: #e8edf5; border-color: #526176; }
  .dark-mode .sidebar-toggle:hover { background: #3a4656; }
`;
document.head.append(buttonLayoutStyle);
const spreadsheetLayoutStyle = document.createElement('style');
spreadsheetLayoutStyle.textContent = `.spreadsheet-stage{height:100%;min-height:0;margin-top:-20px;display:flex;flex-direction:column}.sheet-tabs{position:sticky;top:-10px;z-index:5;flex:none;padding:4px 0 8px;margin-bottom:8px;background:#edf0f4}.sheet-tab:hover:not(.active){background:#eef4ff;border-color:#8ab0ed;color:#2867d4}.dark-mode .sheet-tabs{background:#111820}.dark-mode .sheet-tab:hover:not(.active){background:#3a4656;border-color:#5e91e6;color:#e8edf5}.loading-overlay{position:fixed;inset:0;z-index:20;display:none;place-items:center;background:#24324466}.loading-overlay.visible{display:grid}.loading-card{width:min(420px,calc(100vw - 40px));padding:22px 24px;border-radius:10px;background:#fff;color:#243244;box-shadow:0 8px 30px #0003}.loading-card b{display:block;margin-bottom:14px}.loading-track{height:8px;overflow:hidden;border-radius:8px;background:#e4e9ee}.loading-track>div{height:100%;width:0;border-radius:8px;background:#2867d4;transition:width .15s ease}.loading-card small{display:block;margin-top:10px;color:#718096}.dark-mode .loading-card{background:#1d2632;color:#e8edf5}.dark-mode .loading-track{background:#3b4a5d}.dark-mode .loading-card small{color:#aab5c4}.sheet-content{flex:1;min-height:0;display:flex;flex-direction:column;overflow:visible}.sheet-viewport{height:auto;flex:1;min-height:260px;overflow:auto}.virtual-sheet{table-layout:fixed}.virtual-sheet thead{position:sticky;top:0;z-index:2}.virtual-sheet th{position:sticky;top:0}.virtual-sheet .sheet-spacer td{padding:0;border:0;background:transparent}`;
// Keep the workbook within the reader's width and allocate only the remaining
// vertical space to its scrolling viewport, including when tabs wrap or zoom.
spreadsheetLayoutStyle.textContent += `
  #reader:has(.spreadsheet-stage) {
    display: flex;
    flex-direction: column;
    padding-top: 14px;
    padding-bottom: 24px;
    overflow: hidden !important;
  }
  #reader .spreadsheet-stage {
    flex: 1;
    height: auto;
    min-height: 0;
    min-width: 0;
    margin: 0;
    padding: 0;
  }
  #reader .sheet-tabs {
    position: static;
    width: 100%;
    min-width: 0;
    padding: 4px 0 8px;
    margin: 0 auto 8px;
  }
  #reader .sheet-content {
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }
  #reader .sheet-viewport {
    min-width: 0;
    min-height: 0;
  }
  #reader.zoom-fit .spreadsheet-stage,
  #reader.zoom-close .spreadsheet-stage {
    zoom: 1;
  }
  #reader.zoom-fit .sheet-viewport {
    zoom: 1.25;
  }
  #reader.zoom-close .sheet-viewport {
    zoom: 1.5;
  }
`;
document.head.append(spreadsheetLayoutStyle);

function msg(text) {
  const element = $('message');
  element.textContent = text;
  element.style.display = 'block';
  setTimeout(() => element.style.display = 'none', 4000);
}

async function load(files, folder = false) {
  const compatible = files.filter(isSupported);
  if (folder && !compatible.length) return msg('Nenhum arquivo compatível encontrado.');
  if (!folder && compatible.length !== files.length) msg('Formato incompatível. Use arquivos DOCX, PDF ou XLSX.');
  for (const file of compatible) {
    if (docs.some((doc) => doc.name === file.name && doc.size === file.size)) continue;
    try {
      if (isPdf(file)) {
        // Disable the worker because the renderer runs from a local Electron file URL.
        const pdf = await getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
          disableWorker: true,
          useWorkerFetch: false,
          isEvalSupported: false,
        }).promise;
        const textParts = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          textParts.push(content.items.map((item) => item.str).join(' '));
        }
        docs.push({ file, name: file.name, size: file.size, type: 'pdf', pdf, text: textParts.join('\n') });
      } else if (isXlsx(file)) {
        setLoading(true, 2, `Abrindo ${file.name}…`);
        const sheets = await readXlsxInWorker(file);
        docs.push({ file, name: file.name, size: file.size, type: 'xlsx', sheets, text: sheets.map((sheet) => `${sheet.name}\n${sheet.text}`).join('\n'), activeSheet: 0 });
      } else {
        const temporary = document.createElement('div');
        await renderAsync(await file.arrayBuffer(), temporary, undefined, { breakPages: true });
        docs.push({ file, name: file.name, size: file.size, type: 'docx', html: temporary.innerHTML });
      }
    } catch (error) {
      console.error(`Falha ao carregar ${file.name}:`, error);
      const reason = error?.message ? ` ${error.message}` : '';
      msg(`Não foi possível carregar ${file.name}.${reason}`);
    } finally {
      setLoading(false);
    }
  }
  renderList();
  if (!active && docs[0]) openDocument(docs[0]);
}

function renderList() {
  $('count').textContent = docs.length;
  $('list').innerHTML = docs.length
    ? docs.map((doc, index) => `<div class="item ${doc === active ? 'active' : ''} ${matchingDocs.has(doc) ? 'content-match' : ''}" data-index="${index}"><button class="open-document" type="button"><span class="thumb ${doc.type === 'pdf' ? 'pdf-thumb' : doc.type === 'xlsx' ? 'xlsx-thumb' : ''}">${doc.type === 'pdf' ? 'PDF' : doc.type === 'xlsx' ? 'XLSX' : doc.html}</span><span><b>${escapeHtml(doc.name)}</b><small>Documento ${doc.type.toUpperCase()}</small></span></button><button class="close-document" type="button" title="Remover documento" aria-label="Remover documento">×</button></div>`).join('')
    : '<div class="empty">Nenhum documento<br><small>Adicione arquivos DOCX, PDF, XLSX ou uma pasta.</small></div>';
  document.querySelectorAll('.open-document').forEach((button) => {
    button.onclick = () => openDocument(docs[Number(button.parentElement.dataset.index)]);
  });
  document.querySelectorAll('.close-document').forEach((button) => {
    button.onclick = (event) => { event.stopPropagation(); removeDocument(Number(button.parentElement.dataset.index)); };
  });
}

function openDocument(doc) {
  active = doc;
  $('title').textContent = doc.name;
  $('top').querySelector('small').textContent = 'Visualização de documento';
  renderActiveDocument();
  renderList();
}

async function renderActiveDocument() {
  if (!active) return;
  if (active.type === 'xlsx') {
    const tabs = active.sheets.map((sheet, index) => `<button type="button" class="sheet-tab ${index === active.activeSheet ? 'active' : ''}" data-sheet-index="${index}">${escapeHtml(sheet.name)}</button>`).join('');
    const sheet = active.sheets[active.activeSheet] || active.sheets[0];
    $('reader').innerHTML = `<div class="document-stage spreadsheet-stage"><div class="sheet-tabs" role="tablist">${tabs}</div><div class="sheet-content">${renderVirtualSheet(sheet)}</div></div>`;
    $('reader').querySelectorAll('.sheet-tab').forEach((button) => {
      button.onclick = () => {
        active.activeSheet = Number(button.dataset.sheetIndex);
        renderActiveDocument();
      };
    });
    const viewport = $('reader').querySelector('.sheet-viewport');
    let scheduled = false;
    viewport.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        renderVirtualRows(viewport, sheet);
      });
    });
    renderVirtualRows(viewport, sheet);
    return;
  }
  if (active.type === 'pdf') {
    $('reader').innerHTML = '<div class="document-stage pdf-stage"><div class="loading">Carregando PDF…</div></div>';
    const stage = $('reader').querySelector('.document-stage');
    for (let pageNumber = 1; pageNumber <= active.pdf.numPages; pageNumber += 1) {
      if (active !== docs.find((doc) => doc === active)) return;
      const page = await active.pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.35 });
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page';
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.setAttribute('aria-label', `Página ${pageNumber}`);
      pageContainer.append(canvas);
      stage.append(pageContainer);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
    stage.querySelector('.loading')?.remove();
    return;
  }
  $('reader').innerHTML = `<div class="document-stage docx-stage">${highlightContent(active.html)}</div>`;
}

function highlightContent(html) {
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

const spreadsheetRowHeight = 34;
const spreadsheetOverscan = 12;

function renderVirtualSheet(sheet) {
  const rows = sheet.rows || [];
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const header = rows[0] || [];
  const widths = getSpreadsheetColumnWidths(rows, columnCount);
  const colgroup = widths.map((width) => `<col style="width:${width}px">`).join('');
  const headerCells = Array.from({ length: columnCount }, (_, index) => `<th scope="col">${highlightCell(header[index] ?? '')}</th>`).join('');
  return `<div class="sheet-viewport"><table class="virtual-sheet"><colgroup>${colgroup}</colgroup><thead><tr>${headerCells}</tr></thead><tbody></tbody></table></div>`;
}

function renderVirtualRows(viewport, sheet) {
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
  const visibleRows = dataRows.slice(start, end).map((row, rowIndex) => `<tr>${Array.from({ length: columnCount }, (_, index) => `<td title="${escapeHtml(row[index] ?? '')}">${highlightCell(row[index] ?? '')}</td>`).join('')}</tr>`).join('');
  const bottomRow = `<tr class="sheet-spacer" aria-hidden="true"><td colspan="${columnCount}" style="height:${bottomHeight}px"></td></tr>`;
  tableBody.innerHTML = topRow + visibleRows + bottomRow;
}

function getSpreadsheetColumnWidths(rows, columnCount) {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const longest = rows.slice(0, 100).reduce((length, row) => Math.max(length, String(row[columnIndex] ?? '').length), 0);
    return Math.max(100, Math.min(360, 24 + longest * 8));
  });
}

function highlightCell(value) {
  const escapedValue = escapeHtml(value);
  if (!filterQuery) return escapedValue;
  const escapedQuery = escapeHtml(filterQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedValue.replace(new RegExp(escapedQuery, 'gi'), (match) => `<mark class="content-highlight">${match}</mark>`);
}

function readXlsxInWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./xlsx-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') setLoading(true, data.value, data.text);
      if (data.type === 'complete') {
        worker.terminate();
        resolve(data.sheets);
      }
      if (data.type === 'error') {
        worker.terminate();
        reject(new Error(data.message));
      }
    };
    worker.onerror = (error) => {
      worker.terminate();
      reject(error.error || new Error('Falha ao processar a planilha.'));
    };
    file.arrayBuffer().then((buffer) => worker.postMessage({ buffer }, [buffer])).catch((error) => {
      worker.terminate();
      reject(error);
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function removeDocument(index) {
  const removed = docs[index];
  if (!removed) return;
  docs.splice(index, 1);
  if (removed === active) {
    active = null;
    $('title').textContent = 'Nenhum documento selecionado';
    $('top').querySelector('small').textContent = 'Selecione um documento na lista';
    $('reader').innerHTML = '<div class="welcome"><div class="bigLogo">D</div><h1>Seu espaço de leitura</h1><p>Carregue um ou mais documentos DOCX, PDF ou XLSX para visualizar os arquivos aqui.</p></div>';
  }
  renderList();
}

$('files').onclick = () => $('fileInput').click();
$('folder').onclick = () => $('folderInput').click();
$('fileInput').onchange = (event) => load([...event.target.files]);
$('folderInput').onchange = (event) => load([...event.target.files], true);
