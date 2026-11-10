import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useData } from './data.jsx';
import { priceOf, validateCoupon, cartTotals, stockStatus } from '../utils/pricing.js';
import { flyToCart } from '../utils/fly.js';

const Ctx = createContext(null);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const lineKey = (id, size, color) => [id, size || '', color || ''].join('|');

function cartReducer(state, a) {
  switch (a.type) {
    case 'add': {
      const key = lineKey(a.productId, a.size, a.color);
      const ex = state.find((l) => l.key === key);
      if (ex) return state.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + a.qty, a.max) } : l));
      return [...state, { key, productId: a.productId, qty: Math.min(a.qty, a.max), size: a.size, color: a.color }];
    }
    case 'qty': return state.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(a.qty, a.max)) } : l));
    case 'remove': return state.filter((l) => l.key !== a.key);
    case 'clear': return [];
    default: return state;
  }
}

export function ShopProvider({ children }) {
  const { catalog } = useData();
  const [raw, dispatch] = useReducer(cartReducer, null, () => read('carbon-cart', []));
  const [wishlist, setWishlist] = useState(() => read('carbon-wishlist', []));
  const [recent, setRecent] = useState(() => read('carbon-recent', []));
  const [couponCode, setCouponCode] = useState(() => read('carbon-coupon', ''));
  const [toasts, setToasts] = useState([]);
  const [ui, setUi] = useState({ cart: false, search: false, quick: null, filters: false, chat: false });

  useEffect(() => save('carbon-cart', raw), [raw]);
  useEffect(() => save('carbon-wishlist', wishlist), [wishlist]);
  useEffect(() => save('carbon-recent', recent), [recent]);
  useEffect(() => save('carbon-coupon', couponCode), [couponCode]);

  const offersEnabled = catalog?.settings?.general?.offersEnabled !== false;
  const activeOffers = catalog?.offers || [];
  const price = useCallback((p) => priceOf(p, activeOffers, undefined, offersEnabled), [activeOffers, offersEnabled]);

  const byId = useMemo(() => Object.fromEntries((catalog?.products || []).map((p) => [p.id, p])), [catalog]);

  const lines = useMemo(() => raw
    .map((l) => {
      const product = byId[l.productId];
      if (!product || !product.active || stockStatus(product) === 'out') return null;
      const pr = price(product);
      return { ...l, qty: Math.min(l.qty, product.stock), product, unitPrice: pr.price, compareAt: pr.compareAt };
    })
    .filter(Boolean), [raw, byId, price]);

  const coupon = useMemo(() => {
    if (!couponCode || !catalog) return null;
    const usage = read('carbon-coupon-usage', {});
    const r = validateCoupon(couponCode, catalog.coupons, lines, undefined, usage);
    return r.ok ? { ...r, code: couponCode } : { ...r, code: couponCode };
  }, [couponCode, catalog, lines]);

  const totals = useMemo(() => cartTotals(lines, coupon?.ok ? coupon : null, catalog?.settings?.shipping), [lines, coupon, catalog]);

  const toast = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, message, type: opts.type || 'success', action: opts.action }]);
    return id;
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const openUi = useCallback((patch) => setUi((u) => ({ ...u, ...patch })), []);

  const addToCart = useCallback((product, { qty = 1, size, color, from } = {}) => {
    const max = Number(product.stock) || 0;
    if (max <= 0) return false;
    dispatch({ type: 'add', productId: product.id, qty, size, color, max });
    if (from) flyToCart(from);
    return true;
  }, []);

  const value = useMemo(() => ({
    lines, count: lines.reduce((s, l) => s + l.qty, 0), totals, coupon, couponCode,
    addToCart,
    setQty: (key, qty) => { const l = lines.find((x) => x.key === key); if (l) dispatch({ type: 'qty', key, qty, max: l.product.stock }); },
    removeLine: (key) => dispatch({ type: 'remove', key }),
    restoreLine: (l) => dispatch({ type: 'add', productId: l.productId, qty: l.qty, size: l.size, color: l.color, max: l.product.stock }),
    clearCart: () => dispatch({ type: 'clear' }),
    applyCoupon: (code) => setCouponCode(code.trim()),
    removeCoupon: () => setCouponCode(''),
    recordCouponUse: () => {
      if (!coupon?.ok) return;
      const u = read('carbon-coupon-usage', {}); u[coupon.coupon.id] = (u[coupon.coupon.id] || 0) + 1; save('carbon-coupon-usage', u);
    },
    price,
    wishlist,
    toggleWish: (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
    recent,
    pushRecent: (id) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)),
    toasts, toast, dismissToast,
    ui, openUi,
  }), [lines, totals, coupon, couponCode, addToCart, price, wishlist, recent, toasts, toast, dismissToast, ui, openUi]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useShop = () => useContext(Ctx);
