/**
 * Backend adapter contract (src/services/adapters/*):
 *
 *   kind:       'static' | 'local-preview' | 'firebase'
 *   writable:   boolean — can the admin persist changes?
 *   load():     Promise<Catalog>
 *   upsert(col, item):  Promise<void>        col ∈ COLLECTIONS
 *   remove(col, id):    Promise<void>
 *   setConfig(key, value): Promise<void>     key ∈ CONFIG_KEYS
 *   uploadImage(file, folder): Promise<string>  returns a URL/path stored on the record
 *   auth: { kind, subscribe(cb), signIn(...), signOut(), available }
 *
 * Catalog shape: see public/data/catalog.json
 */
export const COLLECTIONS = ['categories', 'brands', 'products', 'offers', 'coupons', 'banners'];
export const CONFIG_KEYS = ['home', 'settings'];

export class ReadOnlyError extends Error {
  constructor() { super('READ_ONLY_BACKEND'); this.code = 'READ_ONLY_BACKEND'; }
}

export async function fetchStaticCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`catalog.json ${res.status}`);
  return res.json();
}

/** Normalise partially-filled catalogs so the UI can rely on shape. */
export function normalizeCatalog(c) {
  const out = { ...c };
  for (const k of COLLECTIONS) out[k] = Array.isArray(c[k]) ? c[k] : [];
  out.home = c.home || { hero: { active: false }, sections: [] };
  out.settings = c.settings || {};
  return out;
}
