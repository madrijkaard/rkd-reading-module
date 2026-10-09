export function confirmExternalLinkUseCase({ url, containerElement, onConfirm, timeoutMs }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { shown: false, dismiss: () => {} };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { shown: false, dismiss: () => {} };

  containerElement.querySelectorAll('.external-link-bar').forEach((previous) => (previous.rkdDismiss || (() => previous.remove()))());

  const ownerDocument = containerElement.ownerDocument;
  const bar = ownerDocument.createElement('div');
  bar.className = 'external-link-bar';
  bar.setAttribute('role', 'alertdialog');
  bar.setAttribute('aria-label', 'Abrir link externo no navegador?');

  const text = ownerDocument.createElement('div');
  text.className = 'external-link-text';
  const question = ownerDocument.createElement('span');
  question.textContent = 'Abrir link externo no navegador?';
  const host = ownerDocument.createElement('b');
  host.className = 'external-link-host';
  host.textContent = parsed.hostname;
  const full = ownerDocument.createElement('small');
  full.className = 'external-link-url';
  full.textContent = parsed.href;
  full.title = parsed.href;
  text.append(question, host, full);

  const openButton = ownerDocument.createElement('button');
  openButton.type = 'button';
  openButton.className = 'external-link-open';
  openButton.textContent = 'Abrir';
  const cancelButton = ownerDocument.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'external-link-cancel';
  cancelButton.textContent = 'Cancelar';
  bar.append(text, openButton, cancelButton);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') dismiss();
  };
  const timer = setTimeout(() => dismiss(), timeoutMs);
  function dismiss() {
    clearTimeout(timer);
    ownerDocument.removeEventListener('keydown', onKeyDown);
    bar.remove();
  }
  bar.rkdDismiss = dismiss;
  openButton.onclick = () => {
    dismiss();
    onConfirm(parsed.href);
  };
  cancelButton.onclick = dismiss;
  ownerDocument.addEventListener('keydown', onKeyDown);
  containerElement.append(bar);
  // Focus leaves the page iframe, so Esc reaches the app and Enter picks the safe option.
  cancelButton.focus();
  return { shown: true, dismiss };
}
