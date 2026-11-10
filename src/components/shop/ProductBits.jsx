import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { stockStatus } from '../../utils/pricing.js';
import { formatMoney, loc } from '../../utils/format.js';
import { navigate } from '../../router.jsx';
import Icon from '../ui/Icon.jsx';

export function useLookup() {
  const { catalog } = useData();
  const cats = Object.fromEntries((catalog?.categories || []).map((c) => [c.id, c]));
  const brands = Object.fromEntries((catalog?.brands || []).map((b) => [b.id, b]));
  return { cat: (id) => cats[id], brand: (id) => brands[id] };
}

export function StockBadge({ product, showCount = false }) {
  const { t } = useI18n();
  const s = stockStatus(product);
  const label = s === 'out' ? t('stock.out') : s === 'low' ? (showCount ? t('stock.lowCount', { n: product.stock }) : t('stock.low')) : t('stock.in');
  return <span className={`stock stock-${s}`}><i aria-hidden="true" />{label}</span>;
}

export function PriceBlock({ product, size = 'md' }) {
  const { lang, t } = useI18n();
  const { price } = useShop();
  const pr = price(product);
  return (
    <div className={`price price-${size}`}>
      <strong>{formatMoney(pr.price, lang)}</strong>
      {pr.compareAt && (
        <>
          <del aria-label={t('product.oldPrice')}>{formatMoney(pr.compareAt, lang)}</del>
          <span className="off">-{pr.percentOff}%</span>
        </>
      )}
    </div>
  );
}

/** Primary-language name + secondary-language name. */
export function ProductName({ product, as: Tag = 'h3', secondary = true }) {
  const { lang } = useI18n();
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <>
      <Tag className="p-name" lang={lang}>{loc(product.name, lang)}</Tag>
      {secondary && product.name?.[other] && product.name[other] !== product.name[lang] && (
        <span className="p-name2" lang={other}>{product.name[other]}</span>
      )}
    </>
  );
}

/** Variant picker + quantity + actions. Shared by product page and quick view. */
export function PurchasePanel({ product, onAdded, compact = false }) {
  const { lang, t } = useI18n();
  const { addToCart, toggleWish, wishlist, toast } = useShop();
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [color, setColor] = useState(colors.length === 1 ? colors[0].hex : '');
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const out = stockStatus(product) === 'out';
  const max = Math.max(1, Number(product.stock) || 1);
  useEffect(() => { setQty((q) => Math.min(q, max)); }, [max]);
  const wished = wishlist.includes(product.id);

  const validate = () => {
    if (sizes.length && !size) { setErr(t('product.chooseSize')); return false; }
    if (colors.length && !color) { setErr(t('product.chooseColor')); return false; }
    setErr(''); return true;
  };
  const add = (e, buyNow) => {
    if (!validate()) return;
    const from = document.querySelector('[data-gallery-main] img') || e.currentTarget;
    addToCart(product, { qty, size, color, from });
    toast(t('cart.added', { name: loc(product.name, lang) }));
    onAdded?.();
    if (buyNow) navigate('/cart');
  };

  return (
    <div className="purchase">
      {sizes.length > 0 && (
        <fieldset className="opt">
          <legend>{t('product.size')}</legend>
          <div className="chips">
            {sizes.map((s) => (
              <label key={s} className={`chip ${size === s ? 'on' : ''}`}>
                <input type="radio" name={`size-${product.id}`} checked={size === s} onChange={() => { setSize(s); setErr(''); }} /><span dir="ltr">{s}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {colors.length > 0 && (
        <fieldset className="opt">
          <legend>{t('product.color')}{color && <b className="opt-val"> — {loc(colors.find((c) => c.hex === color)?.name, lang)}</b>}</legend>
          <div className="chips">
            {colors.map((c) => (
              <label key={c.hex} className={`swatch ${color === c.hex ? 'on' : ''}`} title={loc(c.name, lang)}>
                <input type="radio" name={`color-${product.id}`} checked={color === c.hex} onChange={() => { setColor(c.hex); setErr(''); }} aria-label={loc(c.name, lang)} />
                <i style={{ background: c.hex }} />
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {err && <p className="field-error" role="alert">{err}</p>}
      <div className="buy-row">
        <div className="qty" role="group" aria-label={t('cart.quantity')}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || out} aria-label={t('cart.decrease')}><Icon name="minus" size={16} /></button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || out} aria-label={t('cart.increase')}><Icon name="plus" size={16} /></button>
        </div>
        <button type="button" className="btn btn-primary btn-lg grow" disabled={out} onClick={(e) => add(e, false)}>
          <Icon name="cart" size={18} />{out ? t('stock.out') : t('product.addToCart')}
        </button>
        {!compact && (
          <button type="button" className={`icon-btn lg ${wished ? 'is-on' : ''}`} aria-pressed={wished} aria-label={wished ? t('wishlist.remove') : t('wishlist.add')} onClick={() => toggleWish(product.id)}>
            <Icon name="heart" fill={wished} />
          </button>
        )}
      </div>
      {!compact && <button type="button" className="btn btn-outline btn-lg block" disabled={out} onClick={(e) => add(e, true)}>{t('product.buyNow')}</button>}
    </div>
  );
}
