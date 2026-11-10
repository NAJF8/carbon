/** Product → cart animation. Clones the product image and flies it to the cart button. Skipped for reduced motion. */
export function flyToCart(fromEl) {
  if (!fromEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = [...document.querySelectorAll('[data-cart-target]')].find((el) => el.offsetParent !== null);
  if (!target) return;
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(72, Math.max(a.width, 40));
  const ghost = document.createElement('div');
  ghost.className = 'fly-ghost';
  ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;inset-block-start:0;inset-inline-start:0;left:${a.left + a.width / 2 - size / 2}px;top:${a.top + a.height / 2 - size / 2}px;width:${size}px;height:${size}px;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgb(0 0 0/.35);background:var(--surface-2)`;
  const img = fromEl.tagName === 'IMG' ? fromEl : fromEl.querySelector('img');
  if (img) { const c = img.cloneNode(); c.style.cssText = 'width:100%;height:100%;object-fit:cover'; ghost.appendChild(c); }
  else ghost.style.background = 'var(--primary)';
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 60}px) scale(.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: 0.2 },
    ],
    { duration: 650, easing: 'cubic-bezier(.5,0,.2,1)' },
  );
  const done = () => {
    ghost.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
  };
  anim.onfinish = done; anim.oncancel = done;
}
