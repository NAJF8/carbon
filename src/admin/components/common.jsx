import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { useShop } from '../../store/shop.jsx';
import { Field, Spinner, Skeleton, EmptyState, Img } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Pagination } from '../../pages/Shop.jsx';
import { loc } from '../../utils/format.js';

/** Run an async admin action with busy state + success/error toasts. Read-only backends produce a clear message. */
export function useAction() {
  const { toast } = useShop();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) toast(okMsg); return true; }
    catch (e) {
      const msg = e?.code === 'READ_ONLY_BACKEND' ? t('admin.err.readOnly') : e?.code === 'permission-denied' ? t('admin.err.denied') : t('admin.err.generic');
      toast(msg, { type: 'error' }); console.error(e); return false;
    } finally { setBusy(false); }
  }, [toast, t]);
  return { busy, run };
}

/** Paired Arabic / English inputs. value = { ar, en } */
export function L10n({ label, value = {}, onChange, textarea = false, rows = 3, required, error, idBase }) {
  const { t } = useI18n();
  const id = idBase || 'l10n-' + label;
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="l10n">
      <Field label={`${label} — ${t('admin.lang.ar')}`} htmlFor={`${id}-ar`} required={required} error={error && !value.ar && error}>
        <Tag id={`${id}-ar`} lang="ar" dir="rtl" value={value.ar || ''} rows={textarea ? rows : undefined} onChange={(e) => onChange({ ...value, ar: e.target.value })} />
      </Field>
      <Field label={`${label} — ${t('admin.lang.en')}`} htmlFor={`${id}-en`} required={required}>
        <Tag id={`${id}-en`} lang="en" dir="ltr" value={value.en || ''} rows={textarea ? rows : undefined} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </Field>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`toggle ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" aria-hidden="true"><i /></span>
      <span className="toggle-text"><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

export function StatusBadge({ tone = 'neutral', children }) { return <span className={`status-badge tone-${tone}`}>{children}</span>; }

/** Upload / path / preview for one image. */
export function ImageField({ label, value, onChange, folder = 'products', hint }) {
  const { t } = useI18n();
  const { adapter } = useData();
  const { run, busy } = useAction();
  const [err, setErr] = useState('');
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const pick = async (file) => {
    setErr('');
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|avif|gif)$/.test(file.type)) { setErr(t('admin.img.type')); return; }
    if (file.size > 5 * 1024 * 1024) { setErr(t('admin.img.size')); return; }
    await run(async () => onChange(await adapter.uploadImage(file, folder)));
  };
  return (
    <Field label={label} hint={hint || t('admin.img.pathHint')} error={err}>
      <div className={`img-field ${drag ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
        <div className="img-prev">{value ? <Img src={value} alt="" /> : <Icon name="image" size={28} />}{busy && <span className="img-busy"><Spinner small /></span>}</div>
        <div className="img-ctrl">
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
          <button type="button" className="btn btn-outline btn-sm" onClick={() => input.current.click()}><Icon name="upload" size={16} />{value ? t('admin.img.replace') : t('admin.img.upload')}</button>
          {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}><Icon name="trash" size={16} />{t('common.remove')}</button>}
          <input type="text" dir="ltr" placeholder="assets/…" value={value?.startsWith('data:') ? '' : value || ''} onChange={(e) => onChange(e.target.value.trim())} aria-label={`${label} — ${t('admin.img.path')}`} />
        </div>
      </div>
    </Field>
  );
}

