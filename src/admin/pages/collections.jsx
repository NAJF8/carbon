import { useI18n } from '../../i18n/index.jsx';
import { Field, Img } from '../../components/ui/index.jsx';
import CrudPage from '../components/CrudPage.jsx';
import { L10n, Toggle, ImageField, PickList, StatusBadge } from '../components/common.jsx';
import { loc, slugify, uid, formatMoney, todayStr } from '../../utils/format.js';
import { offerStatus } from '../../utils/pricing.js';

const ICONS = ['protein', 'bolt', 'dumbbell', 'shirt', 'flame', 'box', 'tag', 'grid'];
const nextOrder = (items) => Math.max(0, ...items.map((i) => i.order || 0)) + 1;
export const num = (v) => (v === '' || v == null ? '' : Number(v));

export function NumField({ label, value, onChange, hint, error, min = 0, step = 1, id, required }) {
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id || 'n-' + label} required={required}>
      <input id={id || 'n-' + label} type="number" inputMode="decimal" min={min} step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    </Field>
  );
}
export function DateRange({ draft, set }) {
  const { t } = useI18n();
  return (
    <div className="grid-2">
      <Field label={t('admin.startDate')} htmlFor="d-start"><input id="d-start" type="date" value={draft.start || ''} onChange={(e) => set({ start: e.target.value })} /></Field>
      <Field label={t('admin.endDate')} htmlFor="d-end"><input id="d-end" type="date" min={draft.start || undefined} value={draft.end || ''} onChange={(e) => set({ end: e.target.value })} /></Field>
    </div>
  );
}

/* ───────── Categories ───────── */
export function CategoriesPage() {
  const { t } = useI18n();
  return (
    <CrudPage col="categories" ordered icon="grid" title={t('admin.nav.categories')} subtitle={t('admin.categories.sub')} newLabel={t('admin.categories.new')}
      nameOf={(c, l) => loc(c.name, l)} searchText={(c) => `${c.name.ar} ${c.name.en} ${c.slug}`}
      canDelete={(c, { catalog }) => c.kind !== 'offers' && !catalog.products.some((p) => p.categoryId === c.id)}
      normalize={(d) => ({ ...d, slug: d.slug || slugify(d.name.en) })}
      makeNew={({ items }) => ({ id: uid('cat'), slug: '', name: { ar: '', en: '' }, icon: 'box', image: '', active: true, order: nextOrder(items) })}
      validate={(d, { items, t: tt }) => ({
        ...(!d.name.ar.trim() || !d.name.en.trim() ? { name: tt('admin.err.nameBoth') } : {}),
        ...(items.some((c) => c.id !== d.id && (c.slug || c.id) === (d.slug || slugify(d.name.en))) ? { slug: tt('admin.err.slugTaken') } : {}),
      })}
      columns={({ catalog, lang }) => [
        { key: 'img', header: '', className: 'c-img', render: (c) => <span className="thumb">{c.image ? <Img src={c.image} alt="" ratio="1/1" /> : <span className="thumb-ph">{(c.name.en || '?')[0]}</span>}</span> },
        { key: 'name', header: t('admin.name'), render: (c) => <div className="cell-main"><b>{loc(c.name, lang)}</b><small>{lang === 'ar' ? c.name.en : c.name.ar}</small></div> },
        { key: 'slug', header: 'Slug', render: (c) => <code dir="ltr">{c.slug || c.id}</code> },
        { key: 'count', header: t('admin.products'), render: (c) => (c.kind === 'offers' ? '—' : catalog.products.filter((p) => p.categoryId === c.id).length) },
      ]}
      Form={({ draft, set, errors, isNew }) => (
        <div className="form-stack">
          <L10n label={t('admin.name')} value={draft.name} onChange={(name) => set({ name, ...(isNew && !draft.slug ? {} : {}) })} required error={errors.name} />
          <Field label="Slug" hint={t('admin.slugHint')} error={errors.slug} htmlFor="c-slug"><input id="c-slug" dir="ltr" value={draft.slug} placeholder={slugify(draft.name.en)} onChange={(e) => set({ slug: slugify(e.target.value) })} disabled={draft.kind === 'offers'} /></Field>
          <Field label={t('admin.icon')} htmlFor="c-icon"><select id="c-icon" value={draft.icon} onChange={(e) => set({ icon: e.target.value })}>{ICONS.map((i) => <option key={i}>{i}</option>)}</select></Field>
          <ImageField label={t('admin.categoryImage')} value={draft.image} onChange={(image) => set({ image })} folder="categories" />
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label={t('admin.active')} />
          {draft.kind === 'offers' && <p className="field-hint">{t('admin.categories.offersNote')}</p>}
        </div>
      )} />
  );
}

