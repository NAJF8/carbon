import { describe, it, expect } from 'vitest';
import { buildWhatsAppOrder, waLink } from './whatsapp.js';

describe('WhatsApp checkout generation', () => {
  const dummyT = (k, vars) => {
    const dict = {
      'wa.greeting': `Hello ${vars?.store}, I would like to order:`,
      'wa.footer': 'Please confirm availability and delivery.',
      'cart.subtotal': 'Subtotal',
      'cart.couponDiscount': 'Coupon discount',
      'cart.shipping': 'Shipping',
      'cart.shippingFree': 'Free',
      'cart.total': 'Total',
    };
    return dict[k] || k;
  };

  const sampleLines = [
    {
      qty: 2,
      unitPrice: 78000,
      size: '2.27kg',
      color: null,
      product: {
        id: 'p1',
        sku: 'ON-WHEY-5LB',
        name: { ar: 'بروتين واي', en: 'Gold Standard Whey' },
      },
    },
  ];

  const sampleTotals = {
    subtotal: 156000,
    savings: 28000,
    couponDiscount: 15600,
    shippingCost: 0,
    total: 140400,
  };

  it('generates a clean order summary without leaking secrets', () => {
    const text = buildWhatsAppOrder({
      lines: sampleLines,
      totals: sampleTotals,
      coupon: { coupon: { code: 'CARBON10' } },
      lang: 'en',
      t: dummyT,
      storeName: 'Carbon Group Nutrition',
    });

    expect(text).toContain('Hello Carbon Group Nutrition');
    expect(text).toContain('Gold Standard Whey [ON-WHEY-5LB] (2.27kg) × 2');
    expect(text).toContain('Subtotal: 156,000 IQD');
    expect(text).toContain('Coupon discount (CARBON10): -15,600 IQD');
    expect(text).toContain('Shipping: Free');
    expect(text).toContain('Total: 140,400 IQD');
    expect(text).not.toContain('apiKey');
    expect(text).not.toContain('firebase');
    expect(text).not.toContain('password');
  });

  it('formats wa.me link with sanitized phone number', () => {
    const link = waLink('+964 (770) 123-4567', 'Hello');
    expect(link).toBe('https://wa.me/9647701234567?text=Hello');
  });
});
