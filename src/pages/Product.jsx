import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useData } from '../store/data.jsx';
import { useShop } from '../store/shop.jsx';
import { Link } from '../router.jsx';
import { useSeo } from '../utils/seo.js';
import { loc } from '../utils/format.js';
import { asset } from '../utils/assets.js';
import { stockStatus } from '../utils/pricing.js';
import { useReveal } from '../hooks/index.js';
import { Img, Rating, EmptyState } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';
import { PriceBlock, ProductName, PurchasePanel, StockBadge, useLookup } from '../components/shop/ProductBits.jsx';
import { ProductCarousel } from '../components/shop/sections.jsx';
import { NotFoundPage as NotFound } from './misc.jsx';

function Gallery({ images, name }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const main = useRef(null);
  useEffect(() => setI(0), [images]);
  const imgs = images?.length ? images : [{ src: '' }];
  const move = (e) => {
    const r = main.current.getBoundingClientRect();
    main.current.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    main.current.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const step = (d) => setI((x) => (x + d + imgs.length) % imgs.length);
  return (
    <div className="gallery">
      <div className={`g-main ${zoom ? 'zoomed' : ''}`} ref={main} data-gallery-main onPointerMove={zoom ? move : undefined}
        onPointerLeave={() => setZoom(false)}>
        <div key={i} className="g-slide">
          <Img src={imgs[i].src} alt={imgs[i].alt || name} eager ratio="1/1" />
        </div>
        {imgs[i].src && <button type="button" className="icon-btn g-zoom" onClick={() => setZoom((z) => !z)} aria-pressed={zoom} aria-label={t('product.zoom')}><Icon name="zoom" /></button>}
        {imgs.length > 1 && (<>
          <button type="button" className="icon-btn g-nav prev" onClick={() => step(-1)} aria-label={t('common.previous')}><Icon name="chevL" className="flip-rtl" /></button>
          <button type="button" className="icon-btn g-nav next" onClick={() => step(1)} aria-label={t('common.next')}><Icon name="chevR" className="flip-rtl" /></button>
        </>)}
      </div>
      {imgs.length > 1 && (
        <ul className="g-thumbs" aria-label={t('product.gallery')}>
          {imgs.map((im, k) => (
            <li key={k}><button type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${t('product.image')} ${k + 1}`} aria-current={k === i}><Img src={im.src} alt="" ratio="1/1" /></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductPage({ slug }) {
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const { pushRecent, recent, price } = useShop();
  const { cat, brand } = useLookup();
  const [tab, setTab] = useState('desc');
  const p = catalog.products.find((x) => (x.slug || x.id) === slug && x.active);
  const ref = useReveal([p?.id, lang]);

  useEffect(() => { if (p) { pushRecent(p.id); setTab('desc'); } }, [p?.id]); // eslint-disable-line

  const pr = p ? price(p) : null;
  const jsonLd = useMemo(() => p && ({
    '@context': 'https://schema.org', '@type': 'Product', name: loc(p.name, lang), sku: p.sku || undefined,
    description: loc(p.description, lang) || undefined,
    image: (p.images || []).map((i) => (i.src?.startsWith('http') ? i.src : 'https://najf8.github.io/carbon/' + i.src)).filter(Boolean),
    brand: brand(p.brandId) ? { '@type': 'Brand', name: loc(brand(p.brandId).name, 'en') } : undefined,
    aggregateRating: p.rating && p.reviewCount ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
    offers: { '@type': 'Offer', priceCurrency: 'IQD', price: pr.price, availability: stockStatus(p) === 'out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: `https://najf8.github.io/carbon/#/product/${p.slug || p.id}` },
  }), [p, lang, pr]); // eslint-disable-line
  useSeo({ title: p ? `${loc(p.name, lang)} | ${loc(catalog.settings.store?.name, lang)}` : t('notFound.title'), description: p ? (loc(p.description, lang) || '').slice(0, 155) : '', path: `/product/${slug}`, image: p?.images?.[0]?.src ? asset(p.images[0].src) : undefined, jsonLd, lang });

  if (!p) return <NotFound />;
  const c = cat(p.categoryId); const b = brand(p.brandId);
  const related = catalog.products.filter((x) => x.active && x.id !== p.id && x.categoryId === p.categoryId).slice(0, 10);
  const viewed = recent.filter((id) => id !== p.id).map((id) => catalog.products.find((x) => x.id === id && x.active)).filter(Boolean).slice(0, 10);
  const benefits = loc(p.benefits, lang).split('\n').map((s) => s.trim()).filter(Boolean);
  const specs = [
    [t('spec.brand'), b && loc(b.name, lang)], [t('spec.category'), c && loc(c.name, lang)], [t('spec.sku'), p.sku],
    [t('spec.size'), p.size], [t('spec.weight'), p.weight && `${p.weight} ${t('spec.kg')}`], [t('spec.tags'), (p.tags || []).join(', ')],
  ].filter(([, v]) => v);
  const tabs = [['desc', t('product.description')], ['benefits', t('product.benefits')], ['specs', t('product.specs')]];
  if (catalog.settings.general?.reviewsEnabled) tabs.push(['reviews', t('product.reviews')]);
  const onTabKey = (e) => {
    const i = tabs.findIndex(([k]) => k === tab);
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
    e.preventDefault();
    const n = tabs[(i + d * (document.dir === 'rtl' ? -1 : 1) + tabs.length) % tabs.length][0];
    setTab(n); document.getElementById(`tab-${n}`)?.focus();
  };

  return (
    <div className="container pdp" ref={ref}>
      <nav className="crumbs" aria-label="breadcrumb">
        <Link to="/">{t('nav.home')}</Link><Icon name="chevR" size={14} className="flip-rtl" />
        {c && <><Link to={`/shop?cat=${c.slug || c.id}`}>{loc(c.name, lang)}</Link><Icon name="chevR" size={14} className="flip-rtl" /></>}
        <span aria-current="page">{loc(p.name, lang)}</span>
      </nav>
      <div className="pdp-grid">
        <Gallery images={p.images} name={loc(p.name, lang)} />
        <div className="pdp-info">
          {b && <span className="p-brand">{loc(b.name, lang)}</span>}
          <ProductName product={p} as="h1" />
          <div className="p-meta"><Rating value={p.rating} count={p.reviewCount} size={16} />{p.sku && <span className="muted" dir="ltr">SKU {p.sku}</span>}</div>
          <PriceBlock product={p} size="xl" />
          <StockBadge product={p} showCount />
          <PurchasePanel product={p} />
        </div>
      </div>

      <section className="pdp-tabs" data-reveal>
        <div role="tablist" aria-label={t('product.details')} onKeyDown={onTabKey}>
          {tabs.map(([k, label]) => <button key={k} id={`tab-${k}`} type="button" role="tab" aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}>{label}</button>)}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel" tabIndex={0}>
          {tab === 'desc' && (loc(p.description, lang) ? <p className="prose">{loc(p.description, lang)}</p> : <p className="muted">{t('product.noDescription')}</p>)}
          {tab === 'benefits' && (benefits.length ? <ul className="benefits">{benefits.map((x, i) => <li key={i}><Icon name="check" size={18} />{x}</li>)}</ul> : <p className="muted">{t('product.noBenefits')}</p>)}
          {tab === 'specs' && <dl className="specs">{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
          {tab === 'reviews' && <EmptyState icon="star" title={t('reviews.none')} text={t('reviews.noneText')} />}
        </div>
      </section>

      {related.length > 0 && <section className="section tight" data-reveal><div className="section-head"><h2>{t('product.related')}</h2></div><ProductCarousel products={related} /></section>}
      {viewed.length > 0 && <section className="section tight" data-reveal><div className="section-head"><h2>{t('product.recent')}</h2></div><ProductCarousel products={viewed} /></section>}
    </div>
  );
}
