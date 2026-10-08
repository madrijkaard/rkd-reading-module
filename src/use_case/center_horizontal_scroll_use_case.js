export function centerHorizontalScrollUseCase({ readerElement }) {
  const maxScrollLeft = Math.max(0, readerElement.scrollWidth - readerElement.clientWidth);
  readerElement.scrollLeft = Math.round(maxScrollLeft / 2);
  return { scrollLeft: readerElement.scrollLeft, maxScrollLeft };
}
