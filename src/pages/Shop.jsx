import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useData } from '../store/data.jsx';
import { useShop } from '../store/shop.jsx';
import { navigate, buildQuery, Link } from '../router.jsx';
import { searchProducts } from '../utils/search.js';
import { loc, formatMoney } from '../utils/format.js';
import { stockStatus } from '../utils/pricing.js';
import { useSeo } from '../utils/seo.js';
import { useReveal, useDebounced } from '../hooks/index.js';
import ProductCard from '../components/shop/ProductCard.jsx';
import { EmptyState, Overlay } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';

const PAGE = 12;
const csv = (v) => (v ? v.split(',').filter(Boolean) : []);

function readState(q) {
  return {
    q: q.get('q') || '', cat: q.get('cat') || '', brand: csv(q.get('brand')), min: q.get('min') || '', max: q.get('max') || '',
    rating: q.get('rating') || '', stock: q.get('stock') || '', size: csv(q.get('size')), color: csv(q.get('color')),
    sort: q.get('sort') || 'default', page: Math.max(1, Number(q.get('page')) || 1), flag: q.get('flag') || '',
  };
}

export default function Shop({ route }) {
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const { price } = useShop();
  const [sheet, setSheet] = useState(false);
  const st = readState(route.query);
  const set = (patch) => navigate(`/shop${buildQuery({ ...st, page: 1, ...patch })}`);
  const topRef = useRef(null);

  const active = useMemo(() => catalog.products.filter((p) => p.active), [catalog]);
  const brandMap = useMemo(() => Object.fromEntries(catalog.brands.map((b) => [b.id, b])), [catalog]);
  const catMap = useMemo(() => Object.fromEntries(catalog.categories.map((c) => [c.id, c])), [catalog]);
  const catObj = catalog.categories.find((c) => c.slug === st.cat || c.id === st.cat);
  const offersCat = catObj?.kind === 'offers';

  const facets = useMemo(() => {
    const brands = [...new Set(active.map((p) => p.brandId).filter(Boolean))].map((id) => brandMap[id]).filter(Boolean);
    const sizes = [...new Set(active.flatMap((p) => p.sizes || []))];
    const colors = [...new Map(active.flatMap((p) => p.colors || []).map((c) => [c.hex, c])).values()];
    const prices = active.map((p) => price(p).price);
    return { brands, sizes, colors, minP: prices.length ? Math.min(...prices) : 0, maxP: prices.length ? Math.max(...prices) : 0 };
  }, [active, brandMap, price]);

  const filtered = useMemo(() => {
    let list = active;
    if (st.q) list = searchProducts(list, st.q, (p) => { const b = brandMap[p.brandId]; return b ? `${b.name.ar} ${b.name.en}` : ''; }, (p) => { const c = catMap[p.categoryId]; return c ? `${c.name.ar} ${c.name.en}` : ''; });
    if (catObj && !offersCat) list = list.filter((p) => p.categoryId === catObj.id);
    if (offersCat || st.flag === 'offers') list = list.filter((p) => price(p).percentOff > 0);
    if (st.flag === 'bestseller') list = list.filter((p) => p.bestseller);
    if (st.flag === 'new') list = list.filter((p) => p.newArrival);
    if (st.flag === 'featured') list = list.filter((p) => p.featured);
    if (st.brand.length) list = list.filter((p) => st.brand.includes(p.brandId));
    if (st.min) list = list.filter((p) => price(p).price >= Number(st.min));
    if (st.max) list = list.filter((p) => price(p).price <= Number(st.max));
    if (st.rating) list = list.filter((p) => (p.rating || 0) >= Number(st.rating));
    if (st.stock) list = list.filter((p) => stockStatus(p) !== 'out');
    if (st.size.length) list = list.filter((p) => (p.sizes || []).some((s) => st.size.includes(s)));
    if (st.color.length) list = list.filter((p) => (p.colors || []).some((c) => st.color.includes(c.hex)));
    const sorters = {
      new: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
      'price-asc': (a, b) => price(a).price - price(b).price,
      'price-desc': (a, b) => price(b).price - price(a).price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      discount: (a, b) => price(b).percentOff - price(a).percentOff,
    };
    return sorters[st.sort] ? [...list].sort(sorters[st.sort]) : list;
  }, [active, st.q, st.cat, st.flag, st.brand.join(), st.min, st.max, st.rating, st.stock, st.size.join(), st.color.join(), st.sort, catObj, offersCat, price, brandMap, catMap]); // eslint-disable-line

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const page = Math.min(st.page, pages);
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const ref = useReveal([visible.map((p) => p.id).join(), lang]);

  useEffect(() => { if (st.page > 1) topRef.current?.scrollIntoView({ block: 'start' }); }, [st.page]);

  const title = catObj ? loc(catObj.name, lang) : t('nav.shop');
  useSeo({ title: `${title} | ${loc(catalog.settings.store?.name, lang)}`, description: t('seo.shopDesc'), path: `/shop${buildQuery({ cat: st.cat })}`, lang });

  const chips = [
    st.q && { k: 'q', label: `“${st.q}”`, clear: { q: '' } },
    catObj && { k: 'cat', label: loc(catObj.name, lang), clear: { cat: '' } },
    st.flag && { k: 'flag', label: t(`flag.${st.flag}`), clear: { flag: '' } },
    ...st.brand.map((id) => ({ k: 'b' + id, label: loc(brandMap[id]?.name, lang), clear: { brand: st.brand.filter((x) => x !== id) } })),
    (st.min || st.max) && { k: 'price', label: `${st.min ? formatMoney(st.min, lang) : '0'} – ${st.max ? formatMoney(st.max, lang) : '∞'}`, clear: { min: '', max: '' } },
    st.rating && { k: 'rating', label: `${st.rating}★+`, clear: { rating: '' } },
    st.stock && { k: 'stock', label: t('filter.inStock'), clear: { stock: '' } },
    ...st.size.map((s) => ({ k: 's' + s, label: s, clear: { size: st.size.filter((x) => x !== s) } })),
    ...st.color.map((c) => ({ k: 'c' + c, label: loc(facets.colors.find((x) => x.hex === c)?.name, lang) || c, clear: { color: st.color.filter((x) => x !== c) } })),
  ].filter(Boolean);

  const panel = <FilterPanel st={st} set={set} facets={facets} cats={catalog.categories.filter((c) => c.active)} active={active} />;

  return (
    <div className="container shop" ref={ref}>
      <nav className="crumbs" aria-label="breadcrumb"><Link to="/">{t('nav.home')}</Link><Icon name="chevR" size={14} className="flip-rtl" /><span aria-current="page">{title}</span></nav>
      <div className="shop-head" ref={topRef}>
        <h1>{title}</h1>
        <p className="muted" role="status" aria-live="polite">{t('shop.results', { n: filtered.length })}</p>
      </div>
      <div className="shop-layout">
        <aside className="filters-side" aria-label={t('filter.title')}>{panel}</aside>
        <div className="shop-main">
          <div className="shop-bar">
            <SearchBox value={st.q} onCommit={(q) => set({ q })} />
            <button type="button" className="btn btn-outline filter-open" onClick={() => setSheet(true)}><Icon name="filter" size={18} />{t('filter.title')}{chips.length > 0 && <b className="count in">{chips.length}</b>}</button>
            <label className="sort">
              <span className="sr-only">{t('shop.sort')}</span>
              <Icon name="sort" size={16} />
              <select value={st.sort} onChange={(e) => set({ sort: e.target.value })}>
                {['default', 'new', 'price-asc', 'price-desc', 'rating', 'discount'].map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
              </select>
            </label>
          </div>
          {chips.length > 0 && (
            <ul className="active-chips" aria-label={t('filter.active')}>
              {chips.map((c) => <li key={c.k}><button type="button" className="chip-btn on" onClick={() => set(c.clear)} aria-label={`${t('common.remove')}: ${c.label}`}>{c.label}<Icon name="close" size={14} /></button></li>)}
              <li><button type="button" className="text-link" onClick={() => navigate('/shop')}>{t('filter.reset')}</button></li>
            </ul>
          )}
          {visible.length > 0 ? (
            <>
              <div className="p-grid">{visible.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
              {pages > 1 && <Pagination page={page} pages={pages} go={(n) => set({ page: n })} />}
            </>
          ) : active.length === 0 ? (
            <EmptyState icon="box" title={t('empty.noProducts')} text={t('empty.noProductsText')} />
          ) : (
            <EmptyState icon="search" title={t('empty.noResults')} text={t('empty.noResultsText')}
              action={<button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>{t('filter.reset')}</button>} />
          )}
        </div>
      </div>
      <Overlay open={sheet} onClose={() => setSheet(false)} variant="sheet" title={t('filter.title')} className="filter-sheet"
        footer={<button type="button" className="btn btn-primary block" onClick={() => setSheet(false)}>{t('filter.show', { n: filtered.length })}</button>}>
        {panel}
      </Overlay>
    </div>
  );
}

function SearchBox({ value, onCommit }) {
  const { t } = useI18n();
  const [v, setV] = useState(value);
  const d = useDebounced(v, 350);
  useEffect(() => setV(value), [value]);
  useEffect(() => { if (d !== value) onCommit(d); }, [d]); // eslint-disable-line
  return (
    <label className="shop-search"><Icon name="search" size={18} /><span className="sr-only">{t('search.title')}</span>
      <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={t('search.placeholder')} /></label>
  );
}

function FilterPanel({ st, set, facets, cats, active }) {
  const { lang, t } = useI18n();
  const [min, setMin] = useState(st.min);
  const [max, setMax] = useState(st.max);
  useEffect(() => { setMin(st.min); setMax(st.max); }, [st.min, st.max]);
  const toggle = (key, val) => set({ [key]: st[key].includes(val) ? st[key].filter((x) => x !== val) : [...st[key], val] });
  const catCount = (id) => active.filter((p) => p.categoryId === id).length;
  const noFilters = !active.length;
  if (noFilters) return <p className="muted">{t('filter.noData')}</p>;
  return (
    <div className="filter-panel">
      <details open><summary>{t('filter.category')}</summary>
        <ul className="f-list">
          <li><label><input type="radio" name="cat" checked={!st.cat} onChange={() => set({ cat: '' })} />{t('filter.all')}</label></li>
          {cats.map((c) => (
            <li key={c.id}><label><input type="radio" name="cat" checked={st.cat === (c.slug || c.id)} onChange={() => set({ cat: c.slug || c.id })} />
              {loc(c.name, lang)}{c.kind !== 'offers' && <small>{catCount(c.id)}</small>}</label></li>
          ))}
        </ul></details>
      {facets.brands.length > 0 && (
        <details open><summary>{t('filter.brand')}</summary>
          <ul className="f-list">{facets.brands.map((b) => <li key={b.id}><label><input type="checkbox" checked={st.brand.includes(b.id)} onChange={() => toggle('brand', b.id)} />{loc(b.name, lang)}</label></li>)}</ul></details>
      )}
      <details open><summary>{t('filter.price')}</summary>
        <form className="price-range" onSubmit={(e) => { e.preventDefault(); set({ min, max }); }}>
          <input type="number" inputMode="numeric" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder={String(facets.minP)} aria-label={t('filter.min')} />
          <span aria-hidden="true">–</span>
          <input type="number" inputMode="numeric" min="0" value={max} onChange={(e) => setMax(e.target.value)} placeholder={String(facets.maxP)} aria-label={t('filter.max')} />
          <button type="submit" className="btn btn-outline btn-sm">{t('filter.apply')}</button>
        </form></details>
      <details open><summary>{t('filter.rating')}</summary>
        <ul className="f-list">{[4, 3].map((r) => <li key={r}><label><input type="radio" name="rating" checked={st.rating === String(r)} onChange={() => set({ rating: String(r) })} /><span className="stars-inline">{r}<Icon name="star" size={14} fill /> {t('filter.andUp')}</span></label></li>)}
          {st.rating && <li><button type="button" className="text-link" onClick={() => set({ rating: '' })}>{t('filter.clear')}</button></li>}</ul></details>
      <details open><summary>{t('filter.availability')}</summary>
        <ul className="f-list"><li><label><input type="checkbox" checked={!!st.stock} onChange={(e) => set({ stock: e.target.checked ? '1' : '' })} />{t('filter.inStock')}</label></li></ul></details>
      {facets.sizes.length > 0 && (
        <details open><summary>{t('filter.size')}</summary>
          <div className="chips">{facets.sizes.map((s) => <label key={s} className={`chip ${st.size.includes(s) ? 'on' : ''}`}><input type="checkbox" checked={st.size.includes(s)} onChange={() => toggle('size', s)} /><span dir="ltr">{s}</span></label>)}</div></details>
      )}
      {facets.colors.length > 0 && (
        <details open><summary>{t('filter.color')}</summary>
          <div className="chips">{facets.colors.map((c) => <label key={c.hex} className={`swatch ${st.color.includes(c.hex) ? 'on' : ''}`} title={loc(c.name, lang)}><input type="checkbox" checked={st.color.includes(c.hex)} onChange={() => toggle('color', c.hex)} aria-label={loc(c.name, lang)} /><i style={{ background: c.hex }} /></label>)}</div></details>
      )}
    </div>
  );
}

export function Pagination({ page, pages, go }) {
  const { t } = useI18n();
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return (
    <nav className="pagination" aria-label={t('common.pagination')}>
      <button type="button" className="pg" onClick={() => go(page - 1)} disabled={page <= 1} aria-label={t('common.previous')}><Icon name="chevL" size={16} className="flip-rtl" /></button>
      {nums.map((n, i) => n === '…' ? <span key={'e' + i} className="pg-gap">…</span>
        : <button key={n} type="button" className={`pg ${n === page ? 'on' : ''}`} onClick={() => go(n)} aria-current={n === page ? 'page' : undefined} aria-label={t('common.pageN', { n })}>{n}</button>)}
      <button type="button" className="pg" onClick={() => go(page + 1)} disabled={page >= pages} aria-label={t('common.next')}><Icon name="chevR" size={16} className="flip-rtl" /></button>
    </nav>
  );
}
