import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { Field, Overlay, ConfirmDialog, Spinner } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageHead } from '../components/CrudPage.jsx';
import { useAction, L10n, Toggle, ImageField, PickList } from '../components/common.jsx';
import { loc, uid } from '../../utils/format.js';

const SOURCES = ['offers', 'bestseller', 'new', 'featured', 'category', 'manual'];
const BGS = ['default', 'surface', 'dark'];

export default function HomepageBuilder() {
  const { t, lang } = useI18n();
  const { catalog, setConfig } = useData();
  const { run, busy } = useAction();
  const [home, setHome] = useState(() => structuredClone(catalog.home));
  const [dirty, setDirty] = useState(false);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  useEffect(() => { if (!dirty) setHome(structuredClone(catalog.home)); }, [catalog.home]); // eslint-disable-line

  const change = (fn) => { setHome((h) => { const n = structuredClone(h); fn(n); return n; }); setDirty(true); };
  const hero = home.hero || {};
  const setHero = (patch) => change((h) => { h.hero = { ...h.hero, ...patch }; });
  const move = (i, d) => change((h) => { const j = i + d; if (j < 0 || j >= h.sections.length) return; [h.sections[i], h.sections[j]] = [h.sections[j], h.sections[i]]; });
  const save = () => run(async () => { await setConfig('home', home); setDirty(false); }, t('admin.saved'));
  const sectionName = (s) => loc(s.title, lang) || t(`admin.home.type.${s.type}`);

  return (
    <>
      <PageHead title={t('admin.nav.homepage')} subtitle={t('admin.home.sub')}
        actions={<><a className="btn btn-ghost" href="#/" target="_blank" rel="noopener"><Icon name="external" size={18} />{t('admin.preview')}</a>
          <button type="button" className="btn btn-primary" disabled={!dirty || busy} onClick={save}>{busy && <Spinner small />}{t('common.save')}</button></>} />
      <section className="card">
        <div className="card-head"><h2>{t('admin.home.hero')}</h2><Toggle checked={hero.active} onChange={(active) => setHero({ active })} label={t('admin.active')} /></div>
        <L10n label={t('admin.home.title')} value={hero.title} onChange={(title) => setHero({ title })} idBase="h-title" />
        <L10n label={t('admin.home.subtitle')} value={hero.subtitle} onChange={(subtitle) => setHero({ subtitle })} textarea rows={2} idBase="h-sub" />
        <ImageField label={t('admin.home.heroImage')} value={hero.image} onChange={(image) => setHero({ image, imageSmall: '' })} folder="banners" hint={t('admin.home.heroImageHint')} />
        <div className="grid-2">
          <div className="form-stack">
            <L10n label={t('admin.home.cta')} value={hero.cta?.label} onChange={(label) => setHero({ cta: { ...hero.cta, label } })} idBase="h-cta" />
            <Field label={t('admin.link')} htmlFor="h-link" hint={t('admin.linkHint')}><input id="h-link" dir="ltr" value={hero.cta?.link || ''} onChange={(e) => setHero({ cta: { ...hero.cta, link: e.target.value } })} /></Field>
          </div>
          <div className="form-stack">
            <L10n label={t('admin.home.cta2')} value={hero.cta2?.label} onChange={(label) => setHero({ cta2: { ...hero.cta2, label } })} idBase="h-cta2" />
            <Field label={t('admin.link')} htmlFor="h-link2"><input id="h-link2" dir="ltr" value={hero.cta2?.link || ''} onChange={(e) => setHero({ cta2: { ...hero.cta2, link: e.target.value } })} /></Field>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>{t('admin.home.sections')}</h2>
          <div className="row-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEdit({ id: uid('sec'), type: 'products', source: 'manual', active: true, title: { ar: '', en: '' }, subtitle: { ar: '', en: '' }, background: 'default', productIds: [], isNew: true })}><Icon name="plus" size={16} />{t('admin.home.addSection')}</button>
          </div></div>
        <p className="field-hint">{t('admin.home.orderHint')}</p>
        <ol className="sec-list">
          <li className="sec-fixed"><Icon name="layout" size={18} /><span>{t('admin.home.fixedHero')}</span></li>
          {home.sections.map((s, i) => (
            <li key={s.id} className={s.active ? '' : 'is-off'}>
              <span className="sec-num">{i + 1}</span>
              <div className="sec-info"><b>{sectionName(s)}</b><small>{t(`admin.home.type.${s.type}`)}{s.type === 'products' ? ` · ${t(`admin.home.source.${s.source}`)}` : ''}</small></div>
              <Toggle checked={s.active} onChange={(v) => change((h) => { h.sections[i].active = v; })} label={<span className="sr-only">{t('admin.active')}: {sectionName(s)}</span>} />
              <div className="row-actions">
                <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.moveUp')}><Icon name="chevU" size={18} /></button>
                <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === home.sections.length - 1} aria-label={t('admin.moveDown')}><Icon name="chevD" size={18} /></button>
                <button type="button" className="icon-btn" onClick={() => setEdit(structuredClone(s))} aria-label={`${t('common.edit')}: ${sectionName(s)}`}><Icon name="edit" size={18} /></button>
                <button type="button" className="icon-btn danger" onClick={() => setDel(s)} aria-label={`${t('common.delete')}: ${sectionName(s)}`}><Icon name="trash" size={18} /></button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Overlay open={!!edit} onClose={() => setEdit(null)} variant="drawer" size="lg" className="admin-drawer" title={t('admin.home.editSection')}
        footer={<><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => { const { isNew, ...s } = edit; change((h) => { const i = h.sections.findIndex((x) => x.id === s.id); if (i >= 0) h.sections[i] = s; else h.sections.push(s); }); setEdit(null); }}>{t('admin.home.apply')}</button></>}>
        {edit && (
          <div className="form-stack">
            <Field label={t('admin.home.sectionType')} htmlFor="sec-type">
              <select id="sec-type" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })} disabled={!edit.isNew}>{['products', 'categories', 'banners'].map((x) => <option key={x} value={x}>{t(`admin.home.type.${x}`)}</option>)}</select>
            </Field>
            <L10n label={t('admin.home.title')} value={edit.title} onChange={(title) => setEdit({ ...edit, title })} idBase="sec-title" />
            <L10n label={t('admin.home.subtitle')} value={edit.subtitle} onChange={(subtitle) => setEdit({ ...edit, subtitle })} idBase="sec-sub" />
            {edit.type === 'products' && (<>
              <Field label={t('admin.home.sourceLabel')} htmlFor="sec-src"><select id="sec-src" value={edit.source} onChange={(e) => setEdit({ ...edit, source: e.target.value })}>{SOURCES.map((x) => <option key={x} value={x}>{t(`admin.home.source.${x}`)}</option>)}</select></Field>
              {edit.source === 'category' && <Field label={t('admin.category')} htmlFor="sec-cat"><select id="sec-cat" value={edit.categoryId || ''} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}><option value="">—</option>{catalog.categories.filter((c) => c.kind !== 'offers').map((c) => <option key={c.id} value={c.id}>{loc(c.name, lang)}</option>)}</select></Field>}
              {edit.source === 'manual' && <PickList label={t('admin.products')} items={catalog.products.map((p) => ({ id: p.id, label: loc(p.name, lang) }))} value={edit.productIds || []} onChange={(productIds) => setEdit({ ...edit, productIds })} emptyText={t('admin.noProductsYet')} />}
              <Field label={t('admin.link')} hint={t('admin.home.viewAllHint')} htmlFor="sec-link"><input id="sec-link" dir="ltr" value={edit.link || ''} onChange={(e) => setEdit({ ...edit, link: e.target.value })} placeholder="/shop?cat=protein" /></Field>
            </>)}
            <Field label={t('admin.home.background')} htmlFor="sec-bg"><select id="sec-bg" value={edit.background || 'default'} onChange={(e) => setEdit({ ...edit, background: e.target.value })}>{BGS.map((b) => <option key={b} value={b}>{t(`admin.home.bg.${b}`)}</option>)}</select></Field>
            <Toggle checked={edit.active} onChange={(active) => setEdit({ ...edit, active })} label={t('admin.active')} />
          </div>
        )}
      </Overlay>
      <ConfirmDialog open={!!del} title={t('admin.deleteTitle')} message={del ? t('admin.deleteMsg', { name: sectionName(del) }) : ''} confirmLabel={t('common.delete')} onCancel={() => setDel(null)}
        onConfirm={() => { change((h) => { h.sections = h.sections.filter((x) => x.id !== del.id); }); setDel(null); }} />
    </>
  );
}