/** Multiple images: drag&drop upload, reorder (drag + buttons), delete, primary = first. */
export function ImageGallery({ images = [], onChange, folder = 'products' }) {
  const { t } = useI18n();
  const { adapter } = useData();
  const { run, busy } = useAction();
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const input = useRef(null);

  const add = async (files) => {
    setErr('');
    const ok = [...files].filter((f) => /^image\/(png|jpe?g|webp|avif|gif)$/.test(f.type) && f.size <= 5 * 1024 * 1024);
    if (ok.length !== files.length) setErr(t('admin.img.some'));
    if (!ok.length) return;
    await run(async () => {
      const urls = [];
      for (const f of ok) urls.push(await adapter.uploadImage(f, folder));
      onChange([...images, ...urls.map((src) => ({ src, alt: '' }))]);
    });
  };
  const move = (i, d) => { const n = [...images]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const makePrimary = (i) => onChange([images[i], ...images.filter((_, k) => k !== i)]);
  const [path, setPath] = useState('');

  return (
    <div className="img-gallery">
      <div className={`dropzone ${over ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}>
        <Icon name="upload" size={28} />
        <p>{t('admin.img.drop')}</p>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => input.current.click()} disabled={busy}>{busy ? <Spinner small /> : <Icon name="plus" size={16} />}{t('admin.img.choose')}</button>
        <small>{t('admin.img.limits')}</small>
      </div>
      <form className="input-row" onSubmit={(e) => { e.preventDefault(); if (path.trim()) { onChange([...images, { src: path.trim(), alt: '' }]); setPath(''); } }}>
        <input dir="ltr" value={path} onChange={(e) => setPath(e.target.value)} placeholder="assets/products/whey-1.webp" aria-label={t('admin.img.path')} />
        <button type="submit" className="btn btn-outline btn-sm">{t('admin.img.addPath')}</button>
      </form>
      {err && <p className="field-error" role="alert">{err}</p>}
      {images.length > 0 && (
        <ul className="thumb-grid">
          {images.map((im, i) => (
            <li key={im.src + i} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx == null || dragIdx === i) return; const n = [...images]; const [m] = n.splice(dragIdx, 1); n.splice(i, 0, m); onChange(n); setDragIdx(null); }} className={dragIdx === i ? 'dragging' : ''}>
              <Img src={im.src} alt={im.alt || ''} ratio="1/1" />
              {i === 0 && <span className="primary-tag">{t('admin.img.primary')}</span>}
              <div className="thumb-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.moveUp')}><Icon name="arrowL" size={14} className="flip-rtl-rev" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={t('admin.moveDown')}><Icon name="arrowR" size={14} className="flip-rtl-rev" /></button>
                {i !== 0 && <button type="button" onClick={() => makePrimary(i)} aria-label={t('admin.img.setPrimary')} title={t('admin.img.setPrimary')}><Icon name="star" size={14} /></button>}
                <button type="button" className="danger" onClick={() => onChange(images.filter((_, k) => k !== i))} aria-label={t('common.remove')}><Icon name="trash" size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Searchable multi-select list (products / categories / brands). items: [{id,label}] */
export function PickList({ label, items, value = [], onChange, emptyText }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const shown = useMemo(() => items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset className="picklist">
      <legend>{label} {value.length > 0 && <b className="count in">{value.length}</b>}</legend>
      {items.length === 0 ? <p className="muted">{emptyText}</p> : (<>
        {items.length > 6 && <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} aria-label={`${t('common.search')} ${label}`} />}
        <ul>{shown.map((i) => <li key={i.id}><label><input type="checkbox" checked={value.includes(i.id)} onChange={() => toggle(i.id)} />{i.label}</label></li>)}</ul>
      </>)}
    </fieldset>
  );
}

/** Responsive table: real <table> on desktop, labelled cards on mobile (CSS). */
export function DataTable({ columns, rows, rowKey = 'id', loading, empty, selectable, selected = [], onSelect, pageSize = 10, toolbar, error, onRetry }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows.length]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const view = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const allOn = view.length > 0 && view.every((r) => selected.includes(r[rowKey]));
  return (
    <div className="dt" aria-busy={loading || undefined}>
      {toolbar}
      {error ? <EmptyState icon="alert" tone="danger" title={t('error.loadTitle')} action={<button type="button" className="btn btn-primary" onClick={onRetry}>{t('common.retry')}</button>} />
        : loading ? <div className="dt-skel">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} h={44} r={10} />)}</div>
        : rows.length === 0 ? empty
        : (<>
          <div className="dt-scroll">
            <table>
              <thead><tr>
                {selectable && <th className="c-sel"><input type="checkbox" checked={allOn} onChange={(e) => onSelect(e.target.checked ? [...new Set([...selected, ...view.map((r) => r[rowKey])])] : selected.filter((id) => !view.some((r) => r[rowKey] === id)))} aria-label={t('admin.selectAll')} /></th>}
                {columns.map((c) => <th key={c.key} scope="col" className={c.className}>{c.header}</th>)}
              </tr></thead>
              <tbody>
                {view.map((r) => (
                  <tr key={r[rowKey]} className={selected.includes(r[rowKey]) ? 'is-selected' : ''}>
                    {selectable && <td className="c-sel"><input type="checkbox" checked={selected.includes(r[rowKey])} onChange={(e) => onSelect(e.target.checked ? [...selected, r[rowKey]] : selected.filter((x) => x !== r[rowKey]))} aria-label={t('admin.selectRow')} /></td>}
                    {columns.map((c) => <td key={c.key} data-label={c.header} className={c.className}>{c.render(r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && <Pagination page={cur} pages={pages} go={setPage} />}
        </>)}
    </div>
  );
}

export const catLabel = (c, lang) => loc(c?.name, lang);
