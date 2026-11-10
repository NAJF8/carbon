import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { Link } from '../../router.jsx';
import { LangSwitch, ThemeSwitch, Overlay } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { asset } from '../../utils/assets.js';
import { loc } from '../../utils/format.js';

export function Logo({ compact = false }) {
  const { catalog } = useData();
  const { lang } = useI18n();
  const s = catalog?.settings?.store;
  return (
    <Link to="/" className="logo" aria-label={loc(s?.name, lang) || 'Carbon Group'}>
      <img src={asset(s?.logo || 'assets/brand/logo.webp')} alt="" width="44" height="44" />
      {!compact && <span className="logo-text"><b>CARBON</b><i>GROUP</i></span>}
    </Link>
  );
}

export function useNavItems() {
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const cats = [...catalog.categories].filter((c) => c.active).sort((a, b) => (a.order || 0) - (b.order || 0));
  const items = [
    { to: '/', label: t('nav.home'), match: (p) => p === '/' },
    { to: '/shop', label: t('nav.shop'), match: (p, q) => p === '/shop' && !q.get('cat') },
    ...cats.map((c) => c.kind === 'offers'
      ? { to: '/offers', label: loc(c.name, lang), match: (p) => p === '/offers', offers: true }
      : { to: `/shop?cat=${c.slug || c.id}`, label: loc(c.name, lang), match: (p, q) => p === '/shop' && q.get('cat') === (c.slug || c.id) }),
  ];
  return catalog.settings.general?.offersEnabled === false ? items.filter((i) => !i.offers) : items;
}

export default function Header({ route }) {
  const { t } = useI18n();
  const { count, ui, openUi, wishlist } = useShop();
  const { catalog } = useData();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useNavItems();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMenu(false), [route.path, route.query.toString()]);

  const chatOn = catalog.settings.general?.chatEnabled !== false;
  const cartBtn = (
    <button type="button" className="icon-btn hd-cart" data-cart-target onClick={() => openUi({ cart: true })} aria-label={`${t('cart.title')} (${count})`}>
      <Icon name="cart" size={22} />{count > 0 && <b className="count" aria-hidden="true">{count}</b>}
    </button>
  );

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="hd-inner">
        <button type="button" className="icon-btn hd-menu" onClick={() => setMenu(true)} aria-label={t('nav.menu')} aria-haspopup="dialog"><Icon name="menu" size={22} /></button>
        <Logo />
        <nav className="hd-nav" aria-label={t('nav.main')}>
          {items.map((i) => (
            <Link key={i.to} to={i.to} className={`${i.match(route.path, route.query) ? 'active' : ''} ${i.offers ? 'is-offers' : ''}`}
              aria-current={i.match(route.path, route.query) ? 'page' : undefined}>{i.label}</Link>
          ))}
        </nav>
        <div className="hd-tools">
          <button type="button" className="icon-btn" onClick={() => openUi({ search: true })} aria-label={t('search.title')}><Icon name="search" size={22} /></button>
          <Link to="/wishlist" className="icon-btn hd-wish" aria-label={`${t('wishlist.title')} (${wishlist.length})`}><Icon name="heart" size={22} />{wishlist.length > 0 && <b className="count" aria-hidden="true">{wishlist.length}</b>}</Link>
          {cartBtn}
          <span className="hd-sep" aria-hidden="true" />
          <span className="hd-switches"><LangSwitch /><ThemeSwitch /></span>
          {chatOn && <button type="button" className="icon-btn hd-chat" onClick={() => openUi({ chat: !ui.chat })} aria-label={t('chat.open')} aria-expanded={ui.chat}><Icon name="chat" size={22} /></button>}
        </div>
      </div>

      <Overlay open={menu} onClose={() => setMenu(false)} variant="drawer" title={t('nav.menu')} className="menu-drawer">
        <nav className="menu-links" aria-label={t('nav.main')}>
          {items.map((i) => <Link key={i.to} to={i.to} className={i.match(route.path, route.query) ? 'active' : ''} onClick={() => setMenu(false)}>{i.label}<Icon name="chevR" size={16} className="flip-rtl" /></Link>)}
          <Link to="/wishlist" onClick={() => setMenu(false)}>{t('wishlist.title')}<Icon name="chevR" size={16} className="flip-rtl" /></Link>
        </nav>
        <div className="menu-prefs">
          <div><span>{t('common.language')}</span><LangSwitch /></div>
          <div><span>{t('common.theme')}</span><ThemeSwitch /></div>
        </div>
      </Overlay>
    </header>
  );
}
