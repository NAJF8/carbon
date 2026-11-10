import { fetchStaticCatalog, normalizeCatalog, ReadOnlyError } from '../contract.js';

/**
 * Production default when no backend is configured (pure GitHub Pages).
 * Public site reads public/data/catalog.json. Nothing can be written and there is
 * NO admin authentication — the admin area shows a "backend required" screen.
 */
export const staticAdapter = {
  kind: 'static',
  writable: false,
  async load() { return normalizeCatalog(await fetchStaticCatalog()); },
  async upsert() { throw new ReadOnlyError(); },
  async remove() { throw new ReadOnlyError(); },
  async setConfig() { throw new ReadOnlyError(); },
  async uploadImage() { throw new ReadOnlyError(); },
  auth: { kind: 'none', available: false, subscribe(cb) { cb(null); return () => {}; }, async signIn() { throw new ReadOnlyError(); }, async signOut() {} },
};
