import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { Link } from '../../router.jsx';
import Icon from '../ui/Icon.jsx';
import { Img } from '../ui/index.jsx';
import ProductCard from './ProductCard.jsx';
import { asset } from '../../utils/assets.js';
import { loc, todayStr } from '../../utils/format.js';
import { offerStatus } from '../../utils/pricing.js';
import { prefersReducedMotion } from '../../hooks/index.js';

/* ───────── Shared product selection logic ───────── */
export function useProductSets() {
  const { catalog } = useData();
  const { price } = useShop();
  return useMemo(() => {
    const active = catalog.products.filter((p) => p.active);
    const sortNew = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '');
    return {
      all: active,
      offers: active.filter((p) => price(p).percentOff > 0),
      bestseller: active.filter((p) => p.bestseller),
      new: active.filter((p) => p.newArrival).sort(sortNew),
      featured: active.filter((p) => p.featured),
      byCategory: (id) => active.filter((p) => p.categoryId === id),
    };
  }, [catalog, price]);
}

/* ───────── Hero with layered 2.5D presentation ───────── */
export function Hero({ hero }) {
  const { lang } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    };
    const leave = () => { el.style.setProperty('--px', 0); el.style.setProperty('--py', 0); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    // Scroll parallax: only writes a CSS variable, compositor does the rest.
    const sc = () => el.style.setProperty('--sy', Math.min(window.scrollY, 600).toFixed(0));
    window.addEventListener('scroll', sc, { passive: true });
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); window.removeEventListener('scroll', sc); };
  }, []);
  if (!hero?.active) return null;
  const title = loc(hero.title, lang);
  const words = title.split(' ');
  const last = Math.max(1, Math.ceil(words.length / 2));
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title" lang={lang}>{words.slice(0, last).join(' ')} <em>{words.slice(last).join(' ')}</em></h1>
          <p>{loc(hero.subtitle, lang)}</p>
          <div className="hero-cta">
            {hero.cta?.link && <Link to={hero.cta.link} className="btn btn-primary btn-lg">{loc(hero.cta.label, lang)}<Icon name="arrowR" size={18} className="flip-rtl" /></Link>}
            {hero.cta2?.link && <Link to={hero.cta2.link} className="btn btn-outline btn-lg">{loc(hero.cta2.label, lang)}</Link>}
          </div>
        </div>
        <div className="hero-stage" aria-hidden="true">
          <span className="hs-ring hs-ring-1" /><span className="hs-ring hs-ring-2" />
          <span className="hs-glow" />
          <div className="hs-float">
            <img className="hs-img" src={asset(hero.image)} srcSet={hero.imageSmall ? `${asset(hero.imageSmall)} 480w, ${asset(hero.image)} 900w` : undefined}
              sizes="(max-width:900px) 70vw, 460px" alt="" width="900" height="900" fetchpriority="high" decoding="async" />
          </div>
          <span className="hs-floor" />
        </div>
      </div>
    </section>
  );
}

/* ───────── Categories ───────── */
export function CategoriesRow({ section }) {
  const { lang, t } = useI18n();
  const { catalog } = useData();
  const sets = useProductSets();
  const offersOn = catalog.settings.general?.offersEnabled !== false;
  const cats = catalog.categories.filter((c) => c.active && (offersOn || c.kind !== 'offers')).sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!cats.length) return null;
  return (
    <SectionShell section={section}>
      <ul className="cat-grid">
        {cats.map((c, i) => {
          const n = c.kind === 'offers' ? sets.offers.length : sets.byCategory(c.id).length;
          return (
            <li key={c.id} data-reveal style={{ '--i': i }}>
              <Link to={c.kind === 'offers' ? '/offers' : `/shop?cat=${c.slug || c.id}`} className={`cat-card cat-${c.id}`}>
                <span className="cat-media">
                  {c.image ? <Img src={c.image} alt="" ratio="4/3" /> : <span className="cat-icon"><Icon name={c.icon || 'grid'} size={44} /></span>}
                </span>
                <span className="cat-label">
                  <b>{loc(c.name, lang)}</b>
                  <small>{t('cat.count', { n })}</small>
                </span>
                <Icon name="arrowR" size={20} className="cat-arrow flip-rtl" />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

/* ───────── Banners ───────── */
export function BannersRow() {
  const { lang } = useI18n();
  const { catalog } = useData();
  const today = todayStr();
  const list = catalog.banners.filter((b) => b.active && (!b.start || today >= b.start) && (!b.end || today <= b.end)).sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!list.length) return null;
  return (
    <section className="section"><div className="container banners">
      {list.map((b, i) => {
        const inner = (
          <>
            <picture>
              {b.imageMobile && <source media="(max-width:640px)" srcSet={asset(b.imageMobile)} />}
              <img src={asset(b.image)} alt="" loading="lazy" decoding="async" />
            </picture>
            <span className="banner-copy"><b>{loc(b.title, lang)}</b>{b.cta?.label && <em>{loc(b.cta.label, lang)}</em>}</span>
          </>
        );
        return <div key={b.id} className="banner" data-reveal style={{ '--i': i }}>{b.link ? <Link to={b.link} aria-label={loc(b.title, lang)}>{inner}</Link> : inner}</div>;
      })}
    </div></section>
  );
}

/* ───────── Section frame ───────── */
export function SectionShell({ section, children, link }) {
  const { lang, t } = useI18n();
  const title = loc(section.title, lang);
  return (
    <section className={`section bg-${section.background || 'default'}`} aria-labelledby={`h-${section.id}`}>
      <div className="container">
        {title && (
          <div className="section-head" data-reveal>
            <div><h2 id={`h-${section.id}`}>{title}</h2>{loc(section.subtitle, lang) && <p>{loc(section.subtitle, lang)}</p>}</div>
            {(link || section.link) && <Link to={link || section.link} className="view-all">{t('common.viewAll')}<Icon name="arrowR" size={16} className="flip-rtl" /></Link>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ───────── Carousel ───────── */
export function ProductCarousel({ products }) {
  const { t, dir } = useI18n();
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos < 4, end: pos > max - 4 });
  }, []);
  useEffect(() => { update(); }, [products, update, dir]);
  const go = (d) => {
    const el = ref.current;
    el.scrollBy({ left: d * el.clientWidth * 0.85 * (dir === 'rtl' ? -1 : 1), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <div className="carousel">
      <button type="button" className="car-btn prev" onClick={() => go(-1)} disabled={edge.start} aria-label={t('common.previous')}><Icon name="chevL" className="flip-rtl" /></button>
      <div className="car-track" ref={ref} onScroll={update} tabIndex={-1}>
        {products.map((p, i) => <div className="car-item" key={p.id}><ProductCard product={p} index={i} /></div>)}
      </div>
      <button type="button" className="car-btn next" onClick={() => go(1)} disabled={edge.end} aria-label={t('common.next')}><Icon name="chevR" className="flip-rtl" /></button>
    </div>
  );
}

export function ProductsSection({ section }) {
  const sets = useProductSets();
  let list = [];
  switch (section.source) {
    case 'offers': list = sets.offers; break;
    case 'bestseller': list = sets.bestseller; break;
    case 'new': list = sets.new; break;
    case 'featured': list = sets.featured; break;
    case 'category': list = sets.byCategory(section.categoryId); break;
    case 'manual': list = (section.productIds || []).map((id) => sets.all.find((p) => p.id === id)).filter(Boolean); break;
    default: list = [];
  }
  if (!list.length) return null;
  return <SectionShell section={section}><ProductCarousel products={list.slice(0, 12)} /></SectionShell>;
}

export { offerStatus };
