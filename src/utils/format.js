export function formatMoney(value, lang = 'ar', currency = 'IQD') {
  const n = Math.round(Number(value) || 0);
  const num = n.toLocaleString('en-US');
  return lang === 'ar' ? `${num} د.ع` : `${num} ${currency}`;
}

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Pick a localized field: { ar, en } -> string with graceful fallback. */
export function loc(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.ar || '';
}

/** Civil dates are YYYY-MM-DD strings; compare without timezone parsing. */
export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function debounce(fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.cancel = () => clearTimeout(t);
  return d;
}
