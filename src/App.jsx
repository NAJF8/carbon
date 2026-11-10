import { Suspense, lazy, useEffect, useRef } from 'react';
import { useRoute } from './router.jsx';
import { useData } from './store/data.jsx';
import { useShop } from './store/shop.jsx';
import { useI18n } from './i18n/index.jsx';
import { useTheme } from './store/theme.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ChatWidget from './components/layout/ChatWidget.jsx';
import CartDrawer from './components/shop/CartDrawer.jsx';
import SearchOverlay from './components/shop/SearchOverlay.jsx';
import QuickView from './components/shop/QuickView.jsx';
import { Toaster, EmptyState, Skeleton, Spinner } from './components/ui/index.jsx';
import Icon from './components/ui/Icon.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductPage from './pages/Product.jsx';
import { CartPage, WishlistPage, OffersPage, NotFoundPage } from './pages/misc.jsx';
import { loc } from './utils/format.js';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function PageSkeleton() {
  return (
    <div className="container page-pad" aria-busy="true">
      <Skeleton h={320} r={20} />
      <div className="p-grid" style={{ marginTop: 24 }}>{Array.from({ length: 4 }, (_, i) => <div key={i}><Skeleton h={220} r={16} /><Skeleton h={14} w="70%" className="mt" /><Skeleton h={14} w="40%" className="mt" /></div>)}</div>
    </div>
  );
}

/** Applies admin-configured defaults/brand colors without overriding the visitor's own saved choices. */
function Settings() {
  const { catalog } = useData();
  const { setMode } = useTheme();
  const { setLang } = useI18n();
  useEffect(() => {
    const th = catalog?.settings?.theme;
    if (!th) return;
    const root = document.documentElement.style;
    if (th.primary && th.primary !== '#0f9d0f') root.setProperty('--brand-override', th.primary); else root.removeProperty('--brand-override');
    if (th.accent && th.accent !== '#3ddc3d') root.setProperty('--accent-override', th.accent); else root.removeProperty('--accent-override');
    try {
      if (!localStorage.getItem('carbon-theme') && th.defaultMode && th.defaultMode !== 'system') { setMode(th.defaultMode); localStorage.removeItem('carbon-theme'); }
      const l = catalog.settings.languages?.default;
      if (!localStorage.getItem('carbon-lang') && l) setLang(l);
    } catch { /* storage unavailable */ }
  }, [catalog]); // eslint-disable-line
  return null;
}

export default function App() {
  const route = useRoute();
  const { catalog, loading, error, reload } = useData();
  const { t, lang } = useI18n();
  const { toasts, dismissToast } = useShop();
  const mainRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [route.path]);

  const isAdmin = route.path.startsWith('/admin');

  if (error) {
    return <div className="container page-pad"><EmptyState icon="wifiOff" tone="danger" title={t('error.loadTitle')} text={t('error.loadText')}
      action={<button type="button" className="btn btn-primary" onClick={reload}><Icon name="refresh" size={18} />{t('common.retry')}</button>} /></div>;
  }
  if (loading || !catalog) return <PageSkeleton />;

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="center-screen"><Spinner /></div>}>
        <Settings />
        <AdminApp route={route} />
        <Toaster toasts={toasts} dismiss={dismissToast} />
      </Suspense>
    );
  }

  if (catalog.settings.general?.maintenance) {
    return <div className="container page-pad"><EmptyState icon="settings" title={t('maintenance.title')} text={t('maintenance.text')} /></div>;
  }

  let page;
  const seg = route.path.split('/').filter(Boolean);
  if (route.path === '/') page = <Home />;
  else if (seg[0] === 'shop' && seg.length === 1) page = <Shop route={route} />;
  else if (seg[0] === 'product' && seg[1]) page = <ProductPage slug={decodeURIComponent(seg[1])} />;
  else if (route.path === '/cart') page = <CartPage />;
  else if (route.path === '/wishlist') page = <WishlistPage />;
  else if (route.path === '/offers') page = <OffersPage />;
  else page = <NotFoundPage />;

  return (
    <>
      <Settings />
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>{t('common.skip')}</a>
      <Header route={route} />
      <main id="main" ref={mainRef} tabIndex={-1} key={route.path + lang} className="page-enter" aria-label={loc(catalog.settings.store?.name, lang)}>{page}</main>
      <Footer />
      <ChatWidget />
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <Toaster toasts={toasts} dismiss={dismissToast} />
    </>
  );
}
