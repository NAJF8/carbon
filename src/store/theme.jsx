import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
const KEY = 'carbon-theme';
const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children, defaultMode = 'system' }) {
  const [mode, setModeState] = useState(() => { try { return localStorage.getItem(KEY) || defaultMode; } catch { return defaultMode; } });
  const [sysDark, setSysDark] = useState(() => mq().matches);

  useEffect(() => {
    const m = mq();
    const on = (e) => setSysDark(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);

  const resolved = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0d1210' : '#ffffff');
  }, [resolved]);

  const setMode = useCallback((m) => { setModeState(m); try { localStorage.setItem(KEY, m); } catch { /* ignore */ } }, []);
  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
