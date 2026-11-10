import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { Link } from '../../router.jsx';
import { Logo } from './Header.jsx';
import Icon from '../ui/Icon.jsx';
import { loc } from '../../utils/format.js';
import { waLink } from '../../utils/whatsapp.js';

export default function Footer() {
  const { t, lang } = useI18n();
  const { catalog } = useData();
  const s = catalog.settings.store || {};
  const cats = catalog.categories.filter((c) => c.active);
  const contacts = [
    s.whatsapp && { icon: 'whatsapp', label: 'WhatsApp', href: waLink(s.whatsapp), text: s.whatsapp },
    s.phone && { icon: 'phone', label: t('footer.phone'), href: `tel:${s.phone}`, text: s.phone },
    s.instagram && { icon: 'instagram', label: 'Instagram', href: s.instagram, text: '@carbon__group' },
    s.email && { icon: 'send', label: t('footer.email'), href: `mailto:${s.email}`, text: s.email },
  ].filter(Boolean);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="f-brand">
          <Logo />
          <p>{t('footer.tagline')}</p>
          {loc(s.address, lang) && <p className="muted">{loc(s.address, lang)}</p>}
        </div>
        <nav aria-label={t('footer.shop')}>
          <h3>{t('footer.shop')}</h3>
          <ul>
            <li><Link to="/shop">{t('nav.shop')}</Link></li>
            {cats.map((c) => <li key={c.id}><Link to={c.kind === 'offers' ? '/offers' : `/shop?cat=${c.slug || c.id}`}>{loc(c.name, lang)}</Link></li>)}
          </ul>
        </nav>
        <div>
          <h3>{t('footer.contact')}</h3>
          {contacts.length ? (
            <ul>{contacts.map((c) => <li key={c.label}><a href={c.href} target="_blank" rel="noopener noreferrer"><Icon name={c.icon} size={18} /><span dir="ltr">{c.text}</span></a></li>)}</ul>
          ) : <p className="muted">{t('footer.noContact')}</p>}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Carbon Group Nutrition</span>
        <Link to="/admin" className="text-link subtle">{t('footer.admin')}</Link>
      </div>
    </footer>
  );
}