/* ───────── Brands ───────── */
export function BrandsPage() {
  const { t } = useI18n();
  return (
    <CrudPage col="brands" icon="tag" title={t('admin.nav.brands')} subtitle={t('admin.brands.sub')} newLabel={t('admin.brands.new')}
      nameOf={(b, l) => loc(b.name, l)} searchText={(b) => `${b.name.ar} ${b.name.en}`}
      canDelete={(b, { catalog }) => !catalog.products.some((p) => p.brandId === b.id)}
      makeNew={() => ({ id: uid('brand'), name: { ar: '', en: '' }, logo: '', active: true })}
      validate={(d, { t: tt }) => (!d.name.ar.trim() || !d.name.en.trim() ? { name: tt('admin.err.nameBoth') } : {})}
      columns={({ catalog, lang }) => [
        { key: 'img', header: '', className: 'c-img', render: (b) => <span className="thumb">{b.logo ? <Img src={b.logo} alt="" ratio="1/1" /> : <span className="thumb-ph">{(b.name.en || '?')[0]}</span>}</span> },
        { key: 'name', header: t('admin.name'), render: (b) => <div className="cell-main"><b>{loc(b.name, lang)}</b><small>{lang === 'ar' ? b.name.en : b.name.ar}</small></div> },
        { key: 'count', header: t('admin.products'), render: (b) => catalog.products.filter((p) => p.brandId === b.id).length },
      ]}
      Form={({ draft, set, errors }) => (
        <div className="form-stack">
          <L10n label={t('admin.name')} value={draft.name} onChange={(name) => set({ name })} required error={errors.name} />
          <ImageField label={t('admin.logo')} value={draft.logo} onChange={(logo) => set({ logo })} folder="brands" />
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label={t('admin.active')} />
        </div>
      )} />
  );
}

/* ───────── Offers ───────── */
const statusTone = { active: 'success', scheduled: 'info', expired: 'neutral', disabled: 'neutral' };
export function OffersPage() {
  const { t } = useI18n();
  return (
    <CrudPage col="offers" icon="percent" title={t('admin.nav.offers')} subtitle={t('admin.offers.sub')} newLabel={t('admin.offers.new')}
      nameOf={(o, l) => loc(o.name, l)} searchText={(o) => `${o.name.ar} ${o.name.en}`}
      makeNew={() => ({ id: uid('offer'), name: { ar: '', en: '' }, banner: '', start: todayStr(), end: '', type: 'percent', value: 10, scope: 'products', productIds: [], categoryIds: [], brandIds: [], active: true })}
      validate={(d, { t: tt }) => ({
        ...(!d.name.ar.trim() || !d.name.en.trim() ? { name: tt('admin.err.nameBoth') } : {}),
        ...(!(Number(d.value) > 0) || (d.type === 'percent' && d.value > 100) ? { value: tt('admin.err.discountValue') } : {}),
        ...(d.end && d.start && d.end < d.start ? { date: tt('admin.err.dateOrder') } : {}),
        ...(d.scope === 'products' && !d.productIds.length ? { scope: tt('admin.err.pickOne') } : {}),
        ...(d.scope === 'categories' && !d.categoryIds.length ? { scope: tt('admin.err.pickOne') } : {}),
        ...(d.scope === 'brands' && !d.brandIds.length ? { scope: tt('admin.err.pickOne') } : {}),
      })}
      columns={({ lang }) => [
        { key: 'name', header: t('admin.name'), render: (o) => <div className="cell-main"><b>{loc(o.name, lang)}</b><small>{o.start || '…'} → {o.end || '∞'}</small></div> },
        { key: 'disc', header: t('admin.discount'), render: (o) => <b>{o.type === 'percent' ? `${o.value}%` : formatMoney(o.value, lang)}</b> },
        { key: 'scope', header: t('admin.scope'), render: (o) => t(`admin.scope.${o.scope}`) },
        { key: 'status', header: t('admin.schedule'), render: (o) => { const s = offerStatus(o); return <StatusBadge tone={statusTone[s]}>{t(`admin.offerStatus.${s}`)}</StatusBadge>; } },
      ]}
      Form={({ draft, set, errors, ctx }) => (
        <div className="form-stack">
          <L10n label={t('admin.offers.name')} value={draft.name} onChange={(name) => set({ name })} required error={errors.name} />
          <ImageField label={t('admin.offers.banner')} value={draft.banner} onChange={(banner) => set({ banner })} folder="banners" />
          <DateRange draft={draft} set={set} />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
          <div className="grid-2">
            <Field label={t('admin.discountType')} htmlFor="o-type"><select id="o-type" value={draft.type} onChange={(e) => set({ type: e.target.value })}><option value="percent">{t('admin.percent')}</option><option value="fixed">{t('admin.fixed')}</option></select></Field>
            <NumField id="o-val" label={draft.type === 'percent' ? '%' : 'IQD'} value={draft.value} onChange={(value) => set({ value })} error={errors.value} required />
          </div>
          <Field label={t('admin.scope')} htmlFor="o-scope" error={errors.scope}>
            <select id="o-scope" value={draft.scope} onChange={(e) => set({ scope: e.target.value })}>{['products', 'categories', 'brands', 'all'].map((s) => <option key={s} value={s}>{t(`admin.scope.${s}`)}</option>)}</select>
          </Field>
          {draft.scope === 'products' && <PickList label={t('admin.products')} items={ctx.catalog.products.map((p) => ({ id: p.id, label: loc(p.name, ctx.lang) }))} value={draft.productIds} onChange={(productIds) => set({ productIds })} emptyText={t('admin.noProductsYet')} />}
          {draft.scope === 'categories' && <PickList label={t('admin.nav.categories')} items={ctx.catalog.categories.filter((c) => c.kind !== 'offers').map((c) => ({ id: c.id, label: loc(c.name, ctx.lang) }))} value={draft.categoryIds} onChange={(categoryIds) => set({ categoryIds })} />}
          {draft.scope === 'brands' && <PickList label={t('admin.nav.brands')} items={ctx.catalog.brands.map((b) => ({ id: b.id, label: loc(b.name, ctx.lang) }))} value={draft.brandIds} onChange={(brandIds) => set({ brandIds })} emptyText={t('admin.noBrandsYet')} />}
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label={t('admin.active')} hint={t('admin.offers.activeHint')} />
        </div>
      )} />
  );
}

