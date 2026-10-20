/* The native account portal has no public account identity. Mark only the menu
 * opened by settings.launcher; do not infer identity from shortcuts or labels.
 * Native anchoring, focus, settings/feedback/logout commands remain untouched. */
function installAccountMenu() {
  let frame = 0;
  let release = () => {};
  const enabled = () => document.documentElement.hasAttribute('data-dsh-furina')
    && document.documentElement.getAttribute('data-dsh-furina-layout') === 'on';
  const opened = (event) => {
    if (!(event.target instanceof Element) || !enabled()) return;
    if (event.type === 'keydown' && !['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const trigger = event.target.closest('[data-slot="settings.launcher"] button[aria-haspopup="menu"]');
    if (!trigger) return;
    const previous = new Set(document.querySelectorAll('body > [role="menu"]'));
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!trigger.isConnected || trigger.getAttribute('aria-expanded') !== 'true') return;
      const menus = [...document.querySelectorAll('body > [role="menu"]')];
      const menu = menus.find(item => !previous.has(item)) || (menus.length === 1 ? menus[0] : null);
      if (!menu) return;
      release();
      menu.setAttribute('data-fh-account-menu', '');
      const measure = () => {
        // offsetWidth excludes the trigger's press/release scale transform.
        const width = trigger.getAttribute('data-collapsed') === 'true' ? 260 : trigger.offsetWidth;
        if (width > 0) menu.style.setProperty('--fh-account-width', width + 'px');
      };
      measure();
      const resize = new ResizeObserver(measure);
      resize.observe(trigger);
      const removal = new MutationObserver(() => { if (!menu.isConnected || !trigger.isConnected) release(); });
      removal.observe(document.body, {childList:true, subtree:true});
      release = () => {
        resize.disconnect();
        removal.disconnect();
        menu.removeAttribute('data-fh-account-menu');
        menu.style.removeProperty('--fh-account-width');
        release = () => {};
      };
    });
  };
  document.addEventListener('click', opened, true);
  document.addEventListener('keydown', opened, true);
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('click', opened, true);
    document.removeEventListener('keydown', opened, true);
    release();
  };
}
