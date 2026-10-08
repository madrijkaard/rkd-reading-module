export async function renderHtmlThumbnailUseCase({ html, pageWidth, pageHeight, targetWidth, maxSourceLength }) {
  if (html.length > maxSourceLength) return { html: '' };
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script, link, meta, base, title').forEach((element) => element.remove());
  parsed.documentElement.setAttribute('style', `width:${pageWidth}px`);
  const xhtml = new XMLSerializer().serializeToString(parsed.documentElement);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}"><foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Falha ao desenhar a miniatura HTML.'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = Math.round(targetWidth * pageHeight / pageWidth);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const src = canvas.toDataURL('image/png');
  return { html: `<img class="thumb-image" src="${src}" alt="">`, width: canvas.width, height: canvas.height };
}
