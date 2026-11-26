/* RIVALSNOTEBOOK v13.33 Playbook interaction upgrades. */
(() => {
  'use strict';
  if (window.__rnV1333PlaybookUpgradesLoaded) return;
  window.__rnV1333PlaybookUpgradesLoaded = true;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const getItems = () => window.__rnGetBoardItems?.() || [];
  const selectedIds = () => [...document.querySelectorAll('#playBoardStage > .board-item.selected[data-board-item]')]
    .map(element => String(element.dataset.boardItem));
  const saveBoard = () => {
    try { window.persist?.(); } catch (error) { console.warn('Playbook save failed:', error); }
  };
  const rgba = (hex, alpha) => {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!match) return `rgba(80,80,80,${clamp(alpha, 0, 1)})`;
    const value = parseInt(match[1], 16);
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${clamp(alpha, 0, 1)})`;
  };
  const toast = message => {
    if (typeof window.toast === 'function') window.toast(message);
    else console.info(message);
  };

  function findCenteredPair(stage) {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const cardWidth = clamp(width * 0.09, 76, 96);
    const cardHeight = clamp(height * 0.18, 88, 112);
    const gap = 14;
    const margin = 14;
    const pairWidth = cardWidth * 2 + gap;
    if (pairWidth + margin * 2 > width || cardHeight + margin * 2 > height) return null;

    const occupied = [...stage.querySelectorAll(':scope > .board-item[data-board-item]')].map(element => {
      const left = Number(element.offsetLeft) || 0;
      const top = Number(element.offsetTop) || 0;
      const right = left + Math.max(1, Number(element.offsetWidth) || 1);
      const bottom = top + Math.max(1, Number(element.offsetHeight) || 1);
      return {left: left - 9, top: top - 9, right: right + 9, bottom: bottom + 9};
    });

    const candidates = [];
    const step = 22;
    for (let top = margin; top <= height - cardHeight - margin; top += step) {
      for (let left = margin; left <= width - pairWidth - margin; left += step) {
        const pair = [
          {left, top, right: left + cardWidth, bottom: top + cardHeight},
          {left: left + cardWidth + gap, top, right: left + pairWidth, bottom: top + cardHeight}
        ];
        const collision = pair.some(box => occupied.some(area =>
          box.left < area.right && box.right > area.left && box.top < area.bottom && box.bottom > area.top
        ));
        if (collision) continue;
        const centerX = left + pairWidth / 2;
        const centerY = top + cardHeight / 2;
        const distance = Math.hypot(centerX - width / 2, centerY - height / 2);
        candidates.push({left, top, distance});
      }
    }
    candidates.sort((a, b) => a.distance - b.distance || a.top - b.top || a.left - b.left);
    const best = candidates[0];
    if (!best) return null;
    return [
      {x: best.left / width * 100, y: best.top / height * 100},
      {x: (best.left + cardWidth + gap) / width * 100, y: best.top / height * 100}
    ];
  }

  window.__rnAddPocketPairCentered = button => {
    const heroA = String(button?.dataset?.a || '').trim();
    const heroB = String(button?.dataset?.b || '').trim();
    if (!heroA || !heroB) {
      toast('This Pocket Strat does not contain a complete hero pair.');
      return;
    }
    window.switchPage?.('playbookPage');
    requestAnimationFrame(() => {
      const stage = document.getElementById('playBoardStage');
      const items = getItems();
      const positions = stage && findCenteredPair(stage);
      if (!positions) {
        toast('There is no free space for both heroes near the board centre. Move or remove an object first.');
        return;
      }
      const makeId = () => `board-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const firstId = makeId();
      const secondId = makeId();
      items.push(
        {id: firstId, type: 'hero', heroName: heroA, side: 'ally', x: positions[0].x, y: positions[0].y, w: 9, h: 15, rotate: 0, scale: 1, layoutRole: 'pocket-hero'},
        {id: secondId, type: 'hero', heroName: heroB, side: 'ally', x: positions[1].x, y: positions[1].y, w: 9, h: 15, rotate: 0, scale: 1, layoutRole: 'pocket-hero'}
      );
      window.__rnSetBoardSelection?.([firstId, secondId]);
      window.__rnRenderBoard?.();
      saveBoard();
      toast(`Added ${heroA} and ${heroB} together at the centre of the current Playbook.`);
    });
  };

  if (window.__rnPendingPocketPairButton) {
    const queued = window.__rnPendingPocketPairButton;
    window.__rnPendingPocketPairButton = null;
    window.__rnAddPocketPairCentered(queued);
  }

  function setTextFillOpacity(value, updateSelected = true) {
    const opacity = clamp(value, 0, 100) / 100;
    localStorage.setItem('rnPlaybookTextFillOpacity', String(opacity));
    const input = document.getElementById('rnTextBoxFillOpacity');
    const output = document.getElementById('rnTextBoxFillOpacityValue');
    if (input) input.value = String(Math.round(opacity * 100));
    if (output) output.textContent = `${Math.round(opacity * 100)}%`;
    if (!updateSelected) return;

    const ids = new Set(selectedIds());
    let changed = false;
    getItems().forEach(item => {
      if (item.type === 'text' && ids.has(String(item.id))) {
        item.fillOpacity = opacity;
        changed = true;
      }
    });
    const active = window.__rnActiveTextItem;
    const editor = window.__rnActiveTextEditor;
    const editingActiveText = active?.type === 'text' && editor?.isConnected;
    if (active?.type === 'text') {
      active.fillOpacity = opacity;
      if (editingActiveText && !active.noFill) editor.style.backgroundColor = rgba(active.fillColor, opacity);
      changed = true;
    }
    if (changed) {
      // Keep a live textarea mounted while its fill opacity is adjusted.
      if (!editingActiveText) window.__rnRenderBoard?.();
      saveBoard();
    }
  }

  function installShapePalette() {
    const palette = document.querySelector('#playbookPage .board-shape-tools');
    if (!palette) return;
    ['area', 'cone', 'triangle-down'].forEach(kind => {
      palette.querySelectorAll('.rn-shape-tool').forEach(button => {
        if (button.dataset.shapeKind === kind) button.remove();
      });
    });
    palette.querySelectorAll('.rn-shape-tool').forEach(button => {
      const label = `${button.title || ''} ${button.getAttribute('aria-label') || ''}`.toLowerCase();
      if (/area\s*\/\s*zone|cone\s*\/\s*direction|triangle\s*marker/.test(label)) button.remove();
    });
    const find = (kind, title) => [...palette.querySelectorAll('.rn-shape-tool')].find(button =>
      (kind && button.dataset.shapeKind === kind) || (title && (button.title === title || button.getAttribute('aria-label') === title))
    );
    const order = [
      find('circle'), find('rectangle'), find('triangle'), find('diamond'), find('star'),
      find('warning'), find('flag'), find('anchor'), find('target'), find('pin'),
      find('line'), find(null, 'Wall'), find(null, 'Number marker'), find(null, 'Arrow')
    ].filter(Boolean);
    order.forEach(button => palette.appendChild(button));
    palette.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))';
    palette.style.gridAutoFlow = 'row';
  }

  function installTextFillOpacity() {
    const panel = document.getElementById('rnToolSettings');
    const fontControl = document.getElementById('rnTextFontSizeControl');
    const styleControls = document.getElementById('rnTextStyleControls');
    if (!panel || !fontControl || !styleControls || document.getElementById('rnTextBoxFillOpacityControl')) return;
    const row = document.createElement('div');
    row.className = 'rn-setting-row rn-opacity-row';
    row.id = 'rnTextBoxFillOpacityControl';
    row.innerHTML = '<span class="rn-setting-label">FILL OPACITY</span><output id="rnTextBoxFillOpacityValue">94%</output><input id="rnTextBoxFillOpacity" type="range" min="0" max="100" step="1" value="94" aria-label="Text box fill opacity">';
    fontControl.parentNode.insertBefore(row, fontControl);
    const initial = clamp(Number(localStorage.getItem('rnPlaybookTextFillOpacity') ?? 0.94) * 100, 0, 100);
    setTextFillOpacity(initial, false);
    row.querySelector('input').addEventListener('input', event => setTextFillOpacity(event.target.value, true));

    const originalGet = window.__rnGetTextStyleDefaults;
    window.__rnGetTextStyleDefaults = () => ({
      ...(typeof originalGet === 'function' ? originalGet() : {}),
      fillOpacity: clamp(Number(localStorage.getItem('rnPlaybookTextFillOpacity') ?? 0.94), 0, 1)
    });
    const originalSet = window.__rnSetTextStyleDefault;
    window.__rnSetTextStyleDefault = (key, value) => {
      if (key === 'fillOpacity') {
        localStorage.setItem('rnPlaybookTextFillOpacity', String(clamp(value, 0, 1)));
        return;
      }
      return originalSet?.(key, value);
    };

    const originalSync = window.__rnSyncToolSettingsVisibility;
    if (typeof originalSync === 'function') {
      window.__rnSyncToolSettingsVisibility = function (...args) {
        const result = originalSync.apply(this, args);
        const textSelected = selectedIds().some(id => getItems().some(item => item.type === 'text' && String(item.id) === id));
        row.hidden = !(window.__rnGetBoardTool?.() === 'text' || textSelected);
        return result;
      };
    }
    row.hidden = window.__rnGetBoardTool?.() !== 'text';

    const defaultsButton = document.getElementById('rnToolDefaultsBtn');
    defaultsButton?.addEventListener('click', () => {
      // The main DEFAULTS handler runs first. Reset only the stored default here;
      // existing text boxes keep their own saved fill opacity.
      localStorage.setItem('rnPlaybookTextFillOpacity', '0.94');
      setTextFillOpacity(94, false);
    });
  }

  function installThicknessPercentage() {
    const oldInput = document.getElementById('boardPenThickness');
    const output = document.getElementById('boardPenThicknessValue');
    if (!oldInput || !output || oldInput.dataset.rnPercentage === '1') return;

    const originalSetter = window.__rnSetBoardPenThickness;
    if (typeof originalSetter !== 'function') return;
    const input = oldInput.cloneNode(true);
    input.min = '1';
    input.max = '100';
    input.step = '1';
    input.setAttribute('aria-label', 'Thickness percentage');
    input.dataset.rnPercentage = '1';
    oldInput.replaceWith(input);

    const currentPhysical = clamp(
      Number(localStorage.getItem('mrPlaybookPenThicknessV2') ?? localStorage.getItem('rnPlaybookShapeBorderWidth') ?? 4.8),
      0.05, 12
    );
    const physicalToPercent = value => Math.round(clamp(value, 0.05, 12) / 12 * 100);
    const percentToPhysical = value => clamp(value, 1, 100) / 100 * 12;

    const setPhysical = value => {
      const physical = clamp(value, 0.05, 12);
      originalSetter(physical);
      const percent = physicalToPercent(physical);
      input.value = String(percent);
      output.textContent = `${percent}%`;
      return physical;
    };
    window.__rnSetBoardPenThickness = setPhysical;

    input.value = String(physicalToPercent(currentPhysical));
    output.textContent = `${input.value}%`;
    input.addEventListener('input', () => {
      const physical = percentToPhysical(input.value);
      setPhysical(physical);
      const ids = new Set(selectedIds());
      let changed = false;
      getItems().forEach(item => {
        if (!ids.has(String(item.id))) return;
        if (item.type === 'pen') { item.penWidth = physical; changed = true; }
        else if (['shape', 'arrow', 'wall', 'broken'].includes(item.type)) { item.borderWidth = physical; changed = true; }
      });
      if (changed) {
        window.__rnRenderBoard?.();
        saveBoard();
      }
    });

    const originalSync = window.__rnSyncToolSettingsVisibility;
    if (typeof originalSync === 'function') {
      window.__rnSyncToolSettingsVisibility = function (...args) {
        const result = originalSync.apply(this, args);
        const ids = new Set(selectedIds());
        const stroke = getItems().find(item => ids.has(String(item.id)) && ['shape', 'pen', 'arrow', 'wall', 'broken'].includes(item.type));
        const physical = stroke
          ? (stroke.type === 'pen' ? Number(stroke.penWidth) : Number(stroke.borderWidth))
          : Number(localStorage.getItem('mrPlaybookPenThicknessV2')) || 4.8;
        const percent = physicalToPercent(physical || 4.8);
        input.value = String(percent);
        output.textContent = `${percent}%`;
        return result;
      };
    }
    setPhysical(currentPhysical);

    const defaultsButton = document.getElementById('rnToolDefaultsBtn');
    defaultsButton?.addEventListener('click', () => {
      // The original DEFAULTS action runs before this listener.
      setPhysical(4.8);
    });
  }

  function installDefaultMigrations() {
    const fillMigration = 'rnV1333ShapeFillDefaultMigration';
    if (localStorage.getItem(fillMigration) !== '1') {
      localStorage.setItem('rnPlaybookFillOpacity', '0');
      localStorage.setItem(fillMigration, '1');
      const input = document.getElementById('rnToolFillOpacity');
      if (input) {
        const selection = selectedIds();
        window.__rnSetBoardSelection?.([]);
        input.value = '0';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        window.__rnSetBoardSelection?.(selection);
      } else {
        window.__rnSetBoardShapeDefaults?.({fillOpacity: 0});
      }
    }

    const thicknessMigration = 'rnV1333ThicknessDefaultMigration';
    if (localStorage.getItem(thicknessMigration) !== '1') {
      const prior = Number(localStorage.getItem('mrPlaybookPenThicknessV2'));
      if (!Number.isFinite(prior) || Math.abs(prior - 2.4) < 0.001) {
        localStorage.setItem('mrPlaybookPenThicknessV2', '4.8');
        localStorage.setItem('rnPlaybookShapeBorderWidth', '4.8');
      }
      localStorage.setItem(thicknessMigration, '1');
    }
  }

  function installSmallerShapeDefaults() {
    const small = {
      circle: [8, 12], rectangle: [9.5, 11.5], triangle: [9.5, 12],
      'triangle-down': [9.5, 12], diamond: [8, 12], star: [8, 12],
      line: [12, 3.5], pin: [8, 12], warning: [9, 12], flag: [8, 12],
      anchor: [8, 12], target: [9, 12], area: [12, 10], cone: [9, 12]
    };
    const legacy = {
      circle: [9, 14], rectangle: [11, 13], triangle: [11, 14],
      'triangle-down': [11, 14], diamond: [9, 14], star: [9, 14],
      line: [14, 4], pin: [9, 14], warning: [10, 14], flag: [9, 14],
      anchor: [9, 14], target: [10, 14], area: [14, 12], cone: [10, 14]
    };
    const originalNew = window.newBoardItem;
    if (typeof originalNew === 'function' && !originalNew.__rnV1333SmallerDefaults) {
      const wrapped = function (type, extra = {}) {
        const next = {...extra};
        if (type === 'shape') {
          const kind = String(next.shapeKind || 'rectangle');
          const dimensions = small[kind];
          if (dimensions) {
            const old = legacy[kind];
            const hasLegacySize = old && Number(next.w) === old[0] && Number(next.h) === old[1];
            if (next.w == null || next.h == null || hasLegacySize) {
              next.w = dimensions[0];
              next.h = dimensions[1];
            }
          }
        }
        if (type === 'text' && (next.fillOpacity == null || Math.abs(Number(next.fillOpacity) - 0.94) < 0.0001)) {
          next.fillOpacity = clamp(Number(localStorage.getItem('rnPlaybookTextFillOpacity') ?? 0.94), 0, 1);
        }
        return originalNew.call(this, type, next);
      };
      wrapped.__rnV1333SmallerDefaults = true;
      window.newBoardItem = wrapped;
    }
  }

  let activeNumberResizeId = null;
  function applyNumberScale(element, item) {
    if (!element || !item || item.type !== 'number') return;
    const scale = clamp(item.scale || 1, 0.25, 4);
    const size = 31 * scale;
    const fontSize = 15 * scale;
    element.style.setProperty('--rn-number-size', `${size}px`);
    element.style.setProperty('--rn-number-font-size', `${fontSize}px`);
    element.style.transform = `rotate(${Number(item.rotate) || 0}deg)`;
    element.style.transformOrigin = '50% 50%';
    element.style.overflow = 'visible';
  }

  function installNumberMarkerResize() {
    const originalRender = window.renderBoardItem;
    if (typeof originalRender === 'function' && !originalRender.__rnV1333NumberScale) {
      const wrapped = function (item, selected = false) {
        const element = originalRender.call(this, item, selected);
        if (item?.type === 'number') applyNumberScale(element, item);
        return element;
      };
      wrapped.__rnV1333NumberScale = true;
      window.renderBoardItem = wrapped;
    }

    const originalEdit = window.__rnEditBoardTextItem;
    if (typeof originalEdit === 'function' && !originalEdit.__rnV1333NumberEditScale) {
      const wrappedEdit = function (id) {
        if (activeNumberResizeId) return null;
        const item = getItems().find(candidate => String(candidate.id) === String(id));
        const editor = originalEdit.call(this, id);
        if (editor && item?.type === 'number') {
          const scale = clamp(item.scale || 1, 0.25, 4);
          const size = 31 * scale;
          editor.style.setProperty('--rn-number-size', `${size}px`);
          editor.style.setProperty('--rn-number-font-size', `${15 * scale}px`);
        }
        return editor;
      };
      wrappedEdit.__rnV1333NumberEditScale = true;
      window.__rnEditBoardTextItem = wrappedEdit;
    }

    const board = document.getElementById('playBoard');
    if (board && !board.dataset.rnNumberResizeScale) {
      board.dataset.rnNumberResizeScale = '1';
      window.addEventListener('pointerdown', event => {
        const target = event.target instanceof Element ? event.target : null;
        const handle = target?.closest('.resize-handle');
        const element = handle?.closest('.board-item[data-board-item]');
        const item = element && getItems().find(candidate => String(candidate.id) === String(element.dataset.boardItem));
        if (item?.type === 'number') activeNumberResizeId = String(item.id);
      }, true);
      window.addEventListener('pointermove', () => {
        if (!activeNumberResizeId) return;
        requestAnimationFrame(() => {
          const item = getItems().find(candidate => String(candidate.id) === activeNumberResizeId);
          const element = document.querySelector(`#playBoardStage > .board-item[data-board-item="${CSS.escape(activeNumberResizeId)}"]`);
          if (item && element) applyNumberScale(element, item);
        });
      }, true);
      const clearResize = () => requestAnimationFrame(() => { activeNumberResizeId = null; });
      window.addEventListener('pointerup', clearResize, true);
      window.addEventListener('pointercancel', clearResize, true);
    }

    // The board renderer is scoped inside the app's main inline script, so do not
    // rely on it being a window property. Observe redraws and apply marker scaling
    // to the newly-created DOM nodes after every render.
    const stage = document.getElementById('playBoardStage');
    if (stage && !stage.dataset.rnNumberScaleObserver) {
      stage.dataset.rnNumberScaleObserver = '1';
      const decorateStage = () => {
        const byId = new Map(getItems().filter(item => item.type === 'number').map(item => [String(item.id), item]));
        stage.querySelectorAll(':scope > .board-item.rn-number-compact[data-board-item]').forEach(element => {
          const item = byId.get(String(element.dataset.boardItem));
          if (item) applyNumberScale(element, item);
        });
        stage.querySelectorAll(':scope > .board-item.shape-pin').forEach(element => {
          const svg = element.querySelector('svg');
          if (svg && svg.dataset.rnPinShape !== '1') {
            svg.innerHTML = '<path class="shape-fill" d="M50 5C31.8 5 18 19.2 18 37.2c0 20.1 32 56.8 32 56.8s32-36.7 32-56.8C82 19.2 68.2 5 50 5Z"/><circle class="shape-line" cx="50" cy="36" r="11"/>';
            svg.dataset.rnPinShape = '1';
          }
        });
      };
      const observer = new MutationObserver(decorateStage);
      observer.observe(stage, {childList: true});
      decorateStage();
    }

    const style = document.createElement('style');
    style.id = 'rn-v1333-number-marker-resize-css';
    style.textContent = `
      body.playbook-mode #playBoardStage > .board-item.board-number.rn-number-compact{
        width:var(--rn-number-size,31px)!important;height:var(--rn-number-size,31px)!important;
        min-width:var(--rn-number-size,31px)!important;min-height:var(--rn-number-size,31px)!important;
        max-width:var(--rn-number-size,31px)!important;max-height:var(--rn-number-size,31px)!important;
        font-size:var(--rn-number-font-size,15px)!important;overflow:visible!important;
      }
      body.playbook-mode #playBoardStage > .inline-board-text-editor.rn-number-marker-editor{
        width:var(--rn-number-size,31px)!important;height:var(--rn-number-size,31px)!important;
        min-width:var(--rn-number-size,31px)!important;min-height:var(--rn-number-size,31px)!important;
        max-width:var(--rn-number-size,31px)!important;max-height:var(--rn-number-size,31px)!important;
        font-size:var(--rn-number-font-size,15px)!important;
      }
      body.playbook-mode #playBoardStage > .board-item.board-number.rn-number-compact .resize-handle{
        right:-7px!important;bottom:-7px!important;display:block!important;pointer-events:auto!important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyInitialShapeFillDefault() {
    const input = document.getElementById('rnToolFillOpacity');
    if (!input) return;
    const selection = selectedIds();
    window.__rnSetBoardSelection?.([]);
    input.value = String(Math.round(clamp(Number(localStorage.getItem('rnPlaybookFillOpacity') ?? 0), 0, 1) * 100));
    input.dispatchEvent(new Event('input', {bubbles: true}));
    window.__rnSetBoardSelection?.(selection);
  }

  function installDefaultsButtonPostReset() {
    const button = document.getElementById('rnToolDefaultsBtn');
    if (!button || button.dataset.rnV1333Defaults === '1') return;
    button.dataset.rnV1333Defaults = '1';
    button.addEventListener('click', () => {
      requestAnimationFrame(() => {
        const fill = document.getElementById('rnToolFillOpacity');
        const selection = selectedIds();
        window.__rnSetBoardSelection?.([]);
        if (fill) {
          fill.value = '0';
          fill.dispatchEvent(new Event('input', {bubbles: true}));
        } else {
          localStorage.setItem('rnPlaybookFillOpacity', '0');
          window.__rnSetBoardShapeDefaults?.({fillOpacity: 0});
        }
        window.__rnSetBoardSelection?.(selection);
        window.__rnSetBoardPenThickness?.(4.8);
        localStorage.setItem('rnPlaybookTextFillOpacity', '0.94');
        setTextFillOpacity(94, false);
      });
    });
  }

  function install() {
    document.title = 'RIVALSNOTEBOOK · v13.33';
    installDefaultMigrations();
    installShapePalette();
    installSmallerShapeDefaults();
    installTextFillOpacity();
    installThicknessPercentage();
    installNumberMarkerResize();
    applyInitialShapeFillDefault();
    installDefaultsButtonPostReset();
    window.__rnRenderBoard?.();
    window.__rnSyncToolSettingsVisibility?.();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once: true});
  else install();
})();