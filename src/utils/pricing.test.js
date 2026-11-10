import { describe, it, expect } from 'vitest';
import { priceOf, offerStatus, validateCoupon, stockStatus, cartTotals } from './pricing.js';

const p = { id: 'p1', categoryId: 'protein', brandId: 'b1', price: 100000, oldPrice: 0, stock: 10, lowStockThreshold: 3 };
const offer = (o) => ({ id: 'o', active: true, type: 'percent', value: 10, scope: 'products', productIds: ['p1'], ...o });

describe('offerStatus', () => {
  it('handles schedule boundaries correctly', () => {
    expect(offerStatus(offer({ start: '2026-06-01', end: '2026-06-30' }), '2026-05-31')).toBe('scheduled');
    expect(offerStatus(offer({ start: '2026-06-01', end: '2026-06-30' }), '2026-06-01')).toBe('active');
    expect(offerStatus(offer({ start: '2026-06-01', end: '2026-06-30' }), '2026-06-15')).toBe('active');
    expect(offerStatus(offer({ start: '2026-06-01', end: '2026-06-30' }), '2026-06-30')).toBe('active');
    expect(offerStatus(offer({ start: '2026-06-01', end: '2026-06-30' }), '2026-07-01')).toBe('expired');
    expect(offerStatus(offer({ active: false }), '2026-06-15')).toBe('disabled');
    expect(offerStatus(null)).toBe('disabled');
  });
});

describe('priceOf', () => {
  it('no offer returns plain base price', () => {
    expect(priceOf(p, []).price).toBe(100000);
    expect(priceOf(p, []).compareAt).toBeNull();
    expect(priceOf(p, []).percentOff).toBe(0);
  });

  it('calculates percent offer correctly', () => {
    const r = priceOf(p, [offer({})], '2026-01-01');
    expect(r.price).toBe(90000);
    expect(r.compareAt).toBe(100000);
    expect(r.percentOff).toBe(10);
  });

  it('fixed offer on category, best wins', () => {
    const r = priceOf(p, [
      offer({ type: 'fixed', value: 5000, scope: 'categories', categoryIds: ['protein'] }),
      offer({ value: 20 }), // 20% = 20,000 off
    ]);
    expect(r.price).toBe(80000);
    expect(r.percentOff).toBe(20);
  });

  it('expired and scheduled offers never apply', () => {
    expect(priceOf(p, [offer({ end: '2020-01-01' })]).price).toBe(100000);
    expect(priceOf(p, [offer({ start: '2999-01-01' })]).price).toBe(100000);
  });

  it('manual old price becomes compare-at without offers', () => {
    const r = priceOf({ ...p, oldPrice: 125000 }, []);
    expect(r.price).toBe(100000);
    expect(r.compareAt).toBe(125000);
    expect(r.percentOff).toBe(20);
  });

  it('defends against negative prices, NaN prices, and extreme discounts', () => {
    expect(priceOf({ ...p, price: -5000 }).price).toBe(0);
    expect(priceOf({ ...p, price: NaN }).price).toBe(0);
    expect(priceOf(null).price).toBe(0);
    expect(priceOf(p, [offer({ type: 'percent', value: 150 })]).price).toBe(0); // caps at 100%
    expect(priceOf(p, [offer({ type: 'percent', value: -20 })]).price).toBe(100000); // ignores negative discounts
    expect(priceOf(p, [offer({ type: 'fixed', value: -10000 })]).price).toBe(100000); // ignores negative fixed
    expect(priceOf(p, [offer({ type: 'fixed', value: 999999 })]).price).toBe(0); // never below zero
  });

  it('offers disabled globally preserves base price', () => {
    expect(priceOf(p, [offer({})], '2026-01-01', false).price).toBe(100000);
  });
});

