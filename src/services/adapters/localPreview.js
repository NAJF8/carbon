import { fetchStaticCatalog, normalizeCatalog } from '../contract.js';

/**
 * FRONTEND DEMO / LOCAL MANAGEMENT UI adapter.
 * Stores demo modifications in browser localStorage so the CMS and storefront can be fully tested.
 * Clearly labeled as Demo Mode / Frontend Preview without pretending to be a real production backend.
 */
const KEY = 'carbon-demo-catalog-v2';
const SESSION = 'carbon-demo-session';
const listeners = new Set();

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (c) => localStorage.setItem(KEY, JSON.stringify(c));
const emit = () => {
  const u = localStorage.getItem(SESSION)
    ? { uid: 'demo-admin', email: 'demo@carbon.local', name: 'Demo Admin', isAdmin: true, preview: true }
    : null;
  listeners.forEach((f) => f(u));
};

export const localPreviewAdapter = {
  kind: 'local-preview',
  writable: true,
  async load() {
    const initial = await fetchStaticCatalog();
    const local = read();
    if (!local) return normalizeCatalog(initial);
    return normalizeCatalog({ ...initial, ...local });
  },
  async upsert(col, item) {
    const c = read() || (await fetchStaticCatalog());
    const list = [...(c[col] || [])];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item;
    else list.unshift(item);
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
    // Compress image to compact WebP DataURL for local storage demo
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(bmp.width * scale));
    cv.height = Math.max(1, Math.round(bmp.height * scale));
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/webp', 0.8);
  },
  resetLocal() {
    localStorage.removeItem(KEY);
  },
  auth: {
    kind: 'local-preview',
    available: true,
    subscribe(cb) {
      listeners.add(cb);
      emit();
      return () => listeners.delete(cb);
    },
    async signIn() {
      localStorage.setItem(SESSION, '1');
      emit();
    },
    async signOut() {
      localStorage.removeItem(SESSION);
      emit();
    },
  },
};
