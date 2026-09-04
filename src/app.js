import { renderAsync } from 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.6/+esm';
import { getDocument, GlobalWorkerOptions } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

const docs = [];
let active = null;
let filterQuery = '';
const matchingDocs = new Set();
const $ = (id) => document.getElementById(id);
const isDocx = (file) => file.name.toLowerCase().endsWith('.docx');
const isPdf = (file) => file.name.toLowerCase().endsWith('.pdf');
const isSupported = (file) => isDocx(file) || isPdf(file);

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
  $('reader').innerHTML = '<div class="welcome"><div class="bigLogo">R</div><h1>Seu espaço de leitura</h1><p>Carregue um ou mais documentos DOCX para visualizar as páginas aqui.</p></div>';
  renderList();
};

const footer = document.querySelector('footer');
footer.innerHTML = '<input id="contentFilter" type="text" placeholder="filtre por conteúdo..." aria-label="Filtre por conteúdo">';
const contentFilter = $('contentFilter');
contentFilter.addEventListener('input', () => {
  filterQuery = contentFilter.value.trim();
  matchingDocs.clear();
  if (filterQuery) {
    for (const doc of docs) {
      const content = doc.type === 'pdf' ? doc.text : doc.html.replace(/<[^>]*>/g, ' ');
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
document.head.append(filterStyle);
const documentHeadingStyle = document.createElement('style');
documentHeadingStyle.textContent = 'h4{display:flex;align-items:center;justify-content:space-between}#clearDocuments{margin-right:22px;border:0;background:transparent;color:#91a0b0;font-size:20px;line-height:18px;padding:0 5px;cursor:pointer}#clearDocuments:hover{color:#c43e2e}.dark-mode #clearDocuments{color:#9dacbe}.dark-mode #clearDocuments:hover{color:#f08b7d}';
document.head.append(documentHeadingStyle);
const headingAlignmentStyle = document.createElement('style');
headingAlignmentStyle.textContent = '#clearDocuments{transform:translateX(8px)}';
document.head.append(headingAlignmentStyle);
const documentPaperStyle = document.createElement('style');
documentPaperStyle.textContent = '.dark-mode .document-stage .docx-wrapper>section,.dark-mode .document-stage .pdf-page,.dark-mode .document-stage .pdf-page canvas{background:#fff9dc!important}.dark-mode .document-stage .pdf-page canvas{mix-blend-mode:multiply}';
document.head.append(documentPaperStyle);
let zoomLevel = 0;
const zoomButton = document.createElement('button');
zoomButton.className = 'zoom-toggle';
zoomButton.type = 'button';
zoomButton.title = 'Aumentar zoom';
zoomButton.setAttribute('aria-label', 'Aumentar zoom');
zoomButton.textContent = '+';
$('top').append(zoomButton);
zoomButton.onclick = () => {
  zoomLevel = (zoomLevel + 1) % 2;
  const reader = $('reader');
  reader.classList.remove('zoom-current', 'zoom-medium', 'zoom-fit');
  const classes = ['zoom-current', 'zoom-fit'];
  reader.classList.add(classes[zoomLevel]);
  const labels = ['Zoom atual', 'Largura da área'];
  zoomButton.title = labels[zoomLevel];
  zoomButton.setAttribute('aria-label', labels[zoomLevel]);
};
const zoomStyle = document.createElement('style');
zoomStyle.textContent = `.zoom-toggle{width:42px;height:42px;margin-left:8px;border:1px solid #d6dfeb;border-radius:50%;background:#fff;color:#2867d4;cursor:pointer;font-size:25px;font-weight:400;line-height:1}.zoom-toggle:hover{background:#eef4ff;border-color:#8ab0ed}.zoom-fit{overflow-x:auto!important}.zoom-fit .document-stage{max-width:none;zoom:1.25}.zoom-fit .document-stage .docx-wrapper>section{width:100%!important;max-width:none!important}body:not(.dark-mode) .actions button{background:#2867d4;color:#fff;border-color:#2867d4}.dark-mode .zoom-toggle{background:#2a3543;color:#e8edf5;border-color:#526176}.dark-mode .zoom-toggle:hover{background:#3a4656}`;
document.head.append(zoomStyle);
$('top').append(zoomButton, themeButton);
const buttonLayoutStyle = document.createElement('style');
buttonLayoutStyle.textContent = '.zoom-toggle{margin-left:auto!important}.theme-toggle{margin-left:8px!important}';
document.head.append(buttonLayoutStyle);

function msg(text) {
  const element = $('message');
  element.textContent = text;
  element.style.display = 'block';
  setTimeout(() => element.style.display = 'none', 4000);
}

async function load(files, folder = false) {
  const compatible = files.filter(isSupported);
  if (folder && !compatible.length) return msg('Nenhum arquivo compatível encontrado.');
  if (!folder && compatible.length !== files.length) msg('Formato incompatível. Use arquivos DOCX ou PDF.');
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
      } else {
        const temporary = document.createElement('div');
        await renderAsync(await file.arrayBuffer(), temporary, undefined, { breakPages: true });
        docs.push({ file, name: file.name, size: file.size, type: 'docx', html: temporary.innerHTML });
      }
    } catch (error) {
      console.error(`Falha ao carregar ${file.name}:`, error);
      const reason = error?.message ? ` ${error.message}` : '';
      msg(`Não foi possível carregar ${file.name}.${reason}`);
    }
  }
  renderList();
  if (!active && docs[0]) openDocument(docs[0]);
}

function renderList() {
  $('count').textContent = docs.length;
  $('list').innerHTML = docs.length
    ? docs.map((doc, index) => `<div class="item ${doc === active ? 'active' : ''} ${matchingDocs.has(doc) ? 'content-match' : ''}" data-index="${index}"><button class="open-document" type="button"><span class="thumb ${doc.type === 'pdf' ? 'pdf-thumb' : ''}">${doc.type === 'pdf' ? 'PDF' : doc.html}</span><span><b>${doc.name}</b><small>Documento ${doc.type.toUpperCase()}</small></span></button><button class="close-document" type="button" title="Remover documento" aria-label="Remover ${doc.name}">×</button></div>`).join('')
    : '<div class="empty">Nenhum documento<br><small>Adicione arquivos DOCX, PDF ou uma pasta.</small></div>';
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
  $('reader').innerHTML = `<div class="document-stage">${highlightContent(active.html)}</div>`;
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

function removeDocument(index) {
  const removed = docs[index];
  if (!removed) return;
  docs.splice(index, 1);
  if (removed === active) {
    active = null;
    $('title').textContent = 'Nenhum documento selecionado';
    $('top').querySelector('small').textContent = 'Selecione um documento na lista';
    $('reader').innerHTML = '<div class="welcome"><div class="bigLogo">D</div><h1>Seu espaço de leitura</h1><p>Carregue um ou mais documentos DOCX para visualizar as páginas aqui.</p></div>';
  }
  renderList();
}

$('files').onclick = () => $('fileInput').click();
$('folder').onclick = () => $('folderInput').click();
$('fileInput').onchange = (event) => load([...event.target.files]);
$('folderInput').onchange = (event) => load([...event.target.files], true);
