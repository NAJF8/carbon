// Resolve an image/asset reference to a URL that works under the GitHub Pages base path.
// Accepts: absolute URLs, data:/blob: URIs, or repo-relative paths such as "assets/products/whey.webp".
const BASE = import.meta.env.BASE_URL || '/';

export function asset(src) {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return BASE + String(src).replace(/^\.?\//, '').replace(/^carbon\//, '');
}

/** "assets/products/a.webp" -> "assets/products/a-400.webp" when a small variant is expected to exist. */
export function smallVariant(src) {
  if (!src || /^(data:|blob:)/i.test(src)) return src;
  return src.replace(/\.webp$/i, '-400.webp');
}
