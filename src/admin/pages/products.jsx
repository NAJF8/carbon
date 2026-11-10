import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { useShop } from '../../store/shop.jsx';
import { navigate, Link } from '../../router.jsx';
import { ConfirmDialog, EmptyState, Img, Field, Spinner } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageHead } from '../components/CrudPage.jsx';
import { DataTable, useAction, L10n, Toggle, ImageGallery, StatusBadge } from '../components/common.jsx';
import { NumField } from './collections.jsx';
import { loc, slugify, uid, formatMoney } from '../../utils/format.js';
import { stockStatus } from '../../utils/pricing.js';
import { norm } from '../../utils/search.js';

const stockTone = { in: 'success', low: 'warning', out: 'danger' };

/* ───────── Product list ───────── */
export function ProductsList() {
  const { t, lang } = useI18n();
  const { catalog, upsert, remove } = useData();
  const { price } = useShop();
  const { run, busy } = useAction();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState('');
  const [sel, setSel] = useState([]);
  const [del, setDel] = useState(null); // product | 'bulk'

  const catMap = useMemo(() => Object.fromEntries(catalog.categories.map((c) => [c.id, c])), [catalog]);
  const brandMap = useMemo(() => Object.fromEntries(catalog.brands.map((b) => [b.id, b])), [catalog]);
  const rows = useMemo(() => catalog.products.filter((p) => {
    if (q && !norm(`${p.name.ar} ${p.name.en} ${p.sku}`).includes(norm(q))) return false;
    if (cat && p.categoryId !== cat) return false;
    if (status && (status === 'active') !== !!p.active) return false;
    if (stock && stockStatus(p) !== stock) return false;
    return true;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [catalog, q, cat, status, stock]);

  const patch = (p, changes) => run(() => upsert('products', { ...p, ...changes }));
  const duplicate = (p) => run(async () => {
    const id = uid('prod');
    const slug = `${p.slug || slugify(p.name.en)}-copy-${id.slice(-3)}`;
    await upsert('products', { ...structuredClone(p), id, slug, sku: '', active: false, createdAt: new Date().toISOString(), name: { ar: `${p.name.ar} (نسخة)`, en: `${p.name.en} (copy)` } });
  }, t('admin.products.duplicated'));
  const bulk = (changes) => run(async () => { for (const id of sel) { const p = catalog.products.find((x) => x.id === id); if (p) await upsert('products', { ...p, ...changes }); } setSel([]); }, t('admin.saved'));

  const cols = [
    { key: 'img', header: t('admin.image'), className: 'c-img', render: (p) => <span className="thumb">{p.images?.[0]?.src ? <Img src={p.images[0].src} alt="" ratio="1/1" /> : <span className="thumb-ph"><Icon name="image" size={18} /></span>}</span> },
    { key: 'name', header: t('admin.product'), render: (p) => <div className="cell-main"><Link to={`/admin/products/${p.id}`}><b>{loc(p.name, lang)}</b></Link><small>{p.sku ? <span dir="ltr">{p.sku}</span> : lang === 'ar' ? p.name.en : p.name.ar}</small></div> },
    { key: 'cat', header: t('admin.category'), render: (p) => loc(catMap[p.categoryId]?.name, lang) || '—' },
    { key: 'brand', header: t('admin.brand'), render: (p) => loc(brandMap[p.brandId]?.name, lang) || '—' },
    { key: 'price', header: t('admin.price'), render: (p) => { const pr = price(p); return <div className="cell-main"><b>{formatMoney(pr.price, lang)}</b>{pr.compareAt && <small><del>{formatMoney(pr.compareAt, lang)}</del></small>}</div>; } },
    { key: 'disc', header: t('admin.discount'), render: (p) => { const pr = price(p); return pr.percentOff ? <StatusBadge tone="success">-{pr.percentOff}%{pr.offer ? ` · ${loc(pr.offer.name, lang)}` : ''}</StatusBadge> : '—'; } },
    { key: 'stock', header: t('admin.stock'), render: (p) => <StatusBadge tone={stockTone[stockStatus(p)]}>{p.stock ?? 0} · {t(`stock.${stockStatus(p)}`)}</StatusBadge> },
    { key: 'status', header: t('admin.status'), render: (p) => <label className="mini-toggle"><input type="checkbox" role="switch" checked={!!p.active} onChange={() => patch(p, { active: !p.active })} aria-label={`${t('admin.active')}: ${loc(p.name, lang)}`} /><span aria-hidden="true"><i /></span>{p.active ? t('admin.active') : t('admin.inactive')}</label> },
    { key: 'feat', header: t('admin.featured'), render: (p) => <button type="button" className={`icon-btn ${p.featured ? 'is-on' : ''}`} aria-pressed={!!p.featured} onClick={() => patch(p, { featured: !p.featured })} aria-label={`${t('admin.featured')}: ${loc(p.name, lang)}`}><Icon name="star" fill={!!p.featured} size={18} /></button> },
    { key: 'actions', header: t('admin.actions'), className: 'c-actions', render: (p) => (
      <div className="row-actions">
        <Link to={`/admin/products/${p.id}`} className="icon-btn" aria-label={`${t('common.edit')}: ${loc(p.name, lang)}`}><Icon name="edit" size={18} /></Link>
        <button type="button" className="icon-btn" onClick={() => duplicate(p)} aria-label={`${t('admin.duplicate')}: ${loc(p.name, lang)}`}><Icon name="copy" size={18} /></button>
        <button type="button" className="icon-btn danger" onClick={() => setDel(p)} aria-label={`${t('common.delete')}: ${loc(p.name, lang)}`}><Icon name="trash" size={18} /></button>
      </div>) },
  ];

  const delName = del === 'bulk' ? t('admin.products.selected', { n: sel.length }) : del ? loc(del.name, lang) : '';
  return (
    <>
      <PageHead title={t('admin.nav.products')} subtitle={t('admin.products.sub')} actions={<Link to="/admin/products/new" className="btn btn-primary"><Icon name="plus" size={18} />{t('admin.products.new')}</Link>} />
      <DataTable columns={cols} rows={rows} selectable selected={sel} onSelect={setSel}
        toolbar={(
          <div className="dt-toolbar">
            <label className="shop-search"><Icon name="search" size={18} /><span className="sr-only">{t('common.search')}</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.products.search')} /></label>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t('admin.category')}><option value="">{t('admin.allCategories')}</option>{catalog.categories.filter((c) => c.kind !== 'offers').map((c) => <option key={c.id} value={c.id}>{loc(c.name, lang)}</option>)}</select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('admin.status')}><option value="">{t('admin.allStatuses')}</option><option value="active">{t('admin.active')}</option><option value="inactive">{t('admin.inactive')}</option></select>
            <select value={stock} onChange={(e) => setStock(e.target.value)} aria-label={t('admin.stock')}><option value="">{t('admin.allStock')}</option>{['in', 'low', 'out'].map((s) => <option key={s} value={s}>{t(`stock.${s}`)}</option>)}</select>
            {sel.length > 0 && (
              <div className="bulk-bar" role="region" aria-label={t('admin.bulk')}>
                <b>{t('admin.products.selected', { n: sel.length })}</b>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => bulk({ active: true })}>{t('admin.enable')}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => bulk({ active: false })}>{t('admin.disable')}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => bulk({ featured: true })}>{t('admin.markFeatured')}</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDel('bulk')}>{t('common.delete')}</button>
                <button type="button" className="text-link" onClick={() => setSel([])}>{t('common.cancel')}</button>
              </div>)}
          </div>)}
        empty={catalog.products.length === 0
          ? <EmptyState icon="box" title={t('empty.noProducts')} text={t('admin.products.emptyHint')} action={<Link to="/admin/products/new" className="btn btn-primary"><Icon name="plus" size={18} />{t('admin.products.new')}</Link>} />
          : <EmptyState icon="search" title={t('empty.noResults')} />} />
      <ConfirmDialog open={!!del} title={t('admin.deleteTitle')} message={t('admin.deleteMsg', { name: delName })} confirmLabel={t('common.delete')} busy={busy} onCancel={() => setDel(null)}
        onConfirm={async () => {
          const ok = await run(async () => { for (const id of del === 'bulk' ? sel : [del.id]) await remove('products', id); }, t('admin.deleted'));
          if (ok) { setDel(null); setSel([]); }
        }} />
    </>
  );
}

