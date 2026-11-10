import { useI18n } from '../i18n/index.jsx';
import { useData } from '../store/data.jsx';
import { useShop } from '../store/shop.jsx';
import { Link } from '../router.jsx';
import { useSeo } from '../utils/seo.js';
import { useReveal } from '../hooks/index.js';
import { loc, formatMoney, todayStr } from '../utils/format.js';
import { asset } from '../utils/assets.js';
import { offerStatus } from '../utils/pricing.js';
import { EmptyState } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';
import ProductCard from '../components/shop/ProductCard.jsx';
import { CartBody } from '../components/shop/CartDrawer.jsx';

export function NotFoundPage() {
  const { t } = useI18n();
  useSeo({ title: t('notFound.title'), path: '/404' });
  return <div className="container page-pad"><EmptyState icon="alert" tone="warning" title={t('notFound.title')} text={t('notFound.text')} action={<Link to="/" className="btn btn-primary">{t('notFound.home')}</Link>} /></div>;
}

export function CartPage() {
  const { t } = useI18n();
  useSeo({ title: t('cart.title'), path: '/cart' });
  return <div className="container page-pad narrow"><h1>{t('cart.title')}</h1><CartBody page /></div>;
}

export function WishlistPage() {
  const { t } = useI18n();
  const { catalog } = useData();
  const { wishlist } = useShop();
  const ref = useReveal([wishlist.length]);
  const list = wishlist.map((id) => catalog.products.find((p) => p.id === id && p.active)).filter(Boolean);
  useSeo({ title: t('wishlist.title'), path: '/wishlist' });
  return (
    <div className="container page-pad" ref={ref}>
      <h1>{t('wishlist.title')}</h1>
      {list.length ? <div className="p-grid">{list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
        : <EmptyState icon="heart" title={t('wishlist.emptyTitle')} text={t('wishlist.emptyText')} action={<Link to="/shop" className="btn btn-primary">{t('cart.startShopping')}</Link>} />}
    </div>
  );
}

export function OffersPage() {
  const { t, lang } = useI18n();
  const { catalog } = useData();
  const { price } = useShop();
  const ref = useReveal([lang]);
  const today = todayStr();
  const enabled = catalog.settings.general?.offersEnabled !== false;
  const active = enabled ? catalog.offers.filter((o) => offerStatus(o, today) === 'active') : [];
  const products = enabled ? catalog.products.filter((p) => p.active && price(p).percentOff > 0) : [];
  useSeo({ title: `${t('nav.offers')} | ${loc(catalog.settings.store?.name, lang)}`, description: t('seo.offersDesc'), path: '/offers', lang });
  return (
    <div className="container page-pad" ref={ref}>
      <h1>{t('nav.offers')}</h1>
      {active.length > 0 && (
        <ul className="offer-cards">
          {active.map((o) => (
            <li key={o.id} className="offer-card" data-reveal>
              {o.banner && <img src={asset(o.banner)} alt="" loading="lazy" />}
              <div>
                <b>{loc(o.name, lang)}</b>
                <span className="offer-val">{o.type === 'percent' ? `-${o.value}%` : `-${formatMoney(o.value, lang)}`}</span>
                {o.end && <small><Icon name="calendar" size={14} /> {t('offers.until', { d: o.end })}</small>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {products.length ? <div className="p-grid">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
        : <EmptyState icon="flame" title={t('offers.noneTitle')} text={t('offers.noneText')} action={<Link to="/shop" className="btn btn-primary">{t('nav.shop')}</Link>} />}
    </div>
  );
}
