const CONTENT_SECURITY_POLICY = "default-src 'none'; img-src data:; style-src 'unsafe-inline' data:; font-src data:; media-src data:";
const MIME_BY_EXTENSION = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  bmp: 'image/bmp', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', css: 'text/css',
};
const MAX_IMPORT_DEPTH = 5;

function readAsDataUrl(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const type = file.type || MIME_BY_EXTENSION[extension] || 'application/octet-stream';
  const blob = file.type ? file : new Blob([file], { type });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function resolveHtmlResourcesUseCase({ source, htmlPath, resourceFiles }) {
  const resolved = [];
  const blocked = [];
  const dataUrls = new Map();
  const lowerCaseFiles = new Map([...resourceFiles].map(([path, file]) => [path.toLowerCase(), [path, file]]));

  function findFile(reference, basePath) {
    let url;
    try {
      url = new URL(reference, `https://rkd.invalid/${basePath}`);
    } catch {
      return null;
    }
    if (url.origin !== 'https://rkd.invalid') return null;
    let path;
    try {
      path = decodeURIComponent(url.pathname.slice(1));
    } catch {
      path = url.pathname.slice(1);
    }
    if (resourceFiles.has(path)) return [path, resourceFiles.get(path)];
    return lowerCaseFiles.get(path.toLowerCase()) || null;
  }

  function isAbsolute(reference) {
    return /^[a-z][a-z\d+.-]*:/i.test(reference) || reference.startsWith('//');
  }

  // Returns the data: URL for a reference, the reference itself when it is safe to keep, or null when it must be blocked.
  async function resolveReference(reference, basePath) {
    const value = String(reference || '').trim();
    if (!value) return null;
    if (/^data:/i.test(value) || value.startsWith('#')) return value;
    if (isAbsolute(value)) {
      blocked.push(value);
      return null;
    }
    const found = findFile(value, basePath);
    if (!found) {
      blocked.push(value);
      return null;
    }
    const [path, file] = found;
    try {
      if (!dataUrls.has(path)) dataUrls.set(path, readAsDataUrl(file));
      const dataUrl = await dataUrls.get(path);
      resolved.push(path);
      return dataUrl;
    } catch {
      blocked.push(value);
      return null;
    }
  }

  async function replaceAsync(text, pattern, replacer) {
    const matches = [...text.matchAll(pattern)];
    const replacements = await Promise.all(matches.map((match) => replacer(...match)));
    let index = 0;
    return text.replace(pattern, () => replacements[index++]);
  }

  async function rewriteCss(cssText, cssPath, depth = 0, visited = new Set([cssPath])) {
    let css = await replaceAsync(cssText, /@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1\s*\)?([^;]*);/gi, async (_match, _quote, reference, media) => {
      if (isAbsolute(reference) || depth >= MAX_IMPORT_DEPTH) {
        blocked.push(reference);
        return '';
      }
      const found = findFile(reference, cssPath);
      if (!found || visited.has(found[0])) {
        blocked.push(reference);
        return '';
      }
      try {
        const nested = await rewriteCss(await found[1].text(), found[0], depth + 1, new Set([...visited, found[0]]));
        resolved.push(found[0]);
        const mediaQuery = media.trim();
        return mediaQuery ? `@media ${mediaQuery}{${nested}}` : nested;
      } catch {
        blocked.push(reference);
        return '';
      }
    });
    css = await replaceAsync(css, /url\(\s*(["']?)([^"')]*?)\1\s*\)/gi, async (_match, _quote, reference) => {
      const value = await resolveReference(reference, cssPath);
      return value ? `url("${value}")` : 'url("")';
    });
    return css;
  }

  function block(element, attribute) {
    element.setAttribute(`data-rkd-blocked-${attribute.replace(':', '-')}`, element.getAttribute(attribute));
    element.removeAttribute(attribute);
  }

  async function resolveAttribute(element, attribute) {
    const value = await resolveReference(element.getAttribute(attribute), htmlPath);
    if (value) element.setAttribute(attribute, value);
    else block(element, attribute);
  }

  async function resolveSrcset(element) {
    const candidates = element.getAttribute('srcset').split(',').map((candidate) => candidate.trim()).filter(Boolean);
    const resolvedCandidates = await Promise.all(candidates.map(async (candidate) => {
      const [reference, ...descriptor] = candidate.split(/\s+/);
      const value = await resolveReference(reference, htmlPath);
      return value ? [value, ...descriptor].join(' ') : null;
    }));
    const kept = resolvedCandidates.filter(Boolean);
    if (kept.length) element.setAttribute('srcset', kept.join(', '));
    else block(element, 'srcset');
  }

  const parsed = new DOMParser().parseFromString(source, 'text/html');
  parsed.querySelectorAll('script, base, meta[http-equiv="refresh" i]').forEach((element) => element.remove());
  // Inline handlers never run in the sandbox; removing them avoids Chromium's "Blocked script execution" console error.
  parsed.querySelectorAll('*').forEach((element) => {
    [...element.attributes].filter((attribute) => /^on/i.test(attribute.name)).forEach((attribute) => element.removeAttribute(attribute.name));
  });
  parsed.querySelectorAll('link').forEach((link) => {
    const rel = (link.getAttribute('rel') || '').toLowerCase().split(/\s+/);
    if (!rel.includes('stylesheet')) link.remove();
  });
  parsed.querySelectorAll('iframe[src], frame[src], embed[src], audio[src], video[src], track[src], source[src]').forEach((element) => {
    if (element.matches('source') && element.parentElement?.matches('picture')) return;
    block(element, 'src');
  });
  parsed.querySelectorAll('object[data]').forEach((element) => block(element, 'data'));

  const tasks = [];
  parsed.querySelectorAll('img[src], input[type="image" i][src], picture > source[src]').forEach((element) => tasks.push(resolveAttribute(element, 'src')));
  parsed.querySelectorAll('video[poster]').forEach((element) => tasks.push(resolveAttribute(element, 'poster')));
  parsed.querySelectorAll('[background]').forEach((element) => tasks.push(resolveAttribute(element, 'background')));
  parsed.querySelectorAll('image').forEach((element) => {
    if (element.hasAttribute('href')) tasks.push(resolveAttribute(element, 'href'));
    if (element.hasAttribute('xlink:href')) tasks.push(resolveAttribute(element, 'xlink:href'));
  });
  parsed.querySelectorAll('img[srcset], source[srcset]').forEach((element) => tasks.push(resolveSrcset(element)));
  parsed.querySelectorAll('link').forEach((link) => tasks.push((async () => {
    const reference = link.getAttribute('href') || '';
    const found = isAbsolute(reference) ? null : findFile(reference, htmlPath);
    if (!found) {
      if (reference) blocked.push(reference);
      link.remove();
      return;
    }
    try {
      const style = parsed.createElement('style');
      if (link.getAttribute('media')) style.setAttribute('media', link.getAttribute('media'));
      style.textContent = await rewriteCss(await found[1].text(), found[0]);
      resolved.push(found[0]);
      link.replaceWith(style);
    } catch {
      blocked.push(reference);
      link.remove();
    }
  })()));
  parsed.querySelectorAll('style').forEach((style) => tasks.push((async () => {
    style.textContent = await rewriteCss(style.textContent, htmlPath);
  })()));
  parsed.querySelectorAll('[style]').forEach((element) => {
    if (!/url\(/i.test(element.getAttribute('style'))) return;
    tasks.push((async () => {
      element.setAttribute('style', await rewriteCss(element.getAttribute('style'), htmlPath));
    })());
  });
  await Promise.all(tasks);

  const csp = parsed.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content', CONTENT_SECURITY_POLICY);
  parsed.head.prepend(csp);

  const { doctype } = parsed;
  let doctypeText = '';
  if (doctype) {
    doctypeText = `<!DOCTYPE ${doctype.name}`;
    if (doctype.publicId) doctypeText += ` PUBLIC "${doctype.publicId}"`;
    if (doctype.systemId) doctypeText += `${doctype.publicId ? '' : ' SYSTEM'} "${doctype.systemId}"`;
    doctypeText += '>';
  }
  return { html: `${doctypeText}${parsed.documentElement.outerHTML}`, resolved, blocked };
}
