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

  function installSynergyLayoutRestoration() {
    const section = document.querySelector('#synergiesPage .synergy-results');
    if (!section || section.dataset.rnV1335Layout === '1') return;
    const scroller = section.querySelector(':scope > .result-scroll');
    if (!scroller) return;
    section.dataset.rnV1335Layout = '1';

    let moving = false;
    const restoreStructure = () => {
      if (moving) return;
      moving = true;
      try {
        const heading = section.querySelector('.synergy-section-title');
        if (heading && heading.parentElement !== section) section.insertBefore(heading, scroller);
        const ribbon = section.querySelector('#rnSynergyRibbon') || document.querySelector('#rnSynergyRibbon');
        if (ribbon && ribbon.parentElement !== scroller) scroller.insertBefore(ribbon, scroller.firstChild);
      } finally {
        moving = false;
      }
    };
    restoreStructure();

    const style = document.createElement('style');
    style.id = 'rn-v1335-synergy-layout-restoration';
    style.textContent = `
      body:not(.playbook-mode) #synergiesPage .synergy-results{
        box-sizing:border-box!important;display:flex!important;flex-direction:column!important;
        align-items:stretch!important;justify-content:flex-start!important;
        grid-template-columns:none!important;grid-template-rows:none!important;
        gap:0!important;width:100%!important;min-width:0!important;min-height:0!important;
        height:100%!important;overflow:hidden!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.team-head{
        display:flex!important;flex:0 0 auto!important;align-items:center!important;
        justify-content:space-between!important;width:100%!important;min-width:0!important;
        margin:0 0 7px!important;padding:0!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.allied-lineup{
        box-sizing:border-box!important;display:grid!important;flex:0 0 auto!important;
        grid-template-columns:repeat(6,minmax(0,1fr))!important;grid-auto-rows:minmax(58px,auto)!important;
        align-content:start!important;align-items:stretch!important;gap:5px!important;
        width:100%!important;min-width:0!important;height:auto!important;min-height:62px!important;
        max-height:none!important;margin:0 0 9px!important;padding:4px!important;
        overflow:visible!important;border:1px dashed #586474!important;border-radius:5px!important;
        background:#303741!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.synergy-section-title{
        box-sizing:border-box!important;display:flex!important;flex:0 0 auto!important;
        flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;
        justify-content:space-between!important;gap:12px!important;width:100%!important;
        min-width:0!important;min-height:40px!important;margin:0 0 8px!important;
        padding:5px 0 7px!important;position:relative!important;top:auto!important;z-index:3!important;
        background:transparent!important;border:0!important;border-bottom:1px solid #53616f!important;
        box-shadow:none!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.synergy-section-title>div:first-child{
        flex:1 1 auto!important;min-width:0!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.synergy-section-title h2{
        margin:0!important;line-height:1.2!important;white-space:nowrap!important;
        overflow:hidden!important;text-overflow:ellipsis!important;font-size:18px!important;
      }
      body:not(.playbook-mode) #synergiesPage #synergyAddMount{
        display:flex!important;flex:0 0 auto!important;align-items:center!important;
        justify-content:flex-end!important;min-width:0!important;max-width:100%!important;
        margin:0!important;white-space:nowrap!important;
      }
      body:not(.playbook-mode) #synergiesPage #synergyAddMount button{
        flex:0 0 auto!important;white-space:nowrap!important;margin:0!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results>.result-scroll{
        box-sizing:border-box!important;display:block!important;position:relative!important;z-index:1!important;
        flex:1 1 0!important;width:100%!important;min-width:0!important;min-height:140px!important;
        height:auto!important;max-height:none!important;margin:0!important;padding:0 3px 8px 0!important;
        overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
      }
      body:not(.playbook-mode) #synergiesPage #rnSynergyRibbon{
        box-sizing:border-box!important;display:flex!important;flex:0 0 auto!important;
        align-items:center!important;gap:8px!important;width:100%!important;max-width:100%!important;
        margin:0 0 9px!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results .result-scroll>*{
        box-sizing:border-box!important;max-width:100%!important;min-width:0!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results .right-foot{
        box-sizing:border-box!important;display:flex!important;flex:0 0 auto!important;
        flex-direction:row!important;flex-wrap:wrap!important;align-items:flex-start!important;
        justify-content:flex-start!important;gap:12px 20px!important;width:100%!important;
        min-width:0!important;margin:8px 0 0!important;padding:7px 0 0!important;
        border-top:1px solid #485766!important;
      }
      body:not(.playbook-mode) #synergiesPage .synergy-results .right-foot>*{
        flex:1 1 220px!important;min-width:0!important;max-width:100%!important;
      }
      @media(max-width:820px){
        body:not(.playbook-mode) #synergiesPage .synergy-results{
          height:auto!important;min-height:580px!important;overflow:visible!important;
        }
        body:not(.playbook-mode) #synergiesPage .synergy-results>.result-scroll{
          flex:1 1 auto!important;min-height:250px!important;max-height:none!important;
        }
      }
      @media(max-width:600px){
        body:not(.playbook-mode) #synergiesPage .synergy-results>.allied-lineup{
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
        body:not(.playbook-mode) #synergiesPage .synergy-results>.synergy-section-title h2{font-size:15px!important;}
      }
    `;
    document.head.appendChild(style);

    // The cloud ribbon is created separately by the community layer. Keep it
    // inside the scrolling region so it cannot become an extra flex/grid row.
    const observer = new MutationObserver(() => {
      if (!moving) queueMicrotask(restoreStructure);
    });
    observer.observe(section, {childList:true, subtree:true});
    window.__rnV1335SynergyObserver = observer;
  }

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
    installSynergyLayoutRestoration();
    installThicknessSliderResync();
    installSamePlayDiscardPrompt();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();