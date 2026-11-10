import { useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useData } from '../../store/data.jsx';
import { Field, Spinner } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageHead } from '../components/CrudPage.jsx';
import { useAction, L10n, Toggle, ImageField } from '../components/common.jsx';
import { NumField } from './collections.jsx';
import { uid } from '../../utils/format.js';

function useSettingsDraft() {
  const { catalog, setConfig } = useData();
  const { run, busy } = useAction();
  const { t } = useI18n();
  const [s, setS] = useState(() => structuredClone(catalog.settings));
  const [dirty, setDirty] = useState(false);
  const patch = (group, p) => { setS((x) => ({ ...x, [group]: { ...x[group], ...p } })); setDirty(true); };
  const save = () => run(async () => { await setConfig('settings', s); setDirty(false); }, t('admin.saved'));
  return { s, patch, save, busy, dirty };
}

const SaveBtn = ({ busy, dirty, save }) => { const { t } = useI18n(); return <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty || busy}>{busy && <Spinner small />}{t('common.save')}</button>; };

export function SettingsPage() {
  const { t } = useI18n();
  const { s, patch, save, busy, dirty } = useSettingsDraft();
  const st = s.store || {}; const th = s.theme || {}; const g = s.general || {}; const lg = s.languages || {}; const sh = s.shipping || {};
  return (
    <>
      <PageHead title={t('admin.nav.settings')} subtitle={t('admin.settings.sub')} actions={<SaveBtn busy={busy} dirty={dirty} save={save} />} />
      <section className="card"><h2>{t('admin.settings.store')}</h2>
        <L10n label={t('admin.settings.storeName')} value={st.name} onChange={(name) => patch('store', { name })} idBase="st-name" />
        <ImageField label={t('admin.logo')} value={st.logo} onChange={(logo) => patch('store', { logo })} folder="brand" />
        <div className="grid-2">
          <Field label={t('admin.settings.phone')} htmlFor="st-phone"><input id="st-phone" dir="ltr" type="tel" value={st.phone || ''} onChange={(e) => patch('store', { phone: e.target.value })} placeholder="+964…" /></Field>
          <Field label="WhatsApp" hint={t('admin.settings.waHint')} htmlFor="st-wa"><input id="st-wa" dir="ltr" type="tel" value={st.whatsapp || ''} onChange={(e) => patch('store', { whatsapp: e.target.value })} placeholder="9647…" /></Field>
          <Field label="Instagram" htmlFor="st-ig"><input id="st-ig" dir="ltr" type="url" value={st.instagram || ''} onChange={(e) => patch('store', { instagram: e.target.value })} placeholder="https://instagram.com/…" /></Field>
          <Field label={t('admin.settings.email')} htmlFor="st-mail"><input id="st-mail" dir="ltr" type="email" value={st.email || ''} onChange={(e) => patch('store', { email: e.target.value })} /></Field>
        </div>
        <L10n label={t('admin.settings.address')} value={st.address} onChange={(address) => patch('store', { address })} idBase="st-addr" />
      </section>
      <section className="card"><h2>{t('admin.settings.theme')}</h2>
        <div className="grid-3">
          <Field label={t('admin.settings.primary')} htmlFor="th-p"><input id="th-p" type="color" value={th.primary || '#0f9d0f'} onChange={(e) => patch('theme', { primary: e.target.value })} /></Field>
          <Field label={t('admin.settings.accent')} htmlFor="th-a"><input id="th-a" type="color" value={th.accent || '#3ddc3d'} onChange={(e) => patch('theme', { accent: e.target.value })} /></Field>
          <Field label={t('admin.settings.defaultMode')} htmlFor="th-m"><select id="th-m" value={th.defaultMode || 'system'} onChange={(e) => patch('theme', { defaultMode: e.target.value })}>{['system', 'light', 'dark'].map((m) => <option key={m} value={m}>{t(`theme.${m}`)}</option>)}</select></Field>
        </div>
        <p className="field-hint">{t('admin.settings.themeHint')}</p>
        <button type="button" className="text-link" onClick={() => patch('theme', { primary: '#0f9d0f', accent: '#3ddc3d' })}>{t('admin.settings.resetColors')}</button>
      </section>
      <section className="card"><h2>{t('admin.settings.languages')}</h2>
        <Toggle checked label="العربية (RTL)" disabled hint={t('admin.settings.requiredLang')} />
        <Toggle checked label="English (LTR)" disabled hint={t('admin.settings.requiredLang')} />
        <Field label={t('admin.settings.defaultLang')} htmlFor="lg-d"><select id="lg-d" value={lg.default || 'ar'} onChange={(e) => patch('languages', { default: e.target.value })}><option value="ar">العربية</option><option value="en">English</option></select></Field>
      </section>
      <section className="card"><h2>{t('admin.settings.currency')}</h2>
        <Field label={t('admin.settings.currency')} htmlFor="cur"><select id="cur" value="IQD" disabled><option>IQD — {t('admin.settings.iqd')}</option></select></Field>
        <div className="grid-2">
          <NumField id="sh-fee" label={t('admin.settings.shipFee')} value={sh.fee} onChange={(fee) => patch('shipping', { fee })} />
          <NumField id="sh-free" label={t('admin.settings.freeOver')} value={sh.freeOver} onChange={(freeOver) => patch('shipping', { freeOver })} hint={t('admin.settings.freeOverHint')} />
        </div>
      </section>
      <section className="card"><h2>{t('admin.settings.general')}</h2>
        <Toggle checked={g.maintenance} onChange={(maintenance) => patch('general', { maintenance })} label={t('admin.settings.maintenance')} hint={t('admin.settings.maintenanceHint')} />
        <Toggle checked={g.chatEnabled !== false} onChange={(chatEnabled) => patch('general', { chatEnabled })} label={t('admin.settings.chatOn')} />
        <Toggle checked={g.offersEnabled !== false} onChange={(offersEnabled) => patch('general', { offersEnabled })} label={t('admin.settings.offersOn')} />
        <Toggle checked={!!g.reviewsEnabled} onChange={(reviewsEnabled) => patch('general', { reviewsEnabled })} label={t('admin.settings.reviewsOn')} hint={t('admin.settings.reviewsHint')} />
      </section>
    </>
  );
}

