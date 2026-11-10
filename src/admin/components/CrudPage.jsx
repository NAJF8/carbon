import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { Overlay, ConfirmDialog, EmptyState, Spinner } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { DataTable, useAction } from './common.jsx';
import { norm } from '../../utils/search.js';

export function PageHead({ title, subtitle, actions }) {
  return (
    <div className="ad-head">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="ad-head-actions">{actions}</div>}
    </div>
  );
}

/**
 * Generic collection manager: searchable table + drawer form + confirmed delete + optional ordering.
 * Used for categories, brands, offers, coupons and banners so they behave identically.
 */
export default function CrudPage({ col, title, subtitle, newLabel, columns, makeNew, Form, validate, nameOf, searchText, icon = 'box', ordered = false, extraToolbar, afterSave, canDelete = () => true, emptyText, normalize }) {
  const { t, lang } = useI18n();
  const { catalog, upsert, remove } = useData();
  const { run, busy } = useAction();
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);

  const items = catalog[col];
  const rows = useMemo(() => {
    let r = [...items];
    if (ordered) r.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (q) r = r.filter((i) => norm(searchText ? searchText(i) : nameOf(i, lang)).includes(norm(q)));
    return r;
  }, [items, q, ordered, lang, searchText, nameOf]);

  const ctx = { catalog, lang, t, items };
  const isNew = draft && !items.some((i) => i.id === draft.id);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    const errs = validate ? validate(draft, ctx) : {};
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await run(async () => { await upsert(col, normalize ? normalize(draft, ctx) : draft); await afterSave?.(draft, ctx); }, t('admin.saved'));
    if (ok) setDraft(null);
  };
  const move = async (item, d) => {
    const list = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    const i = list.findIndex((x) => x.id === item.id); const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await run(async () => { for (let k = 0; k < list.length; k++) if ((list[k].order || 0) !== k + 1) await upsert(col, { ...list[k], order: k + 1 }); });
  };
  const toggle = (item) => run(() => upsert(col, { ...item, active: !item.active }));

  const cols = [
    ...columns(ctx),
    { key: 'actions', header: t('admin.actions'), className: 'c-actions', render: (r) => (
      <div className="row-actions">
        {ordered && <>
          <button type="button" className="icon-btn" onClick={() => move(r, -1)} aria-label={t('admin.moveUp')}><Icon name="chevU" size={18} /></button>
          <button type="button" className="icon-btn" onClick={() => move(r, 1)} aria-label={t('admin.moveDown')}><Icon name="chevD" size={18} /></button>
        </>}
        <button type="button" className="icon-btn" onClick={() => { setErrors({}); setDraft(structuredClone(r)); }} aria-label={`${t('common.edit')}: ${nameOf(r, lang)}`}><Icon name="edit" size={18} /></button>
        <button type="button" className="icon-btn danger" disabled={!canDelete(r, ctx)} title={!canDelete(r, ctx) ? t('admin.cannotDelete') : undefined} onClick={() => setDel(r)} aria-label={`${t('common.delete')}: ${nameOf(r, lang)}`}><Icon name="trash" size={18} /></button>
      </div>) },
  ];
  if (!cols.some((c) => c.key === 'active') && items[0] && 'active' in (items[0] || {})) {
    cols.splice(cols.length - 1, 0, { key: 'active', header: t('admin.status'), render: (r) => (
      <label className="mini-toggle"><input type="checkbox" role="switch" checked={!!r.active} onChange={() => toggle(r)} aria-label={`${t('admin.active')}: ${nameOf(r, lang)}`} /><span aria-hidden="true"><i /></span>{r.active ? t('admin.active') : t('admin.inactive')}</label>) });
  }

  return (
    <>
      <PageHead title={title} subtitle={subtitle} actions={<button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setDraft(makeNew(ctx)); }}><Icon name="plus" size={18} />{newLabel}</button>} />
      <DataTable columns={cols} rows={rows} pageSize={12}
        toolbar={<div className="dt-toolbar"><label className="shop-search"><Icon name="search" size={18} /><span className="sr-only">{t('common.search')}</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} /></label>{extraToolbar}</div>}
        empty={<EmptyState icon={icon} title={q ? t('empty.noResults') : emptyText || t('admin.empty.generic')} text={q ? undefined : t('admin.empty.hint')}
          action={!q && <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setDraft(makeNew(ctx)); }}><Icon name="plus" size={18} />{newLabel}</button>} />} />
      <Overlay open={!!draft} onClose={() => setDraft(null)} variant="drawer" size="lg" className="admin-drawer" title={draft ? (isNew ? newLabel : `${t('common.edit')}: ${nameOf(draft, lang) || ''}`) : ''}
        footer={<><button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>{t('common.cancel')}</button><button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy && <Spinner small />}{t('common.save')}</button></>}>
        {draft && <Form draft={draft} set={set} errors={errors} ctx={ctx} isNew={isNew} />}
      </Overlay>
      <ConfirmDialog open={!!del} title={t('admin.deleteTitle')} message={del ? t('admin.deleteMsg', { name: nameOf(del, lang) }) : ''} confirmLabel={t('common.delete')} busy={busy}
        onCancel={() => setDel(null)} onConfirm={async () => { if (await run(() => remove(col, del.id), t('admin.deleted'))) setDel(null); }} />
    </>
  );
}
