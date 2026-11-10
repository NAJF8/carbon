/** WhatsApp is the order channel: no order backend exists, so checkout hands a complete order summary to the store. */
export function buildWhatsAppOrder({ lines, totals, coupon, lang, t, storeName }) {
  const money = (n) => `${Math.round(n).toLocaleString('en-US')} ${lang === 'ar' ? 'د.ع' : 'IQD'}`;
  const nameOf = (p) => (p.name?.[lang] || p.name?.en || p.name?.ar || '');
  const rows = lines.map((l, i) => {
    const v = [l.size, l.color && (l.product.colors?.find((c) => c.hex === l.color)?.name?.[lang] || l.color)].filter(Boolean).join(' / ');
    return `${i + 1}. ${nameOf(l.product)}${l.product.sku ? ` [${l.product.sku}]` : ''}${v ? ` (${v})` : ''} × ${l.qty} = ${money(l.unitPrice * l.qty)}`;
  });
  const out = [`${t('wa.greeting', { store: storeName })}`, '', ...rows, ''];
  out.push(`${t('cart.subtotal')}: ${money(totals.subtotal)}`);
  if (coupon) out.push(`${t('cart.couponDiscount')} (${coupon.coupon.code}): -${money(totals.couponDiscount)}`);
  out.push(`${t('cart.shipping')}: ${totals.shippingCost ? money(totals.shippingCost) : t('cart.shippingFree')}`);
  out.push(`${t('cart.total')}: ${money(totals.total)}`, '', t('wa.footer'));
  return out.join('\n');
}

export function waLink(number, text = '') {
  const n = String(number || '').replace(/[^\d]/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