/* ───────── Product form ───────── */
const blank = () => ({
  id: uid('prod'), slug: '', sku: '', name: { ar: '', en: '' }, description: { ar: '', en: '' }, benefits: { ar: '', en: '' },
  categoryId: '', brandId: '', price: '', oldPrice: '', stock: 0, lowStockThreshold: 5, weight: '', size: '', sizes: [], colors: [],
  rating: '', reviewCount: '', tags: [], images: [], featured: false, bestseller: false, newArrival: false, active: true, createdAt: new Date().toISOString(),
});

export function ProductForm({ id }) {
  const { t, lang } = useI18n();
  const { catalog, upsert } = useData();
  const { run, busy } = useAction();
  const existing = id !== 'new' ? catalog.products.find((p) => p.id === id) : null;
  const [d, setD] = useState(() => (existing ? structuredClone(existing) : blank()));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [sizeIn, setSizeIn] = useState('');
  const [tagIn, setTagIn] = useState('');
  const [pct, setPct] = useState('');
  if (id !== 'new' && !existing) return <EmptyState icon="alert" tone="warning" title={t('notFound.title')} action={<Link to="/admin/products" className="btn btn-primary">{t('admin.nav.products')}</Link>} />;

  const set = (patch) => { setD((x) => ({ ...x, ...patch })); setDirty(true); };
  const cats = catalog.categories.filter((c) => c.kind !== 'offers');

  const validate = () => {
    const e = {};
    if (!d.name.ar.trim() || !d.name.en.trim()) e.name = t('admin.err.nameBoth');
    if (!d.categoryId) e.categoryId = t('admin.err.required');
    if (d.price === '' || Number(d.price) < 0) e.price = t('admin.err.required');
    if (d.oldPrice !== '' && Number(d.oldPrice) <= Number(d.price)) e.oldPrice = t('admin.err.oldPrice');
    if (d.rating !== '' && (d.rating < 0 || d.rating > 5)) e.rating = t('admin.err.rating');
    if (d.sku && catalog.products.some((p) => p.id !== d.id && p.sku && p.sku.toLowerCase() === d.sku.toLowerCase())) e.sku = t('admin.err.skuTaken');
    const slug = d.slug || slugify(d.name.en) || d.id;
    if (catalog.products.some((p) => p.id !== d.id && (p.slug || p.id) === slug)) e.slug = t('admin.err.slugTaken');
    setErrors(e);
    return !Object.keys(e).length;
  };
  const save = async () => {
    if (!validate()) { document.querySelector('.field.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const out = {
      ...d, slug: d.slug || slugify(d.name.en) || d.id, price: Number(d.price), oldPrice: d.oldPrice === '' ? 0 : Number(d.oldPrice),
      stock: Number(d.stock) || 0, lowStockThreshold: Number(d.lowStockThreshold) || 0, weight: d.weight === '' ? '' : Number(d.weight),
      rating: d.rating === '' ? null : Number(d.rating), reviewCount: d.reviewCount === '' ? 0 : Number(d.reviewCount),
    };
    if (await run(() => upsert('products', out), t('admin.saved'))) { setDirty(false); navigate('/admin/products'); }
  };
  const applyDiscount = () => {
    const p = Number(pct), price = Number(d.price);
    if (!(p > 0 && p < 100) || !(price > 0)) return;
    set({ oldPrice: price, price: Math.round(price * (1 - p / 100)) });
    setPct('');
  };
  const addColor = () => set({ colors: [...d.colors, { name: { ar: '', en: '' }, hex: '#111111' }] });
  const setColor = (i, c) => set({ colors: d.colors.map((x, k) => (k === i ? c : x)) });

  return (
    <>
      <PageHead title={existing ? loc(existing.name, lang) || t('admin.products.edit') : t('admin.products.new')}
        actions={<>
          <Link to="/admin/products" className="btn btn-ghost" onClick={(e) => { if (dirty && !confirm(t('admin.unsaved'))) e.preventDefault(); }}><Icon name="arrowL" size={18} className="flip-rtl-rev" />{t('common.cancel')}</Link>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy && <Spinner small />}{t('common.save')}</button>
        </>} />
      <div className="pf-grid">
        <div className="pf-main">
          <section className="card"><h2>{t('admin.pf.general')}</h2>
            <L10n label={t('admin.pf.name')} value={d.name} onChange={(name) => set({ name })} required error={errors.name} idBase="pf-name" />
            <L10n label={t('admin.pf.description')} value={d.description} onChange={(description) => set({ description })} textarea rows={4} idBase="pf-desc" />
            <L10n label={t('admin.pf.benefits')} value={d.benefits} onChange={(benefits) => set({ benefits })} textarea rows={3} idBase="pf-ben" />
            <p className="field-hint">{t('admin.pf.benefitsHint')}</p>
          </section>
          <section className="card"><h2>{t('admin.pf.images')}</h2>
            <ImageGallery images={d.images} onChange={(images) => set({ images })} folder="products" />
          </section>
          <section className="card"><h2>{t('admin.pf.variants')}</h2>
            <Field label={t('admin.pf.sizes')} hint={t('admin.pf.sizesHint')} htmlFor="pf-size-in">
              <div className="tag-input">
                {d.sizes.map((s) => <span key={s} className="chip-btn on">{s}<button type="button" onClick={() => set({ sizes: d.sizes.filter((x) => x !== s) })} aria-label={`${t('common.remove')} ${s}`}><Icon name="close" size={12} /></button></span>)}
                <input id="pf-size-in" dir="ltr" value={sizeIn} placeholder="S, M, L, XL…" onChange={(e) => setSizeIn(e.target.value)}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ',') && sizeIn.trim()) { e.preventDefault(); if (!d.sizes.includes(sizeIn.trim())) set({ sizes: [...d.sizes, sizeIn.trim()] }); setSizeIn(''); } }} />
              </div>
            </Field>
            <div className="colors-edit">
              <b>{t('admin.pf.colors')}</b>
              {d.colors.map((c, i) => (
                <div key={i} className="color-row">
                  <input type="color" value={c.hex} onChange={(e) => setColor(i, { ...c, hex: e.target.value })} aria-label={t('admin.pf.colorPick')} />
                  <input value={c.name.ar} lang="ar" dir="rtl" placeholder={t('admin.lang.ar')} onChange={(e) => setColor(i, { ...c, name: { ...c.name, ar: e.target.value } })} aria-label={`${t('admin.pf.colorName')} ${t('admin.lang.ar')}`} />
                  <input value={c.name.en} lang="en" dir="ltr" placeholder={t('admin.lang.en')} onChange={(e) => setColor(i, { ...c, name: { ...c.name, en: e.target.value } })} aria-label={`${t('admin.pf.colorName')} ${t('admin.lang.en')}`} />
                  <button type="button" className="icon-btn danger" onClick={() => set({ colors: d.colors.filter((_, k) => k !== i) })} aria-label={t('common.remove')}><Icon name="trash" size={16} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addColor}><Icon name="plus" size={16} />{t('admin.pf.addColor')}</button>
            </div>
          </section>
        </div>

        <div className="pf-side">
          <section className="card"><h2>{t('admin.pf.status')}</h2>
            <Toggle checked={d.active} onChange={(active) => set({ active })} label={t('admin.active')} hint={t('admin.pf.activeHint')} />
            <Toggle checked={d.featured} onChange={(featured) => set({ featured })} label={t('admin.featured')} />
            <Toggle checked={d.bestseller} onChange={(bestseller) => set({ bestseller })} label={t('admin.bestseller')} />
            <Toggle checked={d.newArrival} onChange={(newArrival) => set({ newArrival })} label={t('admin.newArrival')} />
          </section>
          <section className="card"><h2>{t('admin.pf.organize')}</h2>
            <Field label={t('admin.category')} htmlFor="pf-cat" error={errors.categoryId} required>
              <select id="pf-cat" value={d.categoryId} onChange={(e) => set({ categoryId: e.target.value })}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{loc(c.name, lang)}</option>)}</select>
            </Field>
            <Field label={t('admin.brand')} htmlFor="pf-brand" hint={!catalog.brands.length ? t('admin.noBrandsYet') : undefined}>
              <select id="pf-brand" value={d.brandId} onChange={(e) => set({ brandId: e.target.value })}><option value="">—</option>{catalog.brands.map((b) => <option key={b.id} value={b.id}>{loc(b.name, lang)}{b.active ? '' : ` (${t('admin.inactive')})`}</option>)}</select>
            </Field>
            <Field label="SKU" htmlFor="pf-sku" error={errors.sku}><input id="pf-sku" dir="ltr" value={d.sku} onChange={(e) => set({ sku: e.target.value })} /></Field>
            <Field label="Slug" hint={t('admin.slugHint')} htmlFor="pf-slug" error={errors.slug}><input id="pf-slug" dir="ltr" value={d.slug} placeholder={slugify(d.name.en)} onChange={(e) => set({ slug: slugify(e.target.value) })} /></Field>
            <Field label={t('admin.pf.tags')} hint={t('admin.pf.tagsHint')} htmlFor="pf-tag">
              <div className="tag-input">
                {d.tags.map((s) => <span key={s} className="chip-btn on">{s}<button type="button" onClick={() => set({ tags: d.tags.filter((x) => x !== s) })} aria-label={`${t('common.remove')} ${s}`}><Icon name="close" size={12} /></button></span>)}
                <input id="pf-tag" value={tagIn} onChange={(e) => setTagIn(e.target.value)} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ',') && tagIn.trim()) { e.preventDefault(); if (!d.tags.includes(tagIn.trim())) set({ tags: [...d.tags, tagIn.trim()] }); setTagIn(''); } }} />
              </div>
            </Field>
          </section>
          <section className="card"><h2>{t('admin.pf.pricing')}</h2>
            <NumField id="pf-price" label={`${t('admin.price')} (IQD)`} value={d.price} onChange={(price) => set({ price })} error={errors.price} required />
            <NumField id="pf-old" label={`${t('admin.oldPrice')} (IQD)`} value={d.oldPrice} onChange={(oldPrice) => set({ oldPrice })} error={errors.oldPrice} hint={t('admin.pf.oldPriceHint')} />
            <div className="quick-disc">
              <Field label={t('admin.pf.quickDiscount')} htmlFor="pf-pct" hint={t('admin.pf.quickDiscountHint')}>
                <div className="input-row"><input id="pf-pct" type="number" min="1" max="99" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="%" /><button type="button" className="btn btn-outline" onClick={applyDiscount}>{t('admin.pf.apply')}</button></div>
              </Field>
            </div>
          </section>
          <section className="card"><h2>{t('admin.pf.inventory')}</h2>
            <NumField id="pf-stock" label={t('admin.stock')} value={d.stock} onChange={(stock) => set({ stock })} />
            <NumField id="pf-low" label={t('admin.pf.lowThreshold')} value={d.lowStockThreshold} onChange={(lowStockThreshold) => set({ lowStockThreshold })} hint={t('admin.pf.lowHint')} />
            <p><StatusBadge tone={stockTone[stockStatus(d)]}>{t(`stock.${stockStatus(d)}`)}</StatusBadge></p>
          </section>
          <section className="card"><h2>{t('admin.pf.details')}</h2>
            <Field label={t('admin.pf.size')} hint={t('admin.pf.sizeHint')} htmlFor="pf-sz"><input id="pf-sz" dir="ltr" value={d.size} onChange={(e) => set({ size: e.target.value })} placeholder="2.27 kg" /></Field>
            <NumField id="pf-w" label={`${t('admin.pf.weight')} (${t('spec.kg')})`} value={d.weight} onChange={(weight) => set({ weight })} step={0.01} />
            <NumField id="pf-rating" label={t('admin.pf.rating')} value={d.rating} onChange={(rating) => set({ rating })} step={0.1} error={errors.rating} hint={t('admin.pf.ratingHint')} />
            <NumField id="pf-rc" label={t('admin.pf.reviewCount')} value={d.reviewCount} onChange={(reviewCount) => set({ reviewCount })} />
          </section>
        </div>
      </div>
      <div className="pf-savebar"><button type="button" className="btn btn-primary btn-lg" onClick={save} disabled={busy}>{busy && <Spinner small />}{t('common.save')}</button></div>
    </>
  );
}
