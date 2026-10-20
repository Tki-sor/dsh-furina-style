/** Independent model/effort faces over the host's per-session directory.
 * No copied model catalog, command parsing, React DOM surgery, or provider ids.
 * Injected by build.mjs inside the client factory (React/h are optional there).
 */
function FurinaModelControls(props) {
  const directory = props.directory;
  if (!directory || typeof directory.store?.subscribe !== 'function' || typeof directory.store?.getSnapshot !== 'function' || typeof directory.load !== 'function' || typeof directory.select !== 'function') return null;
  return h(FurinaReadyModelControls, props);
}

function FurinaReadyModelControls({ directory, available }) {
  const state = React.useSyncExternalStore(
    React.useCallback((notify) => directory.store.subscribe(notify), [directory]),
    React.useCallback(() => directory.store.getSnapshot(), [directory])
  );
  const [pane, setPane] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [failure, setFailure] = React.useState('');
  const [draftIndex, setDraftIndex] = React.useState(null);
  const [moreModels, setMoreModels] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [locked, setLocked] = React.useState(true);
  const [position, setPosition] = React.useState({ visibility: 'hidden' });
  const anchor = React.useRef(null);
  const dialog = React.useRef(null);
  const owner = React.useRef(null);
  const mounted = React.useRef(true);
  const id = React.useId();
  const groups = Array.isArray(state.groups) ? state.groups : [];
  const choices = groups.flatMap((group) => group.models.map((model) => ({ group, model })));
  const current = choices.find(({ group, model }) => group.id === state.current?.provider && model.id === state.current?.model);
  const reasoning = current?.model.reasoning;
  const effort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
  const levels = reasoning === undefined ? [] : [
    ...(reasoning.defaultEffort === undefined ? [{ id: undefined, name: 'Default' }] : []),
    ...reasoning.efforts,
  ];
  const advertisedIndex = levels.findIndex((level) => level.id === effort);
  const index = Math.max(0, advertisedIndex);
  const shownIndex = draftIndex === null ? index : Math.min(draftIndex, levels.length - 1);
  const effortLabel = draftIndex === null && advertisedIndex < 0
    ? state.retainedEffort ?? effort ?? 'Default'
    : levels[shownIndex]?.name ?? state.retainedEffort;
  const busy = state.pending !== null;
  const ready = enabled && available && choices.length > 0;

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  React.useEffect(() => {
    if (!available) return;
    directory.load().catch((error) => { if (mounted.current) setFailure(String(error.message ?? error)); });
  }, [directory, available]);
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const sync = () => setEnabled(root.hasAttribute('data-dsh-furina') && root.getAttribute('data-dsh-furina-layout') === 'on' && root.getAttribute('data-dsh-furina-composer') === 'framed');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-dsh-furina', 'data-dsh-furina-layout', 'data-dsh-furina-composer'] });
    return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    if (!ready || anchor.current === null) return;
    const card = anchor.current.closest('[data-composer-card]');
    if (card === null) return;
    const sync = () => {
      const native = card.querySelector('[data-slot="conversation.input.model"] button');
      setLocked(native === null || native.disabled);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(card, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });
    return () => observer.disconnect();
  }, [ready]);
  const close = (restore = true) => {
    setPane(null);
    if (restore) owner.current?.focus();
  };
  React.useEffect(() => {
    if (!ready || locked) setPane(null);
  }, [ready, locked]);
  React.useEffect(() => {
    setDraftIndex(null);
    if (pane === 'effort' && levels.length === 0) setPane(null);
  }, [pane, state.current?.provider, state.current?.model, levels.length]);
  React.useLayoutEffect(() => {
    if (pane === null || dialog.current === null || owner.current === null) return;
    const place = () => {
      const rect = owner.current.getBoundingClientRect();
      const box = dialog.current?.getBoundingClientRect();
      if (!box) return;
      const above = rect.top - 6;
      const roomAbove = Math.max(0, above - 8);
      const below = rect.bottom + 6;
      const roomBelow = Math.max(0, window.innerHeight - below - 8);
      const up = roomAbove >= Math.min(box.height, 200) || roomAbove >= roomBelow;
      const height = Math.min(box.height, up ? roomAbove : roomBelow);
      const left = Math.max(8, Math.min(rect.right - box.width, window.innerWidth - box.width - 8));
      const top = up ? Math.max(8, above - height) : below;
      const submenu = dialog.current.querySelector('.fh-model-submenu');
      const submenuWidth = submenu?.offsetWidth ?? 288;
      const submenuHeight = Math.min(submenu?.offsetHeight ?? 0, window.innerHeight - 16);
      const submenuLeft = left < submenuWidth + 12 && window.innerWidth - left - box.width > left;
      const submenuX = submenuLeft ? left + box.width + 4 : left - submenuWidth - 4;
      setPosition({ left, top, maxHeight: Math.max(40, up ? roomAbove : roomBelow), '--fh-submenu-x': Math.max(8, Math.min(submenuX, window.innerWidth - submenuWidth - 8)) + 'px', '--fh-submenu-y': Math.max(8, Math.min(top + height - submenuHeight, window.innerHeight - submenuHeight - 8)) + 'px', visibility: 'visible' });
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(dialog.current);
    const outside = (event) => {
      if (!anchor.current?.contains(event.target) && !dialog.current?.contains(event.target)) close(false);
    };
    const scroll = (event) => { if (!dialog.current?.contains(event.target)) place(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', scroll, true);
    return () => {
      resize.disconnect();
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [pane, moreModels]);
  React.useLayoutEffect(() => {
    if (pane === null || position.visibility !== 'visible' || dialog.current === null) return;
    const focus = dialog.current.querySelector('input:not(:disabled)') || dialog.current.querySelector('button:not(:disabled)');
    focus?.focus();
  }, [pane, position.visibility]);
  const open = (kind, event) => {
    owner.current = event.currentTarget;
    setPosition({ visibility: 'hidden' });
    setQuery('');
    setMoreModels(false);
    setDragging(false);
    setFailure('');
    setPane((previous) => previous === kind ? null : kind);
  };
  const pick = async (selection, dismiss) => {
    if (locked || busy) return;
    setFailure('');
    try {
      const result = await directory.select(selection);
      if (!mounted.current) return;
      if (result?.ok !== true) { setFailure(result?.error?.message ?? '选择未生效，请重试'); return; }
      if (dismiss) close();
    } catch (error) {
      if (mounted.current) setFailure(String(error.message ?? error));
    }
  };
  const commitEffort = (event) => {
    if (draftIndex === null) return;
    const level = levels[Number(event.currentTarget.value)];
    if (level === undefined || state.current === null || level.id === effort) { setDraftIndex(null); return; }
    pick({ provider: state.current.provider, model: state.current.model, ...(level.id === undefined ? {} : { reasoningEffort: level.id }) }, false).finally(() => { if (mounted.current) setDraftIndex(null); });
  };
  const keyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    const controls = [...dialog.current.querySelectorAll('input:not(:disabled),button:not(:disabled)')]
      .filter((element) => element.getClientRects().length > 0);
    const at = controls.indexOf(document.activeElement);
    if (event.key === 'Tab') {
      if (controls.length === 0) return;
      if (event.shiftKey && at <= 0) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && at === controls.length - 1) { event.preventDefault(); controls[0].focus(); }
    } else if (pane === 'model' && event.key === 'ArrowRight' && document.activeElement?.classList.contains('fh-model-more')) {
      event.preventDefault();
      setMoreModels(true);
    } else if (pane === 'model' && event.key === 'ArrowLeft' && moreModels) {
      event.preventDefault();
      setMoreModels(false);
      dialog.current.querySelector('.fh-model-more')?.focus();
    } else if (pane === 'model' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      controls[(at + (event.key === 'ArrowDown' ? 1 : controls.length - 1)) % controls.length]?.focus();
    }
  };
  if (!ready) return null;
  const error = failure || state.error;
  // The reference's first-level menu is a short provider list plus the active
  // model; other host groups live in the adjoining More models surface.
  const primary = groups.find((group) => group.models.length > 0);
  const remaining = groups.filter((group) => group !== primary && group.models.length > 0);
  const searching = query.trim() !== '';
  const matches = (model) => model.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const check = (selected) => h('svg', { className: 'fh-model-check', viewBox: '0 0 16 16', 'aria-hidden': true, 'data-selected': selected ? '' : undefined }, h('path', { d: 'm3 8 3 3 7-7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }));
  const option = (group, model, submenu = false) => {
    const selected = state.current?.provider === group.id && state.current?.model === model.id;
    return h('button', { key: model.id, type: 'button', className: 'fh-model-option', disabled: locked || busy, 'aria-pressed': selected,
      onClick: () => pick({ provider: group.id, model: model.id, ...(selected && state.current.reasoningEffort !== undefined ? { reasoningEffort: state.current.reasoningEffort } : model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort }) }, true),
    }, h('span', { className: 'fh-model-copy' },
      h('span', { className: 'fh-model-name' }, model.name),
      !submenu && typeof model.description === 'string' && model.description ? h('span', { className: 'fh-model-desc' }, model.description) : null
    ), check(selected));
  };
  const section = (group, models, submenu = false) => h('section', { key: group.id, className: 'fh-model-group' },
    h('div', { className: submenu ? 'fh-model-group-row' : 'fh-model-rule' }, h('span', { className: 'fh-model-group-label' }, group.name)),
    ...[...models].sort((a,b)=>a.id.localeCompare(b.id)).map((model) => option(group, model, submenu))
  );
  const popup = pane === null ? null : h('div', {
    ref: dialog, id, role: 'dialog', 'aria-label': pane === 'model' ? '选择模型' : '推理强度',
    'aria-busy': busy, className: 'fh-control-popover', 'data-pane': pane, 'data-searching': searching ? '' : undefined, 'data-more': moreModels && !searching ? '' : undefined,
    style: position, onKeyDown: keyDown,
  },
    error ? h('div', { role: 'alert', className: 'fh-control-error' }, String(error)) : null,
    pane === 'model' ? h(React.Fragment, null,
      // Keep type-to-filter and its focus/keyboard contract without adding a
      // permanent search/dialog header absent from the installed reference.
      h('input', { type: 'search', className: 'fh-model-search', placeholder: '输入以搜索模型', 'aria-label': '搜索模型', value: query, onChange: (event) => setQuery(event.target.value) }),
      h('div', { className: 'fh-model-body' },
        ...(searching ? groups : primary ? [primary] : []).map((group) => {
          const models = group.models.filter(matches);
          return models.length > 0 ? section(group, models) : null;
        }),
        !searching && current && current.group !== primary ? section(current.group, [current.model]) : null,
        searching && !choices.some(({ model }) => matches(model)) ? h('p', { className: 'fh-model-empty' }, '没有匹配的模型') : null
      ),
      !searching && remaining.length > 0 ? h('div', { className: 'fh-model-footer' },
        h('div', { className: 'fh-model-divider' }),
        h('button', { type: 'button', className: 'fh-model-more', 'aria-expanded': moreModels, 'aria-controls': moreModels ? id + '-more' : undefined, disabled: locked || busy,
          onClick: () => setMoreModels((previous) => window.innerWidth <= 620 ? !previous : true), onMouseEnter: () => { if (window.innerWidth > 620) setMoreModels(true); },
        }, h('span', null, '更多模型'), h('svg', { viewBox: '0 0 16 16', 'aria-hidden': true }, h('path', { d: 'm6 4 4 4-4 4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 })))
      ) : null,
      moreModels && !searching ? h('div', { id: id + '-more', className: 'fh-model-submenu', 'aria-label': '更多模型' },
        ...remaining.map((group) => section(group, group.models, true))
      ) : null
    ) : h('div', { className: 'fh-effort', 'data-dragging': dragging ? '' : undefined, 'data-apex': levels.length > 1 && shownIndex === levels.length - 1 ? '' : undefined,
        style: { '--fh-effort-progress': levels.length < 2 ? 1 : shownIndex / (levels.length - 1) },
      },
      h('div', { className: 'fh-effort-head' }, h('span', { className: 'fh-effort-label' }, '推理强度'), h('span', { className: 'fh-effort-value', key: effortLabel }, effortLabel)),
      advertisedIndex < 0 && effort !== undefined ? h('p', { className: 'fh-effort-note' }, '当前强度未列入可选档位；调整滑条将选择新档位。') : null,
      h('div', { className: 'fh-effort-ends', 'aria-hidden': true }, h('span', null, '更快'), h('span', null, '更智能')),
      h('div', { className: 'fh-effort-track', 'data-disabled': locked || busy || levels.length < 2 ? '' : undefined },
        h('div', { className: 'fh-effort-fill', 'aria-hidden': true }),
        h('div', { className: 'fh-effort-ticks', 'aria-hidden': true }, ...levels.map((level, at) => h('span', { key: at, className: 'fh-effort-tick', style: { '--fh-effort-tick': levels.length < 2 ? 1 : at / (levels.length - 1) } }))),
        h('div', { className: 'fh-effort-matrix', 'aria-hidden': true }, ...Array.from({ length: 320 }, (_, at) => h('span', { key: at, style: { '--fh-effort-flash-delay': (at * 37 % 29) * -0.14 + 's', '--fh-effort-tone': (at * 7 % 8 + 1) / 8 } }))),
        h('div', { className: 'fh-effort-knob', 'aria-hidden': true }),
        // Native semantics only: all visible rail/ticks/fill/knob are custom DOM.
        // Preview on input; retain the host's single release/keyup/blur commit.
        h('input', { type: 'range', className: 'fh-effort-range', min: 0, max: Math.max(0, levels.length - 1), step: 1, value: shownIndex, disabled: locked || busy || levels.length < 2,
          'aria-label': '推理强度', 'aria-valuetext': effortLabel,
          onChange: (event) => setDraftIndex(Number(event.target.value)),
          onPointerDown: (event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); },
          onPointerUp: (event) => { setDragging(false); commitEffort(event); },
          onPointerCancel: () => { setDragging(false); setDraftIndex(null); },
          onLostPointerCapture: () => setDragging(false), onKeyUp: commitEffort, onBlur: commitEffort,
        })
      )
    )
  );
  return h('div', { ref: anchor, className: 'fh-model-controls', 'data-ready': '', 'aria-busy': busy },
    h('button', { type: 'button', className: 'fh-model-button', disabled: locked || busy, title: current?.model.name ?? '选择模型', 'aria-label': '选择模型：' + (current?.model.name ?? '未选择'), 'aria-haspopup': 'dialog', 'aria-expanded': pane === 'model', 'aria-controls': pane === 'model' ? id : undefined, onClick: (event) => open('model', event) }, h('span', { className: 'fh-model-label' }, current?.model.name ?? '选择模型')),
    levels.length > 0 ? h('button', { type: 'button', className: 'fh-effort-button', disabled: locked || busy, 'aria-label': '推理强度：' + effortLabel, 'aria-haspopup': 'dialog', 'aria-expanded': pane === 'effort', 'aria-controls': pane === 'effort' ? id : undefined, onClick: (event) => open('effort', event) }, h('span', { className: 'fh-model-label' }, effortLabel)) : null,
    popup === null ? null : ReactDOM.createPortal(popup, document.body)
  );
}

function installPermissionMarker() {
  let frame = 0;
  const mark = (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    const trigger = event.target.closest('[data-slot="conversation.input.permission"] button');
    if (trigger === null) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      const label = trigger.querySelector('[class*="_triggerLabel"]')?.textContent?.trim();
      if (!label) return;
      for (const menu of document.querySelectorAll('[role="menu"]')) {
        const selected = menu.querySelector('button[class*="_selected"]')?.cloneNode(true);
        selected?.querySelectorAll('.dlU_AG_badge').forEach((badge) => badge.remove());
        if (selected?.textContent?.trim() === label) menu.setAttribute('data-fh-permission-menu', '');
      }
    });
  };
  document.addEventListener('click', mark, true);
  document.addEventListener('keydown', mark, true);
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('click', mark, true);
    document.removeEventListener('keydown', mark, true);
    for (const menu of document.querySelectorAll('[data-fh-permission-menu]')) menu.removeAttribute('data-fh-permission-menu');
  };
}

function installComposerControls(ctx) {
  if (typeof ctx?.effect === 'function') ctx.effect(installPermissionMarker, 'furina: permission surface marker');
  if (h === null || ReactDOM === null || typeof ReactDOM.createPortal !== 'function' || typeof ctx?.inject !== 'function') return;
  ctx.inject(['slots', 'modelDirectories', 'sessions'], (scope) => {
    scope.slots.inject('conversation.input.right', () => scope.slots.register({
      name: 'conversation.input.right', id: 'furina-model-controls', order: 900,
      inject: (sessionId) => {
        try { return { directory: scope.modelDirectories.directoryFor(sessionId), available: scope.sessions.subagentAddress(sessionId) === undefined }; }
        catch (error) { return { directory: null, available: false }; }
      },
    }, FurinaModelControls));
  });
}
