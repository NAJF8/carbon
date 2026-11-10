import { useMemo } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { Link } from '../../router.jsx';
import { EmptyState, Img } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageHead } from '../components/CrudPage.jsx';
import { StatusBadge } from '../components/common.jsx';
import { loc, todayStr } from '../../utils/format.js';
import { offerStatus, stockStatus } from '../../utils/pricing.js';

function Kpi({ icon, label, value, to, tone = '' }) {
  const body = <><span className={`kpi-icon ${tone}`}><Icon name={icon} size={22} /></span><div><span className="kpi-label">{label}</span><strong>{value}</strong></div></>;
  return to ? <Link to={to} className="kpi">{body}</Link> : <div className="kpi">{body}</div>;
}

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { catalog } = useData();
  const d = useMemo(() => {
    const p = catalog.products;
    const today = todayStr();
    const byCat = catalog.categories.filter((c) => c.kind !== 'offers').map((c) => ({ c, n: p.filter((x) => x.categoryId === c.id).length }));
    return {
      total: p.length, active: p.filter((x) => x.active).length,
      out: p.filter((x) => stockStatus(x) === 'out'), low: p.filter((x) => stockStatus(x) === 'low'),
      offers: catalog.offers.filter((o) => offerStatus(o, today) === 'active').length,
      coupons: catalog.coupons.filter((c) => c.active && (!c.end || c.end >= today)).length,
      recent: [...p].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5), byCat,
    };
  }, [catalog]);
  const max = Math.max(1, ...d.byCat.map((x) => x.n));

  return (
    <>
      <PageHead title={t('admin.nav.dashboard')} subtitle={t('admin.dash.sub')} />
      <div className="kpis">
        <Kpi icon="box" label={t('admin.dash.total')} value={d.total} to="/admin/products" />
        <Kpi icon="check" label={t('admin.dash.active')} value={d.active} tone="ok" to="/admin/products" />
        <Kpi icon="alert" label={t('admin.dash.out')} value={d.out.length} tone={d.out.length ? 'bad' : ''} to="/admin/products" />
        <Kpi icon="percent" label={t('admin.dash.offers')} value={d.offers} to="/admin/offers" />
        <Kpi icon="ticket" label={t('admin.dash.coupons')} value={d.coupons} to="/admin/coupons" />
        <Kpi icon="flame" label={t('admin.dash.low')} value={d.low.length} tone={d.low.length ? 'warn' : ''} to="/admin/products" />
      </div>
      {d.total === 0 && <div className="card"><EmptyState icon="box" title={t('empty.noProducts')} text={t('admin.products.emptyHint')} action={<Link to="/admin/products/new" className="btn btn-primary"><Icon name="plus" size={18} />{t('admin.products.new')}</Link>} /></div>}
      <div className="dash-grid">
        <section className="card">
          <h2>{t('admin.dash.byCategory')}</h2>
          {d.total ? (
            <figure className="bars" role="img" aria-label={d.byCat.map((x) => `${loc(x.c.name, lang)}: ${x.n}`).join(', ')}>
              {d.byCat.map(({ c, n }) => (
                <div key={c.id} className="bar-row"><span>{loc(c.name, lang)}</span><div className="bar"><i style={{ inlineSize: `${(n / max) * 100}%` }} /></div><b>{n}</b></div>
              ))}
            </figure>
          ) : <p className="muted">{t('admin.dash.noData')}</p>}
        </section>
        <section className="card">
          <h2>{t('admin.dash.lowList')}</h2>
          {d.low.length + d.out.length ? (
            <ul className="mini-list">{[...d.out, ...d.low].slice(0, 6).map((p) => (
              <li key={p.id}><Link to={`/admin/products/${p.id}`}>{loc(p.name, lang)}</Link><StatusBadge tone={stockStatus(p) === 'out' ? 'danger' : 'warning'}>{p.stock} · {t(`stock.${stockStatus(p)}`)}</StatusBadge></li>))}</ul>
          ) : <p className="muted">{t('admin.dash.stockOk')}</p>}
        </section>
        <section className="card">
          <h2>{t('admin.dash.recent')}</h2>
          {d.recent.length ? (
            <ul className="mini-list">{d.recent.map((p) => <li key={p.id}><span className="thumb sm">{p.images?.[0]?.src ? <Img src={p.images[0].src} alt="" ratio="1/1" /> : null}</span><Link to={`/admin/products/${p.id}`}>{loc(p.name, lang)}</Link></li>)}</ul>
          ) : <p className="muted">{t('admin.dash.noData')}</p>}
        </section>
        <section className="card">
          <h2>{t('admin.dash.orders')}</h2>
          <p className="muted">{t('admin.dash.ordersNote')}</p>
        </section>
      </div>
    </>
  );
}
