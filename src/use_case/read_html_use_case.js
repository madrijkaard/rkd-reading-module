function detectEncoding(bytes) {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8';
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  const metaCharset = head.match(/<meta[^>]+charset\s*=\s*["']?\s*([\w.:-]+)/i);
  return metaCharset ? metaCharset[1] : 'utf-8';
}

function decode(bytes, label) {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

export async function readHtmlUseCase({ file }) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = decode(bytes, detectEncoding(bytes));
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  parsed.querySelectorAll('script, style, template').forEach((element) => element.remove());
  parsed.head?.remove();
  const text = (parsed.body?.textContent || '').replace(/\s+/g, ' ').trim();
  return { source, text };
}
