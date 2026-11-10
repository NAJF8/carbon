import { useEffect, useState, useCallback } from 'react';

/**
 * Minimal hash router. GitHub Pages cannot rewrite unknown paths to index.html,
 * so "#/shop?cat=protein" style URLs are the robust choice for a static deployment.
 */
function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path.replace(/\/+$/, '') || '/', query: new URLSearchParams(qs) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (to, { replace = false } = {}) => {
  const url = `#${to}`;
  if (replace) window.location.replace(url); else window.location.hash = to;
  return url;
};

export function Link({ to, children, onClick, ...rest }) {
  const handle = useCallback((e) => { onClick?.(e); }, [onClick]);
  return <a href={`#${to}`} onClick={handle} {...rest}>{children}</a>;
}

export function buildQuery(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null && !(Array.isArray(v) && !v.length)) p.set(k, Array.isArray(v) ? v.join(',') : v); });
  const s = p.toString();
  return s ? `?${s}` : '';
}
