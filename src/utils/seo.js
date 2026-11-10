import { useEffect } from 'react';

const SITE = 'https://najf8.github.io/carbon/';

function setMeta(sel, attr, value) {
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement(sel.startsWith('link') ? 'link' : 'meta');
    const m = sel.match(/\[(\w+)="([^"]+)"\]/);
    el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Per-route title / description / Open Graph / canonical / optional JSON-LD. */
export function useSeo({ title, description, path = '/', image, jsonLd, lang }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
    }
    if (title) setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:url"]', 'content', SITE + '#' + path);
    setMeta('link[rel="canonical"]', 'href', SITE + (path === '/' ? '' : '#' + path));
    setMeta('meta[property="og:locale"]', 'content', lang === 'ar' ? 'ar_IQ' : 'en_GB');
    if (image) setMeta('meta[property="og:image"]', 'content', image);
    let tag = document.getElementById('ld-json');
    if (jsonLd) {
      if (!tag) { tag = document.createElement('script'); tag.id = 'ld-json'; tag.type = 'application/ld+json'; document.head.appendChild(tag); }
      tag.textContent = JSON.stringify(jsonLd);
    } else tag?.remove();
    return () => document.getElementById('ld-json')?.remove();
  }, [title, description, path, image, jsonLd, lang]);
}
