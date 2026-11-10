export const norm = (s) => String(s || '').toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();

export function productHaystack(p, brandName = '', catName = '') {
  return norm([p.name?.ar, p.name?.en, p.sku, brandName, catName, (p.tags || []).join(' ')].join(' '));
}

export function searchProducts(products, q, brandOf, catOf) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return products;
  return products.filter((p) => {
    const h = productHaystack(p, brandOf(p) , catOf(p));
    return terms.every((t) => h.includes(t));
  });
}
