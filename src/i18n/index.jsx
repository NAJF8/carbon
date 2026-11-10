import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ar from './ar.js';
import en from './en.js';

const DICTS = { ar, en };
const I18nCtx = createContext(null);
export const LANGS = ['ar', 'en'];

const stored = () => { try { return localStorage.getItem('carbon-lang'); } catch { return null; } };

export function I18nProvider({ children, defaultLang = 'ar' }) {
  const [lang, setLangState] = useState(() => (LANGS.includes(stored()) ? stored() : defaultLang));
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const d = document.documentElement;
    d.lang = lang; d.dir = dir;
    try { localStorage.setItem('carbon-lang', lang); } catch { /* storage unavailable */ }
  }, [lang, dir]);

  const setLang = useCallback((l) => LANGS.includes(l) && setLangState(l), []);
  const t = useCallback((key, vars) => {
    let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
