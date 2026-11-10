import { fetchStaticCatalog, normalizeCatalog } from '../contract.js';

/**
 * LOCAL PREVIEW adapter — DEVELOPMENT ONLY (`vite dev`). It is compiled out of production builds.
 * Data is stored in this browser's localStorage so the admin UI can be exercised without a backend.
 * It provides NO security and no real authentication; it is a design/QA sandbox.
 */
const KEY = 'carbon-dev-catalog';
const SESSION = 'carbon-dev-session';
const listeners = new Set();

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (c) => localStorage.setItem(KEY, JSON.stringify(c));
const emit = () => { const u = localStorage.getItem(SESSION) ? { uid: 'local-preview', email: 'local-preview', isAdmin: true, preview: true } : null; listeners.forEach((f) => f(u)); };

export const localPreviewAdapter = {
  kind: 'local-preview',
  writable: true,
  async load() { return normalizeCatalog(read() || (await fetchStaticCatalog())); },
  async upsert(col, item) {
    const c = read() || (await fetchStaticCatalog());
    const list = c[col] || [];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item; else list.push(item);
    write({ ...c, [col]: list });
  },
  async remove(col, id) {
    const c = read() || (await fetchStaticCatalog());
    write({ ...c, [col]: (c[col] || []).filter((x) => x.id !== id) });
  },
  async setConfig(key, value) {
    const c = read() || (await fetchStaticCatalog());
    write({ ...c, [key]: value });
  },
  async uploadImage(file) {
    // Resize + compress to keep localStorage small. Preview only.
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/webp', 0.8);
  },
  resetLocal() { localStorage.removeItem(KEY); },
  auth: {
    kind: 'local-preview',
    available: true,
    subscribe(cb) { listeners.add(cb); emit(); return () => listeners.delete(cb); },
    async signIn() { localStorage.setItem(SESSION, '1'); emit(); },
    async signOut() { localStorage.removeItem(SESSION); emit(); },
  },
};
