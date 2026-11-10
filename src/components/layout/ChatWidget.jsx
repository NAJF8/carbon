import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { navigate } from '../../router.jsx';
import Icon from '../ui/Icon.jsx';
import { asset } from '../../utils/assets.js';
import { loc } from '../../utils/format.js';
import { waLink } from '../../utils/whatsapp.js';

/**
 * Carbon assistant. There is no AI backend, so it is honest about what it does:
 * guided quick replies (configurable in admin) that route the customer, and a hand-off to WhatsApp for free text.
 */
export default function ChatWidget() {
  const { ui, openUi } = useShop();
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const cfg = catalog.settings.chat || {};
  const wa = catalog.settings.store?.whatsapp;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const bodyRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 9e5 }); }, [msgs, ui.chat]);
  useEffect(() => { if (ui.chat) panelRef.current?.querySelector('input')?.focus(); }, [ui.chat]);

  const push = (m) => setMsgs((x) => [...x, m]);
  const act = (qr) => {
    const label = loc(qr.label, lang);
    const a = qr.action || {};
    const cat = a.type === 'category' ? catalog.categories.find((c) => c.id === a.value || c.slug === a.value) : null;
    push({ from: 'user', text: label });
    if (a.type === 'whatsapp') { push({ from: 'bot', text: loc(cfg.supportNote, lang), link: wa ? { label: t('chat.openWhatsApp'), href: waLink(wa) } : null }); return; }
    if (a.type === 'offers') push({ from: 'bot', text: t('chat.offersReply'), nav: { label: t('chat.seeOffers'), to: '/offers' } });
    else if (cat) push({ from: 'bot', text: t('chat.categoryReply', { name: loc(cat.name, lang) }), nav: { label: t('chat.browse', { name: loc(cat.name, lang) }), to: `/shop?cat=${cat.slug || cat.id}` } });
    else push({ from: 'bot', text: loc(cfg.supportNote, lang) });
  };
  const send = (e) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    push({ from: 'user', text: v }); setText('');
    push({ from: 'bot', text: loc(cfg.supportNote, lang), link: wa ? { label: t('chat.sendWhatsApp'), href: waLink(wa, v) } : null,
      nav: { label: t('chat.searchFor', { q: v }), to: `/shop?q=${encodeURIComponent(v)}` } });
  };

  if (cfg && catalog.settings.general?.chatEnabled === false) return null;
  const open = ui.chat;
  return (
    <>
      <button type="button" className={`chat-fab ${open ? 'is-open' : ''}`} onClick={() => openUi({ chat: !open })} aria-label={open ? t('chat.close') : t('chat.open')} aria-expanded={open} aria-controls="chat-panel">
        <img src={asset('assets/brand/assistant.webp')} alt="" width="48" height="48" loading="lazy" />
        <span className="fab-label">{t('chat.title')}</span>
      </button>
      {open && (
        <section id="chat-panel" ref={panelRef} className="chat-panel" role="dialog" aria-label={t('chat.title')} onKeyDown={(e) => e.key === 'Escape' && openUi({ chat: false })}>
          <header>
            <img src={asset('assets/brand/assistant.webp')} alt="" width="40" height="40" />
            <div><b>{t('chat.title')}</b><span>{t('chat.subtitle')}</span></div>
            <button type="button" className="icon-btn" onClick={() => openUi({ chat: false })} aria-label={t('chat.close')}><Icon name="close" size={18} /></button>
          </header>
          <div className="chat-body" ref={bodyRef} aria-live="polite">
            <p className="bubble bot">{loc(cfg.welcome, lang)}</p>
            {msgs.map((m, i) => (
              <div key={i} className={`bubble-wrap ${m.from}`}>
                <p className={`bubble ${m.from}`}>{m.text}</p>
                {m.nav && <button type="button" className="btn btn-outline btn-sm" onClick={() => { openUi({ chat: false }); navigate(m.nav.to); }}>{m.nav.label}</button>}
                {m.link && <a className="btn btn-primary btn-sm" href={m.link.href} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} />{m.link.label}</a>}
              </div>
            ))}
            <div className="quick">
              {(cfg.quickReplies || []).map((q) => <button type="button" key={q.id} className="chip-btn" onClick={() => act(q)}>{loc(q.label, lang)}</button>)}
            </div>
          </div>
          <form className="chat-input" onSubmit={send}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} aria-label={t('chat.placeholder')} />
            <button type="submit" className="icon-btn primary" aria-label={t('chat.send')}><Icon name="send" size={18} className="flip-rtl" /></button>
          </form>
        </section>
      )}
    </>
  );
}