describe('validateCoupon', () => {
  const lines = [{ product: p, qty: 2, unitPrice: 100000 }];
  const c = (o) => ({ id: 'c', code: 'CARBON10', type: 'percent', value: 10, active: true, ...o });

  it('applies percentage coupon correctly', () => {
    const r = validateCoupon('carbon10', [c({})], lines, '2026-01-01');
    expect(r.ok).toBe(true);
    expect(r.discount).toBe(20000); // 10% of 200,000
  });

  it('applies fixed coupon correctly', () => {
    const r = validateCoupon('CARBON10', [c({ type: 'fixed', value: 15000 })], lines, '2026-01-01');
    expect(r.ok).toBe(true);
    expect(r.discount).toBe(15000);
  });

  it('rejects expired coupon', () => {
    expect(validateCoupon('CARBON10', [c({ end: '2026-01-01' })], lines, '2026-01-02').reason).toBe('expired');
  });

  it('rejects coupon not yet started', () => {
    expect(validateCoupon('CARBON10', [c({ start: '2026-02-01' })], lines, '2026-01-02').reason).toBe('notStarted');
  });

  it('rejects exhausted usage limit', () => {
    expect(validateCoupon('CARBON10', [c({ usageLimit: 5, usedCount: 5 })], lines).reason).toBe('limitReached');
  });

  it('rejects exhausted per-customer limit', () => {
    expect(validateCoupon('CARBON10', [c({ perCustomerLimit: 2 })], lines, '2026-01-01', { c: 2 }).reason).toBe('customerLimit');
  });

  it('enforces minimum order requirement', () => {
    expect(validateCoupon('CARBON10', [c({ minOrder: 500000 })], lines).reason).toBe('minOrder');
  });

  it('caps discount with maximum discount', () => {
    expect(validateCoupon('CARBON10', [c({ maxDiscount: 5000 })], lines).discount).toBe(5000);
  });

  it('respects product and category restrictions', () => {
    expect(validateCoupon('CARBON10', [c({ productIds: ['other-p'] })], lines).reason).toBe('notApplicable');
    expect(validateCoupon('CARBON10', [c({ categoryIds: ['protein'] })], lines).ok).toBe(true);
  });

  it('handles invalid inputs and empty codes gracefully', () => {
    expect(validateCoupon('', [c({})], lines).reason).toBe('notFound');
    expect(validateCoupon('UNKNOWN', [c({})], lines).reason).toBe('notFound');
    expect(validateCoupon('CARBON10', [c({ active: false })], lines).reason).toBe('inactive');
    expect(validateCoupon('CARBON10', [c({})], []).reason).toBe('notApplicable');
  });
});

describe('stockStatus & cartTotals', () => {
  it('correctly reports stock status', () => {
    expect(stockStatus({ stock: 0 })).toBe('out');
    expect(stockStatus({ stock: -3 })).toBe('out');
    expect(stockStatus({ stock: 3, lowStockThreshold: 3 })).toBe('low');
    expect(stockStatus({ stock: 4, lowStockThreshold: 3 })).toBe('in');
  });

  it('calculates cart totals and free shipping over threshold', () => {
    const lines = [{ product: p, qty: 1, unitPrice: 100000, compareAt: 120000 }];
    const res1 = cartTotals(lines, null, { fee: 5000, freeOver: 100000 });
    expect(res1.subtotal).toBe(100000);
    expect(res1.savings).toBe(20000);
    expect(res1.shippingCost).toBe(0); // free because >= 100,000
    expect(res1.total).toBe(100000);

    const res2 = cartTotals(lines, null, { fee: 5000, freeOver: 200000 });
    expect(res2.shippingCost).toBe(5000);
    expect(res2.total).toBe(105000);
  });

  it('deducts coupon discount without going below zero', () => {
    const lines = [{ product: p, qty: 1, unitPrice: 20000 }];
    const res = cartTotals(lines, { discount: 30000 }, { fee: 5000, freeOver: 0 });
    expect(res.subtotal).toBe(20000);
    expect(res.couponDiscount).toBe(20000); // capped at subtotal
    expect(res.shippingCost).toBe(5000);
    expect(res.total).toBe(5000); // 0 after discount + 5000 shipping
  });

  it('handles empty cart safely', () => {
    expect(cartTotals([], null).total).toBe(0);
    expect(cartTotals(null, null).total).toBe(0);
  });
});
