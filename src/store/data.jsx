import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAdapter } from '../services/backend.js';
import { normalizeCatalog } from '../services/contract.js';

const Ctx = createContext(null);

/**
 * Holds the whole catalog (categories, brands, products, offers, coupons, banners, home, settings).
 * Catalogs for a shop of this size are small; one load keeps navigation instant.
 */
export function DataProvider({ children }) {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [adapter, setAdapter] = useState(null);
  const loadId = useRef(0);

  const load = useCallback(async () => {
    const id = ++loadId.current;
    setError(null);
    try {
      const a = await getAdapter();
      const c = await a.load();
      if (id !== loadId.current) return;
      setAdapter(a); setCatalog(c);
    } catch (e) {
      if (id === loadId.current) setError(e);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  /** Admin mutations: persist first, then update memory — UI never shows unsaved data as saved. */
  const upsert = useCallback(async (col, item) => {
    await adapter.upsert(col, item);
    setCatalog((c) => {
      const list = c[col].some((x) => x.id === item.id) ? c[col].map((x) => (x.id === item.id ? item : x)) : [...c[col], item];
      return { ...c, [col]: list };
    });
  }, [adapter]);
  const remove = useCallback(async (col, id) => {
    await adapter.remove(col, id);
    setCatalog((c) => ({ ...c, [col]: c[col].filter((x) => x.id !== id) }));
  }, [adapter]);
  const setConfig = useCallback(async (key, value) => {
    await adapter.setConfig(key, value);
    setCatalog((c) => ({ ...c, [key]: value }));
  }, [adapter]);

  const value = useMemo(() => ({
    catalog: catalog && normalizeCatalog(catalog), loading: !catalog && !error, error, reload: load, adapter, upsert, remove, setConfig,
  }), [catalog, error, load, adapter, upsert, remove, setConfig]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);
