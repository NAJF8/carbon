import { useEffect, useRef, useState } from 'react';

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setM(e.matches);
    mq.addEventListener('change', on);
    setM(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveal-on-scroll. Elements with [data-reveal] fade/translate in once; children get a stagger index. */
export function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll('[data-reveal]');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Native <dialog> controller: showModal/close driven by `open`; restores focus to the trigger. */
export function useDialog(open, onClose) {
  const ref = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { trigger.current = document.activeElement; d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handleClose = () => { onClose?.(); trigger.current?.focus?.(); };
    d.addEventListener('close', handleClose);
    return () => d.removeEventListener('close', handleClose);
  }, [onClose]);
  return ref;
}
