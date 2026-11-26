/* RIVALSNOTEBOOK v13.34 Playbook interaction upgrades. */
(() => {
  'use strict';
  if (window.__rnV1334PlaybookUpgradesLoaded) return;
  window.__rnV1334PlaybookUpgradesLoaded = true;

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



  /* v13.34: correct pen units, reliable number-marker resize, and in-Playbook Pocket Strat viewing. */
  function installThicknessPercentageV1334() {
    const oldInput = document.getElementById('boardPenThickness');
    const output = document.getElementById('boardPenThicknessValue');
    if (!oldInput || !output || oldInput.dataset.rnPercentageV1334 === '1') return;

    const baseSetter = window.__rnSetBoardPenThickness;
    const PEN_MIN = 0.05;       // percent of the board width, matching the renderer's true minimum
    const PEN_MAX = 0.35;       // cap bold strokes at 3.5 px per 1000 px of board width
    const SHAPE_MIN = 0.05;     // pixels
    const SHAPE_MAX = 12;       // pixels
    const PEN_DEFAULT_PERCENT = 25; // about 1.2 px at a 1000 px board width
    const SHAPE_DEFAULT_PERCENT = 40;
    const penToPercent = value => Math.round((clamp(value, PEN_MIN, PEN_MAX) - PEN_MIN) / (PEN_MAX - PEN_MIN) * 99 + 1);
    const percentToPen = percent => PEN_MIN + (clamp(percent, 1, 100) - 1) / 99 * (PEN_MAX - PEN_MIN);
    const shapeToPercent = value => Math.round(clamp(value, SHAPE_MIN, SHAPE_MAX) / SHAPE_MAX * 100);
    const percentToShape = percent => clamp(percent, 1, 100) / 100 * SHAPE_MAX;
    const stageWidth = () => Math.max(1, document.getElementById('playBoardStage')?.clientWidth || 1000);
    const currentToolIsPen = () => String(window.__rnGetBoardTool?.() || '').startsWith('pen-');

    const migrationKey = 'rnV1334PenWidthRefinementMigration';
    let savedPen = Number(localStorage.getItem('rnPlaybookPenStrokeWidth'));
    if (localStorage.getItem(migrationKey) !== '1') {
      const previous = Number(localStorage.getItem('mrPlaybookPenThicknessV2'));
      const previousPatchDefault = 0.02 + (40 - 1) / 99 * (0.50 - 0.02);
      // Previous releases used either 4.8% of board width, or the first v13.34
      // conversion (40% of a 0.02-0.50% scale). Move those overly thick defaults
      // to a physical width of about 1.2 px per 1000 px of board width.
      if (!Number.isFinite(savedPen) || savedPen <= 0) {
        savedPen = Number.isFinite(previous) && previous > 0
          ? percentToPen(clamp((previous - 0.05) / (12 - 0.05) * 99 + 1, 1, 100))
          : percentToPen(PEN_DEFAULT_PERCENT);
      }
      const legacyDefault = (Number.isFinite(previous) && Math.abs(previous - 4.8) < 0.001)
        || (Number.isFinite(savedPen) && Math.abs(savedPen - previousPatchDefault) < 0.001);
      const previousPenDefaults = [4.8, previousPatchDefault];
      if (legacyDefault) {
        const corrected = percentToPen(PEN_DEFAULT_PERCENT);
        savedPen = corrected;
        const migrateList = list => {
          if (!Array.isArray(list)) return;
          list.forEach(item => {
            if (item?.type === 'pen' && previousPenDefaults.some(old => Math.abs(Number(item.penWidth) - old) < 0.001)) item.penWidth = corrected;
          });
        };
        migrateList(state?.playItems);
        (state?.plays || []).forEach(play => {
          migrateList(play.items);
          Object.values(play.mapBoards || {}).forEach(migrateList);
        });
      }
      if (!Number.isFinite(Number(localStorage.getItem('rnPlaybookShapeBorderWidth')))) {
        localStorage.setItem('rnPlaybookShapeBorderWidth', String(percentToShape(SHAPE_DEFAULT_PERCENT)));
      }
      localStorage.setItem('rnPlaybookPenStrokeWidth', String(savedPen));
      localStorage.setItem('mrPlaybookPenThicknessV2', String(savedPen));
      localStorage.setItem(migrationKey, '1');
      if (legacyDefault) saveBoard();
    }
    savedPen = clamp(Number(localStorage.getItem('rnPlaybookPenStrokeWidth')) || percentToPen(PEN_DEFAULT_PERCENT), PEN_MIN, PEN_MAX);

    const shapeDefault = () => clamp(Number(localStorage.getItem('rnPlaybookShapeBorderWidth')) || percentToShape(SHAPE_DEFAULT_PERCENT), SHAPE_MIN, SHAPE_MAX);
    const setShapeDefault = value => {
      const physical = clamp(value, SHAPE_MIN, SHAPE_MAX);
      localStorage.setItem('rnPlaybookShapeBorderWidth', String(physical));
      window.__rnSetBoardShapeDefaults?.({borderWidth: physical});
      return physical;
    };
    const setPenDefault = value => {
      const physical = clamp(value, PEN_MIN, PEN_MAX);
      const preservedShapeWidth = shapeDefault();
      localStorage.setItem('rnPlaybookPenStrokeWidth', String(physical));
      localStorage.setItem('mrPlaybookPenThicknessV2', String(physical));
      if (typeof baseSetter === 'function') baseSetter(physical);
      // The legacy setter also changes shape defaults. Restore their independent pixel value.
      setShapeDefault(preservedShapeWidth);
      return physical;
    };
    window.__rnSetBoardPenThickness = setPenDefault;

    const input = oldInput.cloneNode(true);
    input.min = '1'; input.max = '100'; input.step = '1';
    input.setAttribute('aria-label', 'Stroke thickness percentage');
    input.dataset.rnPercentageV1334 = '1';
    oldInput.replaceWith(input);

    const currentSelection = () => {
      const ids = new Set(selectedIds());
      return getItems().filter(item => ids.has(String(item.id)) && ['pen','shape','arrow','wall','broken'].includes(item.type));
    };
    const currentMode = () => {
      const selected = currentSelection();
      if (selected.some(item => item.type === 'pen')) return 'pen';
      if (selected.length) return 'shape';
      return currentToolIsPen() ? 'pen' : 'shape';
    };
    const updateReadout = percent => {
      const value = clamp(Math.round(Number(percent) || PEN_DEFAULT_PERCENT), 1, 100);
      input.value = String(value);
      const mode = currentMode();
      if (mode === 'pen') {
        const actual = percentToPen(value);
        const pixels = stageWidth() * actual / 100;
        output.textContent = `${value}% · ${pixels.toFixed(1)}px`;
        output.title = `${actual.toFixed(3)}% of board width, approximately ${pixels.toFixed(1)} CSS pixels at the current board width`;
      } else {
        const actual = percentToShape(value);
        output.textContent = `${value}%`;
        output.title = `${actual.toFixed(2)} px border`;
      }
      input.title = output.title;
    };
    const updateSelectedAndDefault = percent => {
      const value = clamp(percent, 1, 100);
      const selection = currentSelection();
      const pens = selection.filter(item => item.type === 'pen');
      const shapes = selection.filter(item => item.type !== 'pen');
      let changed = false;

      if (!selection.length) {
        if (currentToolIsPen()) setPenDefault(percentToPen(value));
        else setShapeDefault(percentToShape(value));
      } else {
        if (pens.length) {
          const physical = percentToPen(value);
          setPenDefault(physical);
          pens.forEach(item => { item.penWidth = physical; changed = true; });
        }
        if (shapes.length) {
          const physical = percentToShape(value);
          setShapeDefault(physical);
          shapes.forEach(item => { item.borderWidth = physical; changed = true; });
        }
      }
      updateReadout(value);
      if (changed) {
        window.__rnRenderBoard?.();
        saveBoard();
      }
    };

    // A new freehand stroke uses the corrected pen-specific width. It does not reuse
    // the 4.8px shape-border default or the legacy combined slider value.
    const originalNew = window.newBoardItem;
    if (typeof originalNew === 'function' && !originalNew.__rnV1334PenUnits) {
      const wrappedNew = function (type, extra = {}) {
        if (type === 'pen') {
          extra = {...extra, penWidth: clamp(Number(localStorage.getItem('rnPlaybookPenStrokeWidth')) || percentToPen(PEN_DEFAULT_PERCENT), PEN_MIN, PEN_MAX)};
        }
        return originalNew.call(this, type, extra);
      };
      wrappedNew.__rnV1334PenUnits = true;
      window.newBoardItem = wrappedNew;
    }

    input.addEventListener('input', () => updateSelectedAndDefault(input.value));
    const sync = () => {
      const selected = currentSelection();
      const selectedPen = selected.find(item => item.type === 'pen');
      const selectedShape = selected.find(item => item.type !== 'pen');
      if (selectedPen) updateReadout(penToPercent(Number(selectedPen.penWidth) || savedPen));
      else if (selectedShape) updateReadout(shapeToPercent(Number(selectedShape.borderWidth) || shapeDefault()));
      else if (currentToolIsPen()) updateReadout(penToPercent(Number(localStorage.getItem('rnPlaybookPenStrokeWidth')) || savedPen));
      else updateReadout(shapeToPercent(shapeDefault()));
    };
    const priorSync = window.__rnSyncToolSettingsVisibility;
    if (typeof priorSync === 'function' && !priorSync.__rnV1334ThicknessSync) {
      const wrappedSync = function (...args) {
        const result = priorSync.apply(this, args);
        sync();
        return result;
      };
      wrappedSync.__rnV1334ThicknessSync = true;
      window.__rnSyncToolSettingsVisibility = wrappedSync;
    }

    setPenDefault(savedPen);
    setShapeDefault(shapeDefault());
    sync();

    const defaultsButton = document.getElementById('rnToolDefaultsBtn');
    defaultsButton?.addEventListener('click', () => requestAnimationFrame(() => {
      setPenDefault(percentToPen(PEN_DEFAULT_PERCENT));
      setShapeDefault(percentToShape(SHAPE_DEFAULT_PERCENT));
      updateReadout(currentToolIsPen() ? PEN_DEFAULT_PERCENT : SHAPE_DEFAULT_PERCENT);
    }));
  }

  function installNumberMarkerResizeV1334() {
    const stage = document.getElementById('playBoardStage');
    if (!stage || stage.dataset.rnNumberResizeV1334 === '1') return;
    stage.dataset.rnNumberResizeV1334 = '1';

    let activeDrag = null;
    const numberItems = () => new Map(getItems().filter(item => item.type === 'number').map(item => [String(item.id), item]));
    const findHandle = id => [...stage.querySelectorAll(':scope > .rn-number-resize-handle')]
      .find(handle => String(handle.dataset.itemId) === String(id)) || null;
    const applyScale = (element, item) => {
      if (!element || !item) return;
      const scale = clamp(Number(item.scale) || 1, 0.25, 4);
      element.style.setProperty('--rn-number-size', `${31 * scale}px`);
      element.style.setProperty('--rn-number-font-size', `${15 * scale}px`);
      element.style.setProperty('--rn-number-border-size', `${2 * scale}px`);
      element.style.overflow = 'visible';
      element.style.transform = `rotate(${Number(item.rotate) || 0}deg)`;
      element.style.transformOrigin = '50% 50%';
    };
    const positionHandle = (handle, element) => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const size = Math.max(1, element.offsetWidth || 31);
      const handleSize = 14;
      handle.style.left = `${clamp((Number(element.offsetLeft) || 0) + size - handleSize / 2, 0, width - handleSize)}px`;
      handle.style.top = `${clamp((Number(element.offsetTop) || 0) + size - handleSize / 2, 0, height - handleSize)}px`;
    };

    const commitResize = handle => {
      const drag = activeDrag;
      if (!drag || drag.handle !== handle) return;
      activeDrag = null;
      handle.removeAttribute('data-dragging');
      saveBoard();
      window.__rnRenderBoard?.();
    };

    const decorate = () => {
      const items = numberItems();
      const markers = [...stage.querySelectorAll(':scope > .board-item.board-number.rn-number-compact[data-board-item]')];
      const selected = markers.filter(element => element.classList.contains('selected'));
      const selectedId = selected.length === 1 ? String(selected[0].dataset.boardItem) : '';

      stage.querySelectorAll(':scope > .rn-number-resize-handle').forEach(handle => {
        if (!selectedId || String(handle.dataset.itemId) !== selectedId || !items.has(selectedId)) handle.remove();
      });
      markers.forEach(element => {
        const id = String(element.dataset.boardItem);
        const item = items.get(id);
        if (!item) return;
        applyScale(element, item);
        if (id !== selectedId) return;

        let handle = findHandle(id);
        if (!handle) {
          handle = document.createElement('button');
          handle.type = 'button';
          handle.className = 'rn-number-resize-handle';
          handle.dataset.itemId = id;
          handle.setAttribute('aria-label', 'Resize number marker');
          handle.title = 'Drag down and right to enlarge, or up and left to shrink';
          handle.innerHTML = '<span aria-hidden="true">↘</span>';
          handle.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            const live = items.get(String(handle.dataset.itemId));
            if (!live) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            activeDrag = {
              handle,
              itemId: String(live.id),
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              startScale: clamp(Number(live.scale) || 1, 0.25, 4)
            };
            handle.setAttribute('data-dragging', '1');
            try { handle.setPointerCapture(event.pointerId); } catch (_) {}
          });
          handle.addEventListener('pointermove', event => {
            const drag = activeDrag;
            if (!drag || drag.handle !== handle || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const live = numberItems().get(drag.itemId);
            if (!live) return;
            const zoom = Math.max(0.25, Number(window.__rnGetBoardZoom?.()) || 1);
            const delta = ((event.clientX - drag.startX) + (event.clientY - drag.startY)) / (100 * zoom);
            live.scale = clamp(drag.startScale + delta, 0.25, 4);
            const liveElement = stage.querySelector(`:scope > .board-item.board-number.rn-number-compact[data-board-item="${CSS.escape(drag.itemId)}"]`);
            if (liveElement) {
              applyScale(liveElement, live);
              positionHandle(handle, liveElement);
            }
          });
          handle.addEventListener('pointerup', event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            commitResize(handle);
          });
          handle.addEventListener('pointercancel', event => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            commitResize(handle);
          });
          stage.appendChild(handle);
        }
        positionHandle(handle, element);
      });
    };

    const observer = new MutationObserver(decorate);
    observer.observe(stage, {childList: true, attributes: true, attributeFilter: ['class']});
    decorate();

    const style = document.createElement('style');
    style.id = 'rn-v1334-number-marker-resize-css';
    style.textContent = `
      body.playbook-mode #playBoardStage > .board-item.board-number.rn-number-compact{
        box-sizing:border-box!important;display:grid!important;place-items:center!important;
        width:var(--rn-number-size,31px)!important;height:var(--rn-number-size,31px)!important;
        min-width:var(--rn-number-size,31px)!important;min-height:var(--rn-number-size,31px)!important;
        max-width:var(--rn-number-size,31px)!important;max-height:var(--rn-number-size,31px)!important;
        font-size:var(--rn-number-font-size,15px)!important;
        border-width:var(--rn-number-border-size,2px)!important;overflow:visible!important;
        transform-origin:50% 50%!important;
      }
      body.playbook-mode #playBoardStage > .inline-board-text-editor.rn-number-marker-editor{
        width:var(--rn-number-size,31px)!important;height:var(--rn-number-size,31px)!important;
        min-width:var(--rn-number-size,31px)!important;min-height:var(--rn-number-size,31px)!important;
        max-width:var(--rn-number-size,31px)!important;max-height:var(--rn-number-size,31px)!important;
        font-size:var(--rn-number-font-size,15px)!important;
        border-width:var(--rn-number-border-size,2px)!important;
      }
      /* The sibling drag handle below is the only resize control for compact number markers. */
      body.playbook-mode #playBoardStage > .board-item.board-number.rn-number-compact > .resize-handle{
        display:none!important;pointer-events:none!important;
      }
      body.playbook-mode #playBoardStage > .rn-number-resize-handle{
        position:absolute!important;z-index:900!important;display:flex!important;align-items:center!important;justify-content:center!important;
        box-sizing:border-box!important;width:14px!important;height:14px!important;min-width:14px!important;min-height:14px!important;
        margin:0!important;padding:0!important;border:1px solid #17232c!important;border-radius:50%!important;
        background:#ffe18a!important;color:#17232c!important;font-size:10px!important;font-weight:950!important;line-height:1!important;
        box-shadow:0 0 0 1px #fff3b0,0 2px 5px #0009!important;cursor:nwse-resize!important;
        pointer-events:auto!important;touch-action:none!important;user-select:none!important;
      }
      body.playbook-mode #playBoardStage > .rn-number-resize-handle[data-dragging="1"]{
        background:#fff3bf!important;transform:scale(1.15)!important;
      }
    `;
    document.head.appendChild(style);
  }

  function installPocketPlayWorkflowV1334() {
    if (window.__rnV1334PocketPlayWorkflow) return;
    window.__rnV1334PocketPlayWorkflow = true;

    const removeCreateButton = html => String(html || '').replace(/<button\b(?=[^>]*data-create-pocket-strat)[^>]*>[\s\S]*?<\/button>/gi, '');
    if (typeof comboCardHtml === 'function' && !comboCardHtml.__rnV1334PlayOnly) {
      const baseComboCardHtml = comboCardHtml;
      const wrappedComboCardHtml = function (combo) { return removeCreateButton(baseComboCardHtml.apply(this, arguments)); };
      wrappedComboCardHtml.__rnV1334PlayOnly = true;
      comboCardHtml = wrappedComboCardHtml;
    }
    if (typeof reasonHtml === 'function' && !reasonHtml.__rnV1334PlayOnly) {
      const baseReasonHtml = reasonHtml;
      const wrappedReasonHtml = function (reason) { return removeCreateButton(baseReasonHtml.apply(this, arguments)); };
      wrappedReasonHtml.__rnV1334PlayOnly = true;
      reasonHtml = wrappedReasonHtml;
    }

    // Remove any already-rendered legacy creation actions. The cards are redrawn below
    // with the existing linked-play action, labelled PLAY.
    document.querySelectorAll('#counterResults [data-create-pocket-strat],#comboResultsMountNew [data-create-pocket-strat],#officialTeamupMountNew [data-create-pocket-strat]')
      .forEach(button => button.remove());
    try { renderCounterResults?.(); } catch (error) { console.warn('Could not refresh Counter Picks Pocket Strat actions', error); }
    try { renderComboResults?.(); } catch (error) { console.warn('Could not refresh Synergy Pocket Strat actions', error); }

    const clone = value => JSON.parse(JSON.stringify(value ?? null));
    const normalView = view => {
      const raw = String(view || '2d').trim();
      if (raw.toLowerCase() === '2d') return '2d';
      const submap2D = /^([1-3])-2d$/i.exec(raw);
      if (submap2D) return `${submap2D[1]}-2d`;
      return raw.toUpperCase();
    };
    const mapPrefix = mapId => `${mapId || '__blank__'}::`;
    const draftStorageKey = 'rnPlaybookDraftBoardsV1313b';
    const makeDraftName = () => {
      const typed = String(document.getElementById('playName')?.value || state.playName || 'Untitled Play').trim() || 'Untitled Play';
      const root = typed.replace(/\s*\(DRAFT\)\s*$/i, '').trim() || 'Untitled Play';
      const draftSuffix = ' (DRAFT)';
      let candidate = `${root.slice(0, 70 - draftSuffix.length).trimEnd()}${draftSuffix}`;
      let suffix = 2;
      while ((state.plays || []).some(play => String(play.name).toLowerCase() === candidate.toLowerCase())) {
        const tail = ` ${suffix++}`;
        candidate = `${root.slice(0, 70 - draftSuffix.length - tail.length).trimEnd()}${draftSuffix}${tail}`;
      }
      return candidate;
    };

    function saveCurrentAsDraftIfNeeded() {
      const items = Array.isArray(state.playItems) ? state.playItems : [];
      const active = (state.plays || []).find(play => String(play.id) === String(state.activePlayId)) || null;
      if (!items.length) {
        if (active) {
          state.playName = String(document.getElementById('playName')?.value || active.name || state.playName).trim() || active.name;
          active.name = state.playName;
        }
        persist();
        window.__rnRefreshSavedPlayPicker?.();
        return null;
      }

      const editor = document.querySelector('.inline-board-text-editor');
      if (editor?.isConnected) editor.blur();
      if (active) {
        state.playName = String(document.getElementById('playName')?.value || active.name || state.playName).trim() || active.name;
        active.name = state.playName;
        persist();
        window.__rnRefreshSavedPlayPicker?.();
        return null;
      }

      // Capture the latest current view first, then copy all draft views belonging to
      // this map into the new saved (DRAFT) play so none of its work is discarded.
      persist();
      const mapId = String(window.__rnGetTacticalMap?.() || '');
      const mapView = normalView(window.__rnGetTacticalMapView?.() || '2d');
      const prefix = mapPrefix(mapId);
      let drafts = {};
      try {
        const parsed = JSON.parse(localStorage.getItem(draftStorageKey) || '{}');
        if (parsed && typeof parsed === 'object') drafts = parsed;
      } catch (_) {}
      const mapBoards = {};
      Object.entries(drafts).forEach(([key, boardItems]) => {
        if (key.startsWith(prefix) && Array.isArray(boardItems)) mapBoards[key] = clone(boardItems);
      });
      const currentKey = `${prefix}${mapView}`;
      mapBoards[currentKey] = clone(items);
      const draft = {
        id:`play-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        name:makeDraftName(),
        items:clone(items),
        mapId,
        mapView,
        mapBoards,
        rnBoardSetVersion:2,
        pendingPocketLink:state.pendingPocketLink ? clone(state.pendingPocketLink) : null,
        updatedAt:new Date().toISOString()
      };
      state.plays.push(draft);
      state.activePlayId = draft.id;
      state.playName = draft.name;
      state.pendingPocketLink = null;
      persist();

      Object.keys(drafts).forEach(key => { if (key.startsWith(prefix)) delete drafts[key]; });
      try { localStorage.setItem(draftStorageKey, JSON.stringify(drafts)); } catch (_) {}
      window.__rnRefreshSavedPlayPicker?.();      return draft;
    }

    async function showPocketPlayInPlaybook(play) {
      const currentMap = String(window.__rnGetTacticalMap?.() || '');
      const targetMap = String(play.mapId || currentMap || '');
      const targetView = play.mapId ? normalView(play.mapView || '2d') : normalView(window.__rnGetTacticalMapView?.() || '2d');

      // The current play has already been saved. Temporarily detach it so the map
      // selector can switch to the target play without offering to start another play.
      state.activePlayId = null;
      state.playName = 'Untitled Play';
      state.playItems = [];
      state.selectedBoardItem = null;
      state.selectedBoardItems = [];

      if (targetMap && targetMap !== currentMap && typeof window.__rnSetTacticalMap === 'function') {
        await window.__rnSetTacticalMap(targetMap);
      }
      const liveView = normalView(window.__rnGetTacticalMapView?.() || '2d');
      if (targetView !== liveView && typeof window.__rnSetTacticalMapView === 'function') {
        window.__rnSetTacticalMapView(targetView);
      }

      // Restore the selected saved play's own board set for this map and view.
      window.__rnBeginBoardSetTransition?.();
      state.activePlayId = play.id;
      state.playName = play.name;
      state.pendingPocketLink = null;
      window.__rnEndBoardSetTransition?.();

      if (!window.__rnEndBoardSetTransition) state.playItems = normalizePlayItems(play.items || []);
      state.selectedBoardItem = null;
      state.selectedBoardItems = [];
      switchPage('playbookPage');
      renderPlaybook?.();
      window.__rnRefreshSavedPlayPicker?.();
      toast(`Opened ${play.name} in the Playbook.`);
    }

    window.addEventListener('click', async event => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('[data-open-pocket]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const play = (state.plays || []).find(candidate => String(candidate.id) === String(button.dataset.openPocket));
      if (!play) { toast('This Pocket Strat is no longer available.'); return; }
      try {
        const draft = saveCurrentAsDraftIfNeeded();
        await showPocketPlayInPlaybook(play);
        if (draft) toast(`Saved the current board as ${draft.name}, then opened the Pocket Strat in the Playbook.`);
      } catch (error) {
        console.error('Could not open Pocket Strat in Playbook', error);
        toast('Could not open this Pocket Strat in the Playbook. Your current play has been preserved.');
      }
    }, true);
  }

  function install() {
    document.title = 'RIVALSNOTEBOOK · v13.36';
    installDefaultMigrations();
    installShapePalette();
    installSmallerShapeDefaults();
    installTextFillOpacity();
    installThicknessPercentageV1334();
    installNumberMarkerResizeV1334();
    installPocketPlayWorkflowV1334();
    applyInitialShapeFillDefault();

    window.__rnRenderBoard?.();
    window.__rnSyncToolSettingsVisibility?.();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once: true});
  else install();
})();