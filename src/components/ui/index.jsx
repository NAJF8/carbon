import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useDialog } from '../../hooks/index.js';
import { useI18n } from '../../i18n/index.jsx';
import { useTheme } from '../../store/theme.jsx';
import { asset } from '../../utils/assets.js';

/* ───────── Overlay: modal / drawer / bottom sheet on native <dialog> ───────── */
export function Overlay({ open, onClose, variant = 'modal', title, children, footer, size = 'md', className = '', labelledBy, headerExtra }) {
  const { t } = useI18n();
  const ref = useDialog(open, onClose);
  const id = labelledBy || 'ov-' + (title || '').length;
  return (
    <dialog ref={ref} className={`overlay overlay-${variant} size-${size} ${className}`} aria-labelledby={id}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      {open && (
        <div className="overlay-panel">
          {variant === 'sheet' && <span className="sheet-grip" aria-hidden="true" />}
          <header className="overlay-head">
            <h2 id={id}>{title}</h2>
            {headerExtra}
            <button type="button" className="icon-btn" onClick={() => ref.current.close()} aria-label={t('common.close')}><Icon name="close" /></button>
          </header>
          <div className="overlay-body">{children}</div>
          {footer && <footer className="overlay-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, danger = true, busy = false }) {
  const { t } = useI18n();
  return (
    <Overlay open={open} onClose={onCancel} title={title} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy && <Spinner small />}{confirmLabel || t('common.confirm')}
        </button>
      </>}>
      <p className="confirm-msg">{message}</p>
    </Overlay>
  );
}

/* ───────── Feedback ───────── */
export function Spinner({ small = false, label }) {
  const { t } = useI18n();
  return <span className={`spinner ${small ? 'spinner-sm' : ''}`} role="status"><span className="sr-only">{label || t('common.loading')}</span></span>;
}

export const Skeleton = ({ w, h = 16, r, className = '' }) => (
  <span className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
);

export function EmptyState({ icon = 'box', title, text, action, tone = 'neutral' }) {
  return (
    <div className={`empty tone-${tone}`}>
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Toaster({ toasts, dismiss }) {
  return (
    <div className="toaster" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((x) => <ToastItem key={x.id} toast={x} dismiss={dismiss} />)}
    </div>
  );
}
function ToastItem({ toast, dismiss }) {
  const { t } = useI18n();
  const paused = useRef(false);
  useEffect(() => {
    let left = 4500, last = Date.now();
    const iv = setInterval(() => {
      const now = Date.now();
      if (!paused.current) left -= now - last;
      last = now;
      if (left <= 0) dismiss(toast.id);
    }, 200);
    return () => clearInterval(iv);
  }, [toast.id, dismiss]);
  const icon = { success: 'check', error: 'alert', warning: 'alert', info: 'info' }[toast.type] || 'info';
  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)} onBlur={() => (paused.current = false)}>
      <Icon name={icon} size={18} />
      <span className="toast-msg">{toast.message}</span>
      {toast.action && <button type="button" className="toast-act" onClick={() => { toast.action.run(); dismiss(toast.id); }}>{toast.action.label}</button>}
      <button type="button" className="toast-x" onClick={() => dismiss(toast.id)} aria-label={t('common.close')}><Icon name="close" size={16} /></button>
    </div>
  );
}

/* ───────── Media ───────── */
export function Img({ src, alt = '', className = '', ratio, eager = false, sizes, ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <span className={`img-ph ${className}`} style={ratio ? { aspectRatio: ratio } : undefined} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <img src={asset('assets/brand/logo.webp')} alt="" width="64" height="64" loading="lazy" />
      </span>
    );
  }
  return <img className={className} src={asset(src)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" sizes={sizes}
    onError={() => setFailed(true)} {...rest} />;
}

export function Rating({ value, count, size = 14 }) {
  const { t } = useI18n();
  if (!value) return null;
  return (
    <span className="rating" role="img" aria-label={t('product.ratingLabel', { v: value })}>
      <Icon name="star" size={size} fill /> <b>{Number(value).toFixed(1)}</b>
      {count ? <i>({count})</i> : null}
    </span>
  );
}

/* ───────── Flags (inline SVG: emoji flags don't render on Windows) ───────── */
export const FlagIQ = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="fc-iq"><circle cx="12" cy="12" r="12" /></clipPath></defs>
    <g clipPath="url(#fc-iq)"><rect width="24" height="8" fill="#CE1126" /><rect y="8" width="24" height="8" fill="#fff" /><rect y="16" width="24" height="8" fill="#000" />
      <path d="M6.5 12.2h11" stroke="#007A3D" strokeWidth="2.2" strokeLinecap="round" /></g></svg>
);
export const FlagGB = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="fc-gb"><circle cx="12" cy="12" r="12" /></clipPath></defs>
    <g clipPath="url(#fc-gb)"><rect width="24" height="24" fill="#012169" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="4.5" /><path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" /><path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth="4" /></g></svg>
);

/* ───────── Language switch (capsule with sliding thumb) ───────── */
export function LangSwitch({ compact = false }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`switch-capsule lang-switch ${compact ? 'compact' : ''}`} role="radiogroup" aria-label={t('common.language')} data-active={lang}>
      <span className="switch-thumb" aria-hidden="true" />
      {[['ar', 'AR', FlagIQ, 'العربية — العراق'], ['en', 'EN', FlagGB, 'English — United Kingdom']].map(([code, abbr, Flag, name]) => (
        <button key={code} type="button" role="radio" aria-checked={lang === code} aria-label={name} title={name} lang={code}
          onClick={() => setLang(code)} className={lang === code ? 'on' : ''}>
          <span className="flag"><Flag /></span><span className="abbr">{abbr}</span>
        </button>
      ))}
    </div>
  );
}

/* ───────── Theme switch (System / Light / Dark) ───────── */
export function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  const opts = [['system', 'monitor'], ['light', 'sun'], ['dark', 'moon']];
  const onKey = (e) => {
    const i = opts.findIndex(([m]) => m === mode);
    const dir = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (document.dir === 'rtl' ? -1 : 1);
    if (!dir) return;
    e.preventDefault();
    setMode(opts[(i + dir + 3) % 3][0]);
  };
  return (
    <div className="switch-capsule theme-switch" role="radiogroup" aria-label={t('common.theme')} data-active={mode} onKeyDown={onKey}>
      <span className="switch-thumb" aria-hidden="true" />
      {opts.map(([m, icon]) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={mode === m ? 0 : -1}
          aria-label={t(`theme.${m}`)} title={t(`theme.${m}`)} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
          <Icon name={icon} size={16} />
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor, required }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>}
      {children}
      {error ? <small className="field-error" role="alert">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null}
    </div>
  );
}
