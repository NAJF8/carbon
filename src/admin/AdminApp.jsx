import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useData } from '../store/data.jsx';
import { Link, navigate } from '../router.jsx';
import { LangSwitch, ThemeSwitch, Overlay, EmptyState, Spinner, Field } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAction } from './components/common.jsx';
import { useSeo } from '../utils/seo.js';
import { asset } from '../utils/assets.js';
import Dashboard from './pages/Dashboard.jsx';
import { ProductsList, ProductForm } from './pages/products.jsx';
import { CategoriesPage, BrandsPage, OffersPage, CouponsPage, BannersPage } from './pages/collections.jsx';
import HomepageBuilder from './pages/Homepage.jsx';
import { SettingsPage, ChatSettingsPage } from './pages/Settings.jsx';
import '../styles/admin.css';

const NAV = [
  ['dashboard', 'layout', ''], ['products', 'box', 'products'], ['categories', 'grid', 'categories'], ['brands', 'tag', 'brands'],
  ['offers', 'percent', 'offers'], ['coupons', 'ticket', 'coupons'], ['banners', 'megaphone', 'banners'],
  ['homepage', 'home', 'homepage'], ['chat', 'chat', 'chat'], ['settings', 'settings', 'settings'],
];

function Shell({ children, wide = false }) {
  const { t } = useI18n();
  return (
    <div className="center-screen admin-gate">
      <div className={`gate-card ${wide ? 'wide' : ''}`}>
        <img src={asset('assets/brand/logo.webp')} alt="" width="72" height="72" />
        <p className="gate-eyebrow">CARBON ADMIN</p>
        {children}
        <Link to="/" className="text-link center">{t('admin.backToStore')}</Link>
      </div>
    </div>
  );
}

function BackendRequired() {
  const { t } = useI18n();
  return (
    <Shell wide>
      <EmptyState icon="lock" tone="warning" title={t('admin.gate.noBackendTitle')} text={t('admin.gate.noBackendText')} />
      <ol className="gate-steps"><li>{t('admin.gate.step1')}</li><li>{t('admin.gate.step2')}</li><li>{t('admin.gate.step3')}</li></ol>
    </Shell>
  );
}

function Login({ auth, preview }) {
  const { t } = useI18n();
  const { run, busy } = useAction();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const go = async (fn) => { setErr(''); try { await fn(); } catch (e) { setErr(t(e?.code === 'auth/too-many-requests' ? 'admin.login.tooMany' : 'admin.login.failed')); } };
  if (preview) {
    return (
      <Shell>
        <h1>{t('admin.login.previewTitle')}</h1>
        <p className="callout warn">{t('admin.login.previewWarn')}</p>
        <button type="button" className="btn btn-primary btn-lg block" onClick={() => auth.signIn()}>{t('admin.login.previewEnter')}</button>
      </Shell>
    );
  }
  return (
    <Shell>
      <h1>{t('admin.login.title')}</h1>
      <button type="button" className="btn btn-outline btn-lg block" disabled={busy} onClick={() => go(() => auth.signIn({ google: true }))}><Icon name="user" size={18} />{t('admin.login.google')}</button>
      <p className="divider"><span>{t('admin.login.or')}</span></p>
      <form className="form-stack" onSubmit={(e) => { e.preventDefault(); run(() => go(() => auth.signIn({ email, password: pw }))); }} noValidate>
        <Field label={t('admin.login.email')} htmlFor="lg-mail"><input id="lg-mail" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t('admin.login.password')} htmlFor="lg-pw">
          <div className="input-row pw"><input id="lg-pw" type={show ? 'text' : 'password'} dir="ltr" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-pressed={show} aria-label={t(show ? 'admin.login.hide' : 'admin.login.show')}><Icon name={show ? 'eyeOff' : 'eye'} size={18} /></button></div>
        </Field>
        {err && <p className="field-error" role="alert">{err}</p>}
        {sent && <p className="callout" role="status">{t('admin.login.resetSent')}</p>}
        <button type="submit" className="btn btn-primary btn-lg block" disabled={busy || !email || !pw}>{busy && <Spinner small />}{t('admin.login.submit')}</button>
        <button type="button" className="text-link center" disabled={!email} onClick={() => go(async () => { await auth.resetPassword(email); setSent(true); })}>{t('admin.login.forgot')}</button>
      </form>
    </Shell>
  );
}

