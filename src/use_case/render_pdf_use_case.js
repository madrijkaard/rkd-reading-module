export async function renderPdfUseCase({ pdf, readerElement, scale, shouldContinue }) {
  readerElement.innerHTML = '<div class="document-stage pdf-stage"><div class="loading">Carregando PDF…</div></div>';
  const stage = readerElement.querySelector('.document-stage');
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (!shouldContinue()) return;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
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
}
