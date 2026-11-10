import { useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { Overlay, Img, EmptyState, Field } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { Link } from '../../router.jsx';
import { formatMoney, loc } from '../../utils/format.js';
import { buildWhatsAppOrder, waLink } from '../../utils/whatsapp.js';

/** Cart contents + coupon + totals. Reused by the desktop drawer and the /cart page. */
export function CartBody({ onNavigate, page = false }) {
  const { lang, t } = useI18n();
  const { lines, setQty, removeLine, restoreLine, totals, coupon, applyCoupon, removeCoupon, toast, clearCart, recordCouponUse } = useShop();
  const { catalog } = useData();
  const [code, setCode] = useState('');
  const settings = catalog.settings;
  const wa = settings.store?.whatsapp;

  const remove = (l) => {
    removeLine(l.key);
    toast(t('cart.removed'), { type: 'info', action: { label: t('common.undo'), run: () => restoreLine(l) } });
  };
  const couponMsg = coupon && !coupon.ok ? t(`coupon.err.${coupon.reason}`, { min: formatMoney(coupon.min || 0, lang) }) : '';

  const checkout = () => {
    const msg = buildWhatsAppOrder({ lines, totals, coupon: coupon?.ok ? coupon : null, lang, t, storeName: loc(settings.store?.name, lang) });
    recordCouponUse();
    window.open(waLink(wa, msg), '_blank', 'noopener');
  };

  if (!lines.length) {
    return <EmptyState icon="cart" title={t('cart.emptyTitle')} text={t('cart.emptyText')}
      action={<Link to="/shop" className="btn btn-primary" onClick={onNavigate}>{t('cart.startShopping')}</Link>} />;
  }
  return (
    <div className={`cart ${page ? 'cart-page' : ''}`}>
      <ul className="cart-lines">
        {lines.map((l) => (
          <li key={l.key} className="cart-line">
            <Link to={`/product/${l.product.slug || l.product.id}`} onClick={onNavigate} className="cl-img"><Img src={l.product.images?.[0]?.src} alt="" ratio="1/1" /></Link>
            <div className="cl-info">
              <Link to={`/product/${l.product.slug || l.product.id}`} onClick={onNavigate} className="cl-name">{loc(l.product.name, lang)}</Link>
              <span className="cl-var">{[l.size, l.color && loc(l.product.colors?.find((c) => c.hex === l.color)?.name, lang)].filter(Boolean).join(' · ')}</span>
              <div className="cl-price">
                <b>{formatMoney(l.unitPrice, lang)}</b>
                {l.compareAt && <del>{formatMoney(l.compareAt, lang)}</del>}
              </div>
              <div className="qty qty-sm" role="group" aria-label={t('cart.quantity')}>
                <button type="button" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label={t('cart.decrease')}><Icon name="minus" size={14} /></button>
                <output>{l.qty}</output>
                <button type="button" onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= l.product.stock} aria-label={t('cart.increase')}><Icon name="plus" size={14} /></button>
              </div>
            </div>
            <div className="cl-side">
              <b>{formatMoney(l.unitPrice * l.qty, lang)}</b>
              <button type="button" className="icon-btn" onClick={() => remove(l)} aria-label={`${t('cart.remove')}: ${loc(l.product.name, lang)}`}><Icon name="trash" size={18} /></button>
            </div>
          </li>
        ))}
      </ul>

      {(catalog.coupons.length > 0) && (
        <form className="coupon-form" onSubmit={(e) => { e.preventDefault(); if (code.trim()) { applyCoupon(code); setCode(''); } }}>
          {coupon?.ok ? (
            <div className="coupon-applied"><Icon name="ticket" size={18} /><b dir="ltr">{coupon.coupon.code}</b><span>−{formatMoney(coupon.discount, lang)}</span>
              <button type="button" className="text-link" onClick={removeCoupon}>{t('common.remove')}</button></div>
          ) : (
            <Field label={t('coupon.label')} error={couponMsg} htmlFor="coupon-in">
              <div className="input-row">
                <input id="coupon-in" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('coupon.placeholder')} autoComplete="off" dir="ltr" />
                <button type="submit" className="btn btn-outline">{t('coupon.apply')}</button>
              </div>
            </Field>
          )}
        </form>
      )}

      <dl className="totals">
        <div><dt>{t('cart.subtotal')}</dt><dd>{formatMoney(totals.subtotal, lang)}</dd></div>
        {totals.couponDiscount > 0 && <div className="save"><dt>{t('cart.couponDiscount')}</dt><dd>−{formatMoney(totals.couponDiscount, lang)}</dd></div>}
        <div><dt>{t('cart.shipping')}</dt><dd>{totals.shippingCost ? formatMoney(totals.shippingCost, lang) : t('cart.shippingFree')}</dd></div>
        <div className="grand"><dt>{t('cart.total')}</dt><dd>{formatMoney(totals.total, lang)}</dd></div>
      </dl>
      {totals.savings > 0 && <p className="saved-note">{t('cart.youSave', { v: formatMoney(totals.savings + totals.couponDiscount, lang) })}</p>}

      <button type="button" className="btn btn-primary btn-lg block" disabled={!wa} onClick={checkout}>
        <Icon name="whatsapp" size={20} />{t('cart.checkoutWhatsApp')}
      </button>
      {!wa && <p className="field-hint">{t('cart.noWhatsApp')}</p>}
      <button type="button" className="text-link center" onClick={clearCart}>{t('cart.clear')}</button>
    </div>
  );
}

export default function CartDrawer() {
  const { ui, openUi, count } = useShop();
  const { t } = useI18n();
  return (
    <Overlay open={ui.cart} onClose={() => openUi({ cart: false })} variant="drawer" title={`${t('cart.title')}${count ? ` (${count})` : ''}`} className="cart-drawer">
      <CartBody onNavigate={() => openUi({ cart: false })} />
    </Overlay>
  );
}