/* ───────── Coupons ───────── */
export function CouponsPage() {
  const { t } = useI18n();
  return (
    <CrudPage col="coupons" icon="ticket" title={t('admin.nav.coupons')} subtitle={t('admin.coupons.sub')} newLabel={t('admin.coupons.new')}
      nameOf={(c) => c.code} searchText={(c) => c.code}
      makeNew={() => ({ id: uid('cpn'), code: '', type: 'percent', value: 10, minOrder: '', maxDiscount: '', start: '', end: '', usageLimit: '', usedCount: 0, perCustomerLimit: '', productIds: [], categoryIds: [], active: true })}
      validate={(d, { items, t: tt }) => ({
        ...(!d.code.trim() ? { code: tt('admin.err.required') } : items.some((c) => c.id !== d.id && c.code.toUpperCase() === d.code.trim().toUpperCase()) ? { code: tt('admin.err.codeTaken') } : {}),
        ...(!(Number(d.value) > 0) || (d.type === 'percent' && d.value > 100) ? { value: tt('admin.err.discountValue') } : {}),
        ...(d.end && d.start && d.end < d.start ? { date: tt('admin.err.dateOrder') } : {}),
      })}
      columns={({ lang }) => [
        { key: 'code', header: t('admin.coupons.code'), render: (c) => <code className="code-pill" dir="ltr">{c.code}</code> },
        { key: 'disc', header: t('admin.discount'), render: (c) => <b>{c.type === 'percent' ? `${c.value}%` : formatMoney(c.value, lang)}</b> },
        { key: 'valid', header: t('admin.validity'), render: (c) => { const exp = c.end && todayStr() > c.end; return exp ? <StatusBadge tone="danger">{t('admin.offerStatus.expired')}</StatusBadge> : <small>{c.start || '…'} → {c.end || '∞'}</small>; } },
        { key: 'usage', header: t('admin.coupons.usage'), render: (c) => `${c.usedCount || 0}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
      ]}
      Form={({ draft, set, errors, ctx }) => (
        <div className="form-stack">
          <Field label={t('admin.coupons.code')} htmlFor="cp-code" error={errors.code} required><input id="cp-code" dir="ltr" value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="CARBON10" /></Field>
          <div className="grid-2">
            <Field label={t('admin.discountType')} htmlFor="cp-type"><select id="cp-type" value={draft.type} onChange={(e) => set({ type: e.target.value })}><option value="percent">{t('admin.percent')}</option><option value="fixed">{t('admin.fixed')}</option></select></Field>
            <NumField id="cp-val" label={t('admin.discountValue')} value={draft.value} onChange={(value) => set({ value })} error={errors.value} required />
          </div>
          <div className="grid-2">
            <NumField id="cp-min" label={t('admin.coupons.minOrder')} value={draft.minOrder} onChange={(minOrder) => set({ minOrder })} />
            <NumField id="cp-max" label={t('admin.coupons.maxDiscount')} value={draft.maxDiscount} onChange={(maxDiscount) => set({ maxDiscount })} hint={t('admin.coupons.maxHint')} />
          </div>
          <DateRange draft={draft} set={set} />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
          <div className="grid-2">
            <NumField id="cp-lim" label={t('admin.coupons.usageLimit')} value={draft.usageLimit} onChange={(usageLimit) => set({ usageLimit })} hint={t('admin.coupons.used', { n: draft.usedCount || 0 })} />
            <NumField id="cp-cust" label={t('admin.coupons.perCustomer')} value={draft.perCustomerLimit} onChange={(perCustomerLimit) => set({ perCustomerLimit })} />
          </div>
          <PickList label={t('admin.coupons.products')} items={ctx.catalog.products.map((p) => ({ id: p.id, label: loc(p.name, ctx.lang) }))} value={draft.productIds} onChange={(productIds) => set({ productIds })} emptyText={t('admin.noProductsYet')} />
          <PickList label={t('admin.coupons.categories')} items={ctx.catalog.categories.filter((c) => c.kind !== 'offers').map((c) => ({ id: c.id, label: loc(c.name, ctx.lang) }))} value={draft.categoryIds} onChange={(categoryIds) => set({ categoryIds })} />
          <p className="field-hint">{t('admin.coupons.restrictHint')}</p>
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label={t('admin.active')} />
          <p className="callout">{t('admin.coupons.serverNote')}</p>
        </div>
      )} />
  );
}

/* ───────── Banners ───────── */
export function BannersPage() {
  const { t } = useI18n();
  return (
    <CrudPage col="banners" ordered icon="megaphone" title={t('admin.nav.banners')} subtitle={t('admin.banners.sub')} newLabel={t('admin.banners.new')}
      nameOf={(b, l) => loc(b.title, l)} searchText={(b) => `${b.title.ar} ${b.title.en}`}
      makeNew={({ items }) => ({ id: uid('bn'), title: { ar: '', en: '' }, image: '', imageMobile: '', cta: { label: { ar: '', en: '' } }, link: '', start: '', end: '', active: true, order: nextOrder(items) })}
      validate={(d, { t: tt }) => ({
        ...(!d.title.ar.trim() || !d.title.en.trim() ? { title: tt('admin.err.nameBoth') } : {}),
        ...(!d.image ? { image: tt('admin.err.imageRequired') } : {}),
        ...(d.end && d.start && d.end < d.start ? { date: tt('admin.err.dateOrder') } : {}),
      })}
      columns={({ lang }) => [
        { key: 'img', header: '', className: 'c-img', render: (b) => <span className="thumb wide">{b.image && <Img src={b.image} alt="" />}</span> },
        { key: 'title', header: t('admin.name'), render: (b) => <div className="cell-main"><b>{loc(b.title, lang)}</b><small>{b.start || '…'} → {b.end || '∞'}</small></div> },
        { key: 'link', header: t('admin.link'), render: (b) => <code dir="ltr">{b.link || '—'}</code> },
      ]}
      Form={({ draft, set, errors }) => (
        <div className="form-stack">
          <L10n label={t('admin.banners.title')} value={draft.title} onChange={(title) => set({ title })} required error={errors.title} />
          <ImageField label={t('admin.banners.desktop')} value={draft.image} onChange={(image) => set({ image })} folder="banners" hint={t('admin.banners.desktopHint')} />
          {errors.image && <p className="field-error" role="alert">{errors.image}</p>}
          <ImageField label={t('admin.banners.mobile')} value={draft.imageMobile} onChange={(imageMobile) => set({ imageMobile })} folder="banners" hint={t('admin.banners.mobileHint')} />
          <L10n label={t('admin.banners.cta')} value={draft.cta?.label} onChange={(label) => set({ cta: { ...draft.cta, label } })} />
          <Field label={t('admin.link')} hint={t('admin.linkHint')} htmlFor="bn-link"><input id="bn-link" dir="ltr" value={draft.link} placeholder="/shop?cat=protein" onChange={(e) => set({ link: e.target.value })} /></Field>
          <DateRange draft={draft} set={set} />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label={t('admin.active')} />
        </div>
      )} />
  );
}