export default function AdminApp({ route }) {
  const { t } = useI18n();
  const { adapter } = useData();
  const [user, setUser] = useState(undefined);
  const [menu, setMenu] = useState(false);
  useSeo({ title: 'Carbon Admin', path: '/admin' });

  useEffect(() => {
    if (!adapter?.auth.available) { setUser(null); return; }
    return adapter.auth.subscribe(setUser);
  }, [adapter]);
  useEffect(() => { document.title = 'Carbon Admin'; let m = document.querySelector('meta[name=robots]'); if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); } m.content = 'noindex,nofollow'; return () => m.remove(); }, []);
  useEffect(() => setMenu(false), [route.path]);

  if (!adapter.auth.available) return <BackendRequired />;
  if (user === undefined) return <div className="center-screen"><Spinner /></div>;
  if (!user) return <Login auth={adapter.auth} preview={adapter.kind === 'local-preview'} />;
  if (!user.isAdmin) {
    return (
      <Shell>
        <EmptyState icon="lock" tone="danger" title={t('admin.gate.deniedTitle')} text={t('admin.gate.deniedText', { email: user.email })} />
        <button type="button" className="btn btn-outline block" onClick={() => adapter.auth.signOut()}>{t('admin.logout')}</button>
      </Shell>
    );
  }

  const seg = route.path.split('/').filter(Boolean).slice(1); // after "admin"
  const page = seg[0] || '';
  let body;
  switch (page) {
    case '': body = <Dashboard />; break;
    case 'products': body = seg[1] ? <ProductForm key={seg[1]} id={seg[1]} /> : <ProductsList />; break;
    case 'categories': body = <CategoriesPage />; break;
    case 'brands': body = <BrandsPage />; break;
    case 'offers': body = <OffersPage />; break;
    case 'coupons': body = <CouponsPage />; break;
    case 'banners': body = <BannersPage />; break;
    case 'homepage': body = <HomepageBuilder />; break;
    case 'chat': body = <ChatSettingsPage />; break;
    case 'settings': body = <SettingsPage />; break;
    default: body = <EmptyState icon="alert" tone="warning" title={t('notFound.title')} action={<Link to="/admin" className="btn btn-primary">{t('admin.nav.dashboard')}</Link>} />;
  }

  const nav = (
    <nav className="ad-nav" aria-label={t('admin.nav.label')}>
      {NAV.map(([key, icon, path]) => {
        const cur = page === path;
        return <Link key={key} to={`/admin${path ? '/' + path : ''}`} className={cur ? 'active' : ''} aria-current={cur ? 'page' : undefined}><Icon name={icon} size={20} /><span>{t(`admin.nav.${key}`)}</span></Link>;
      })}
    </nav>
  );

  return (
    <div className="admin">
      <aside className="ad-side">
        <Link to="/admin" className="ad-brand"><img src={asset('assets/brand/logo.webp')} alt="" width="40" height="40" /><span><b>CARBON</b><i>ADMIN</i></span></Link>
        {nav}
        <Link to="/" className="ad-store"><Icon name="external" size={18} /><span>{t('admin.viewStore')}</span></Link>
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <button type="button" className="icon-btn ad-burger" onClick={() => setMenu(true)} aria-label={t('nav.menu')}><Icon name="menu" size={22} /></button>
          <span className="ad-top-title">CARBON ADMIN</span>
          <div className="ad-top-tools"><LangSwitch compact /><ThemeSwitch />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { adapter.auth.signOut(); navigate('/admin'); }}><Icon name="logout" size={18} /><span className="hide-sm">{t('admin.logout')}</span></button></div>
        </header>
        {adapter.kind === 'local-preview' && <div className="ad-banner" role="note"><Icon name="alert" size={18} />{t('admin.previewBanner')}</div>}
        <main className="ad-content" id="admin-main">{body}</main>
      </div>
      <Overlay open={menu} onClose={() => setMenu(false)} variant="drawer" title="CARBON ADMIN" className="menu-drawer admin-menu">{nav}</Overlay>
    </div>
  );
}