export function ChatSettingsPage() {
  const { t, lang } = useI18n();
  const { s, patch, save, busy, dirty } = useSettingsDraft();
  const { catalog } = useData();
  const chat = s.chat || {}; const g = s.general || {};
  const qrs = chat.quickReplies || [];
  const setQ = (i, p) => patch('chat', { quickReplies: qrs.map((q, k) => (k === i ? { ...q, ...p } : q)) });
  return (
    <>
      <PageHead title={t('admin.nav.chat')} subtitle={t('admin.chat.sub')} actions={<SaveBtn busy={busy} dirty={dirty} save={save} />} />
      <section className="card">
        <Toggle checked={g.chatEnabled !== false} onChange={(chatEnabled) => patch('general', { chatEnabled })} label={t('admin.settings.chatOn')} />
        <L10n label={t('admin.chat.welcome')} value={chat.welcome} onChange={(welcome) => patch('chat', { welcome })} textarea rows={2} idBase="ch-w" />
        <L10n label={t('admin.chat.support')} value={chat.supportNote} onChange={(supportNote) => patch('chat', { supportNote })} textarea rows={2} idBase="ch-s" />
        <p className="field-hint">{t('admin.chat.supportHint')}</p>
      </section>
      <section className="card">
        <div className="card-head"><h2>{t('admin.chat.quick')}</h2>
          <button type="button" className="btn btn-outline btn-sm" disabled={qrs.length >= 6} onClick={() => patch('chat', { quickReplies: [...qrs, { id: uid('qr'), label: { ar: '', en: '' }, action: { type: 'category', value: '' } }] })}><Icon name="plus" size={16} />{t('admin.chat.addQuick')}</button></div>
        {qrs.length === 0 && <p className="muted">{t('admin.chat.noQuick')}</p>}
        <ul className="qr-list">
          {qrs.map((q, i) => (
            <li key={q.id}>
              <L10n label={t('admin.chat.label')} value={q.label} onChange={(label) => setQ(i, { label })} idBase={`qr-${i}`} />
              <div className="grid-2">
                <Field label={t('admin.chat.action')} htmlFor={`qa-${i}`}>
                  <select id={`qa-${i}`} value={q.action.type} onChange={(e) => setQ(i, { action: { type: e.target.value, value: '' } })}>{['category', 'offers', 'whatsapp'].map((a) => <option key={a} value={a}>{t(`admin.chat.action.${a}`)}</option>)}</select>
                </Field>
                {q.action.type === 'category' && <Field label={t('admin.category')} htmlFor={`qc-${i}`}><select id={`qc-${i}`} value={q.action.value} onChange={(e) => setQ(i, { action: { ...q.action, value: e.target.value } })}><option value="">—</option>{catalog.categories.filter((c) => c.kind !== 'offers').map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}</select></Field>}
              </div>
              <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => patch('chat', { quickReplies: qrs.filter((_, k) => k !== i) })}><Icon name="trash" size={16} />{t('common.remove')}</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
