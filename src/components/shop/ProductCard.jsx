import { memo } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { Link } from '../../router.jsx';
import { Img, Rating } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { PriceBlock, ProductName, StockBadge, useLookup } from './ProductBits.jsx';
import { stockStatus } from '../../utils/pricing.js';
import { loc } from '../../utils/format.js';

function ProductCard({ product: p, index = 0, reveal = true }) {
  const { lang, t } = useI18n();
  const { addToCart, toggleWish, wishlist, openUi, price, toast } = useShop();
  const { brand } = useLookup();
  const b = brand(p.brandId);
  const pr = price(p);
  const out = stockStatus(p) === 'out';
  const wished = wishlist.includes(p.id);
  const hasVariants = (p.sizes?.length || 0) > 0 || (p.colors?.length || 0) > 0;
  const img1 = p.images?.[0];
  const img2 = p.images?.[1];
  const name = loc(p.name, lang);

  const add = (e) => {
    if (hasVariants) { openUi({ quick: p.id }); return; }
    const from = e.currentTarget.closest('.p-card').querySelector('.p-media img');
    if (addToCart(p, { qty: 1, from })) toast(t('cart.added', { name }));
  };

  return (
    <article className={`p-card ${out ? 'is-out' : ''}`} data-reveal={reveal ? '' : undefined} style={{ '--i': index % 8 }}>
      <div className="p-media">
        <Link to={`/product/${p.slug || p.id}`} className="p-media-link" aria-label={name} tabIndex={-1}>
          <Img src={img1?.src ? img1.src : ''} alt={img1?.alt || name} className="p-img p-img-1" ratio="1/1" sizes="(max-width:600px) 50vw, 25vw" />
          {img2?.src && <Img src={img2.src} alt="" className="p-img p-img-2" />}
        </Link>
        <div className="p-badges">
          {pr.percentOff > 0 && <span className="badge badge-sale">-{pr.percentOff}%</span>}
          {p.newArrival && <span className="badge badge-new">{t('badge.new')}</span>}
          {p.bestseller && <span className="badge badge-best">{t('badge.best')}</span>}
        </div>
        <button type="button" className={`icon-btn p-wish ${wished ? 'is-on' : ''}`} aria-pressed={wished}
          aria-label={wished ? t('wishlist.remove') : t('wishlist.add')} onClick={() => toggleWish(p.id)}>
          <Icon name="heart" size={18} fill={wished} />
        </button>
        <div className="p-cta">
          <button type="button" className="btn btn-primary btn-sm grow" disabled={out} onClick={add}>
            <Icon name="cart" size={16} />{out ? t('stock.out') : hasVariants ? t('product.options') : t('product.addToCart')}
          </button>
          <button type="button" className="btn btn-glass btn-sm icon-only" onClick={() => openUi({ quick: p.id })} aria-label={`${t('product.quickView')}: ${name}`} title={t('product.quickView')}>
            <Icon name="eye" size={16} />
          </button>
        </div>
      </div>
      <div className="p-body">
        {b && <span className="p-brand">{loc(b.name, lang)}</span>}
        <Link to={`/product/${p.slug || p.id}`} className="p-title"><ProductName product={p} /></Link>
        <div className="p-meta">
          {p.size && <span className="p-size" dir="ltr">{p.size}</span>}
          <Rating value={p.rating} count={p.reviewCount} />
        </div>
        <PriceBlock product={p} />
        <StockBadge product={p} />
      </div>
    </article>
  );
}
export default memo(ProductCard);
