import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { useDebounced } from '../../hooks/index.js';
import { Overlay, Img, Spinner } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { searchProducts } from '../../utils/search.js';
import { formatMoney, loc } from '../../utils/format.js';
import { navigate, buildQuery } from '../../router.jsx';

const RKEY = 'carbon-recent-searches';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || []; } catch { return []; } };

export default function SearchOverlay() {
  const { ui, openUi, price } = useShop();
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(readRecent);
  const dq = useDebounced(q, 220);
  const typing = q.trim() !== dq.trim();
  const listRef = useRef(null);
  const close = () => openUi({ search: false });

  useEffect(() => { if (ui.search) { setQ(''); setRecent(readRecent()); } }, [ui.search]);

  const products = useMemo(() => (catalog?.products || []).filter((p) => p.active), [catalog]);
  const brandName = (p) => loc(catalog.brands.find((b) => b.id === p.brandId)?.name, 'en') + ' ' + loc(catalog.brands.find((b) => b.id === p.brandId)?.name, 'ar');
  const catName = (p) => { const c = catalog.categories.find((x) => x.id === p.categoryId); return c ? `${c.name.ar} ${c.name.en}` : ''; };
  const results = useMemo(() => (dq.trim() ? searchProducts(products, dq, brandName, catName).slice(0, 8) : []), [dq, products]); // eslint-disable-line

  const popular = useMemo(() => {
    const cats = catalog.categories.filter((c) => c.active && c.kind !== 'offers').slice(0, 4).map((c) => ({ label: loc(c.name, lang), q: loc(c.name, lang) }));
    const best = products.filter((p) => p.bestseller).slice(0, 3).map((p) => ({ label: loc(p.name, lang), q: loc(p.name, lang) }));
    return [...cats, ...best];
  }, [catalog, products, lang]);

  const remember = (v) => localStorage.setItem(RKEY, JSON.stringify([v, ...readRecent().filter((x) => x !== v)].slice(0, 6)));
  const submit = (term) => {
    const v = (term ?? q).trim();
    if (!v) return;
    remember(v);
    close();
    navigate(`/shop${buildQuery({ q: v })}`);
  };
  const onKey = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const items = [...(listRef.current?.querySelectorAll('a') || [])];
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement);
    const n = e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? -1 : i - 1);
    (n === -1 ? document.getElementById('search-in') : items[n]).focus();
  };

  return (
    <Overlay open={ui.search} onClose={close} title={t('search.title')} size="lg" className="search-ov">
      <form role="search" className="search-form" onSubmit={(e) => { e.preventDefault(); submit(); }} onKeyDown={onKey}>
        <Icon name="search" />
        <input id="search-in" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} autoFocus autoComplete="off" enterKeyHint="search" aria-label={t('search.title')} />
        {typing && <Spinner small />}
      </form>
      <div ref={listRef} onKeyDown={onKey}>
        {dq.trim() ? (
          <>
            <p className="sr-count" role="status">{t('search.count', { n: results.length })}</p>
            {results.length > 0 ? (
              <ul className="sr-list">
                {results.map((p) => (
                  <li key={p.id}>
                    <a className="sr-item" href={`#/product/${p.slug || p.id}`} onClick={() => { remember(dq.trim()); close(); }}>
                      <Img src={p.images?.[0]?.src} alt="" ratio="1/1" />
                      <span className="sr-name">{loc(p.name, lang)}</span>
                      <b>{formatMoney(price(p).price, lang)}</b>
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p className="muted pad">{t('search.none', { q: dq })}</p>}
            {results.length > 0 && <button type="button" className="btn btn-outline block" onClick={() => submit(dq)}>{t('search.viewAll')}</button>}
          </>
        ) : (
          <div className="search-hints">
            {recent.length > 0 && (
              <section>
                <div className="hint-head"><h3>{t('search.recent')}</h3>
                  <button type="button" className="text-link" onClick={() => { localStorage.removeItem(RKEY); setRecent([]); }}>{t('search.clear')}</button></div>
                <div className="chips">{recent.map((r) => <button key={r} type="button" className="chip-btn" onClick={() => submit(r)}><Icon name="refresh" size={14} />{r}</button>)}</div>
              </section>
            )}
            {popular.length > 0 && (
              <section>
                <h3>{t('search.popular')}</h3>
                <div className="chips">{popular.map((r) => <button key={r.q} type="button" className="chip-btn" onClick={() => submit(r.q)}><Icon name="flame" size={14} />{r.label}</button>)}</div>
              </section>
            )}
            {!recent.length && !popular.length && <p className="muted pad">{t('search.hintEmpty')}</p>}
          </div>
        )}
      </div>
    </Overlay>
  );
}
