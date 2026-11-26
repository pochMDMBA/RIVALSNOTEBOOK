/* RIVALSNOTEBOOK v13.35 regression fixes: Synergies layout, thickness slider, same-play discard. */
(() => {
  'use strict';
  if (window.__rnV1335RegressionFixesLoaded) return;
  window.__rnV1335RegressionFixesLoaded = true;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const getItems = () => window.__rnGetBoardItems?.() || [];
  const toast = message => {
    if (typeof window.toast === 'function') window.toast(message);
    else console.info(message);
  };

  function installThicknessSliderResync() {
    const input = document.getElementById('boardPenThickness');
    const output = document.getElementById('boardPenThicknessValue');
    const stage = document.getElementById('playBoardStage');
    if (!input || !output || input.dataset.rnV1335Resync === '1') return;
    input.dataset.rnV1335Resync = '1';

    const PEN_MIN = 0.05;
    const PEN_MAX = 0.35;
    const SHAPE_MAX = 12;
    const penToPercent = physical => Math.round((clamp(physical, PEN_MIN, PEN_MAX) - PEN_MIN) / (PEN_MAX - PEN_MIN) * 99 + 1);
    const shapeToPercent = physical => Math.round(clamp(physical, 0.05, SHAPE_MAX) / SHAPE_MAX * 100);
    const currentSelection = () => {
      const ids = new Set([...document.querySelectorAll('#playBoardStage > .board-item.selected[data-board-item]')]
        .map(element => String(element.dataset.boardItem)));
      return getItems().filter(item => ids.has(String(item.id)) && ['pen','shape','arrow','wall','broken'].includes(item.type));
    };
    const sync = () => {
      if (!input.isConnected) return;
      const selected = currentSelection();
      const selectedPen = selected.find(item => item.type === 'pen');
      const selectedShape = selected.find(item => item.type !== 'pen');
      const usePen = !!selectedPen || (!selectedShape && String(window.__rnGetBoardTool?.() || '').startsWith('pen-'));
      if (usePen) {
        const physical = Number(selectedPen?.penWidth) || Number(localStorage.getItem('rnPlaybookPenStrokeWidth')) || 0.05;
        const percent = penToPercent(physical);
        const widthPx = Math.max(1, stage?.clientWidth || 1000) * clamp(physical, PEN_MIN, PEN_MAX) / 100;
        input.value = String(percent);
        output.textContent = `${percent}% · ${widthPx.toFixed(1)}px`;
        output.title = `${clamp(physical, PEN_MIN, PEN_MAX).toFixed(3)}% of board width, approximately ${widthPx.toFixed(1)} CSS pixels at the current board width`;
      } else {
        const physical = Number(selectedShape?.borderWidth) || Number(localStorage.getItem('rnPlaybookShapeBorderWidth')) || 4.8;
        const percent = shapeToPercent(physical);
        input.value = String(percent);
        output.textContent = `${percent}%`;
        output.title = `${clamp(physical, 0.05, SHAPE_MAX).toFixed(2)} px border`;
      }
      input.title = output.title;
    };

    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; sync(); });
    };
    // The original inline renderer writes raw pixels/board-percent units back
    // into this percentage range input. Re-sync after every redraw and after
    // each input event so the thumb never gets clamped to the first ~20%.
    input.addEventListener('input', schedule);
    const originalRender = window.__rnRenderBoard;
    if (typeof originalRender === 'function' && !originalRender.__rnV1335SliderResync) {
      const wrappedRender = function (...args) {
        const result = originalRender.apply(this, args);
        schedule();
        return result;
      };
      wrappedRender.__rnV1335SliderResync = true;
      window.__rnRenderBoard = wrappedRender;
    }
    if (stage) {
      const observer = new MutationObserver(schedule);
      observer.observe(stage, {childList:true, subtree:false});
      window.__rnV1335SliderObserver = observer;
    }
    ['click','pointerup','keyup'].forEach(type => document.addEventListener(type, event => {
      if (event.target?.closest?.('#playBoardStage,.playbook-tools,#rnToolSettings')) schedule();
    }, true));
    window.__rnSyncThicknessSliderV1335 = sync;
    sync();
  }

  function installSamePlayDiscardPrompt() {
    if (document.documentElement.dataset.rnV1335DiscardPrompt === '1') return;
    if (typeof state === 'undefined' || !document.getElementById('playBoard')) return;
    document.documentElement.dataset.rnV1335DiscardPrompt = '1';

    const clone = value => {
      try { return JSON.parse(JSON.stringify(value ?? [])); }
      catch (_) { return Array.isArray(value) ? value.slice() : []; }
    };
    const normalizeView = value => {
      const raw = String(value || '2d').trim();
      if (raw.toLowerCase() === '2d') return '2d';
      const submap = /^([1-3])-2d$/i.exec(raw);
      if (submap) return `${submap[1]}-2d`;
      return raw.toUpperCase();
    };
    const mapKey = () => {
      const map = String(window.__rnGetTacticalMap?.() || '') || '__blank__';
      const view = normalizeView(window.__rnGetTacticalMapView?.() || '2d');
      return `${map}::${view}`;
    };
    const activePlay = () => (state.plays || []).find(play => String(play.id) === String(state.activePlayId)) || null;
    const storageKey = (id, key) => `rnV1335SavedBoardBaseline:${encodeURIComponent(String(id))}:${encodeURIComponent(key)}`;
    const readBaseline = (play, key) => {
      if (!play) return null;
      try {
        const stored = sessionStorage.getItem(storageKey(play.id, key));
        if (stored !== null) {
          const value = JSON.parse(stored);
          return Array.isArray(value) ? value : null;
        }
      } catch (_) {}
      const saved = Array.isArray(play.mapBoards?.[key])
        ? play.mapBoards[key]
        : (String(play.mapId || '') === String(window.__rnGetTacticalMap?.() || '')
          && normalizeView(play.mapView || '2d') === normalizeView(window.__rnGetTacticalMapView?.() || '2d')
          ? play.items : null);
      return Array.isArray(saved) ? clone(saved) : null;
    };
    const writeBaseline = (play = activePlay(), key = mapKey(), force = false) => {
      if (!play) return;
      const id = storageKey(play.id, key);
      try {
        if (!force && sessionStorage.getItem(id) !== null) return;
        const items = Array.isArray(play.mapBoards?.[key]) ? play.mapBoards[key] : play.items;
        sessionStorage.setItem(id, JSON.stringify(clone(items || [])));
      } catch (_) {}
    };
    const refreshBaseline = () => {
      const play = activePlay();
      if (!play) return;
      const key = mapKey();
      const saved = Array.isArray(play.mapBoards?.[key]) ? play.mapBoards[key] : getItems();
      try { sessionStorage.setItem(storageKey(play.id, key), JSON.stringify(clone(saved))); }
      catch (_) {}
    };

    // On the first page load, freeze the saved state for this tab. Auto-persist
    // can then write edits into local storage without losing the discard target.
    const initialise = () => writeBaseline(activePlay(), mapKey(), false);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, {once:true});
    else initialise();

    let replayingLoad = false;
    window.addEventListener('click', async event => {
      if (replayingLoad) return;
      const button = event.target?.closest?.('#loadPlayBtn');
      if (!button) return;
      const selectedId = String(document.getElementById('savedPlaySelect')?.value || '');
      const currentId = String(state.activePlayId || '');
      if (!selectedId || selectedId !== currentId) return;

      const play = activePlay();
      const key = mapKey();
      if (!play) return;
      writeBaseline(play, key, false);
      const baseline = readBaseline(play, key);
      if (!Array.isArray(baseline)) return;
      const current = clone(getItems());
      if (JSON.stringify(current) === JSON.stringify(baseline)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      let answer = {ok:false};
      if (typeof window.__rnOpenPlayDialog === 'function') {
        answer = await window.__rnOpenPlayDialog({
          title: 'Discard Changes?',
          message: `This saved play has new or modified board elements. Discard those changes and reload “${play.name || 'this play'}”?`,
          confirmText: 'DISCARD CHANGES',
          danger: true
        });
      } else {
        answer = {ok:window.confirm('Discard changes to this play and reload the saved version?')};
      }
      if (!answer?.ok) return;

      // Restore the frozen saved board before the existing map/view transition
      // hooks run. This prevents their capture phase from writing edits back.
      state.playItems = clone(baseline);
      state.selectedBoardItem = null;
      state.selectedBoardItems = [];
      play.mapBoards = play.mapBoards || {};
      play.mapBoards[key] = clone(baseline);
      if (String(play.mapId || '') === String(window.__rnGetTacticalMap?.() || '')) play.items = clone(baseline);
      window.__rnSetBoardSelection?.([]);
      window.__rnRenderBoard?.();
      try { window.persist?.(); } catch (error) { console.warn('Could not restore the saved Playbook snapshot:', error); }

      replayingLoad = true;
      button.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
      replayingLoad = false;
      setTimeout(refreshBaseline, 80);
    }, true);

    // A successful native LOAD or SAVE establishes a new baseline for the play
    // after its existing click handlers and board-set restore microtasks finish.
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('#loadPlayBtn,#savePlayBtn');
      if (!button) return;
      setTimeout(refreshBaseline, 80);
    }, true);
  }

  function install() {
    installThicknessSliderResync();
    installSamePlayDiscardPrompt();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();