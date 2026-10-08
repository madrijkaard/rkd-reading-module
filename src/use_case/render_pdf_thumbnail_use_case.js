export async function renderPdfThumbnailUseCase({ pdf, targetWidth }) {
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: targetWidth / baseViewport.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  const src = canvas.toDataURL('image/png');
  return { html: `<img class="thumb-image" src="${src}" alt="">`, width: canvas.width, height: canvas.height };
}
