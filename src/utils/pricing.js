import { todayStr } from './format.js';

/** ---------- Stock ---------- */
export function stockStatus(p) {
  const s = Number(p?.stock) || 0;
  if (s <= 0) return 'out';
  const th = p?.lowStockThreshold == null ? 5 : Number(p.lowStockThreshold);
  return s <= th ? 'low' : 'in';
}

/** ---------- Offers ---------- */
/** disabled | scheduled (before start) | active | expired */
export function offerStatus(o, today = todayStr()) {
  if (!o || !o.active) return 'disabled';
  if (o.start && today < o.start) return 'scheduled';
  if (o.end && today > o.end) return 'expired';
  return 'active';
}

function offerApplies(o, p) {
  if (!o || !p) return false;
  switch (o.scope) {
    case 'all': return true;
    case 'products': return (o.productIds || []).includes(p.id);
    case 'categories': return (o.categoryIds || []).includes(p.categoryId);
    case 'brands': return (o.brandIds || []).includes(p.brandId);
    default: return false;
  }
}

function discountAmount(type, value, price) {
  const p = Math.max(Number(price) || 0, 0);
  if (p <= 0) return 0;
  const rawV = Number(value);
  if (!Number.isFinite(rawV) || rawV <= 0) return 0;
  const d = type === 'percent' ? (p * Math.min(rawV, 100)) / 100 : rawV;
  return Math.min(Math.max(Math.round(d), 0), p);
}

/**
 * Effective selling price for a product.
 * Returns { price, compareAt|null, percentOff, offer|null }
 * - an active offer discounts `price`; the best (largest) discount wins
 * - otherwise a manual oldPrice higher than price is shown as the compare-at price
 */
export function priceOf(p, offers = [], today = todayStr(), offersEnabled = true) {
  if (!p) return { price: 0, compareAt: null, percentOff: 0, offer: null };
  const base = Math.max(Number(p.price) || 0, 0);
  if (base <= 0) return { price: 0, compareAt: null, percentOff: 0, offer: null };

  let best = null;
  if (offersEnabled && Array.isArray(offers)) {
    for (const o of offers) {
      if (offerStatus(o, today) !== 'active' || !offerApplies(o, p)) continue;
      const amount = discountAmount(o.type, o.value, base);
      if (amount > 0 && (!best || amount > best.amount)) best = { amount, offer: o };
    }
  }

  if (best) {
    const price = Math.max(0, base - best.amount);
    const percentOff = Math.min(100, Math.max(0, Math.round((best.amount / base) * 100)));
    return { price, compareAt: base, percentOff, offer: best.offer };
  }

  const old = Math.max(Number(p.oldPrice) || 0, 0);
  if (old > base && base > 0) {
    const percentOff = Math.min(100, Math.max(0, Math.round(((old - base) / old) * 100)));
    return { price: base, compareAt: old, percentOff, offer: null };
  }

  return { price: base, compareAt: null, percentOff: 0, offer: null };
}

/** ---------- Coupons ---------- */
/**
 * lines: [{ product, qty, unitPrice }]  (unitPrice already includes offer discounts)
 * usage: optional map { [couponId]: timesUsedByThisBrowser } for best-effort per-customer limit.
 * NOTE: usage limits are only *authoritatively* enforceable server-side; see README.
 */
export function validateCoupon(code, coupons, lines, today = todayStr(), usage = {}) {
  if (!code || typeof code !== 'string') return { ok: false, reason: 'notFound' };
  if (!Array.isArray(coupons) || !Array.isArray(lines) || !lines.length) return { ok: false, reason: 'notApplicable' };

  const c = coupons.find((x) => x?.code?.trim()?.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false, reason: 'notFound' };
  if (!c.active) return { ok: false, reason: 'inactive' };
  if (c.start && today < c.start) return { ok: false, reason: 'notStarted' };
  if (c.end && today > c.end) return { ok: false, reason: 'expired' };
  if (c.usageLimit && (Number(c.usedCount) || 0) >= Number(c.usageLimit)) return { ok: false, reason: 'limitReached' };
  if (c.perCustomerLimit && (Number(usage[c.id]) || 0) >= Number(c.perCustomerLimit)) return { ok: false, reason: 'customerLimit' };

  const subtotal = Math.max(0, lines.reduce((s, l) => s + (Math.max(0, Number(l.unitPrice) || 0) * Math.max(1, Number(l.qty) || 1)), 0));
  if (c.minOrder && subtotal < Number(c.minOrder)) return { ok: false, reason: 'minOrder', min: Number(c.minOrder) };

  const pIds = Array.isArray(c.productIds) ? c.productIds : [];
  const cIds = Array.isArray(c.categoryIds) ? c.categoryIds : [];
  const restricted = pIds.length > 0 || cIds.length > 0;
  const eligible = lines.filter((l) => !restricted || pIds.includes(l.product?.id) || cIds.includes(l.product?.categoryId));
  if (!eligible.length) return { ok: false, reason: 'notApplicable' };

  const base = Math.max(0, eligible.reduce((s, l) => s + (Math.max(0, Number(l.unitPrice) || 0) * Math.max(1, Number(l.qty) || 1)), 0));
  let discount = discountAmount(c.type, c.value, base);
  if (c.maxDiscount && Number(c.maxDiscount) > 0) {
    discount = Math.min(discount, Number(c.maxDiscount));
  }

  return { ok: true, coupon: c, discount: Math.min(discount, subtotal) };
}

/** ---------- Cart totals ---------- */
export function cartTotals(lines, coupon, shipping = {}) {
  if (!Array.isArray(lines) || !lines.length) {
    return { subtotal: 0, savings: 0, couponDiscount: 0, shippingCost: 0, total: 0 };
  }

  const subtotal = Math.max(0, lines.reduce((s, l) => s + (Math.max(0, Number(l.unitPrice) || 0) * Math.max(1, Number(l.qty) || 1)), 0));
  const savings = Math.max(0, lines.reduce((s, l) => s + Math.max(((Number(l.compareAt) || l.unitPrice) - l.unitPrice), 0) * Math.max(1, Number(l.qty) || 1), 0));
  const couponDiscount = Math.min(Math.max(Number(coupon?.discount) || 0, 0), subtotal);
  const afterDiscount = Math.max(subtotal - couponDiscount, 0);

  const fee = Math.max(Number(shipping?.fee) || 0, 0);
  const freeOver = Math.max(Number(shipping?.freeOver) || 0, 0);
  const shippingCost = freeOver > 0 && afterDiscount >= freeOver ? 0 : fee;

  return {
    subtotal: Math.round(subtotal),
    savings: Math.round(savings),
    couponDiscount: Math.round(couponDiscount),
    shippingCost: Math.round(shippingCost),
    total: Math.round(afterDiscount + shippingCost),
  };
}
