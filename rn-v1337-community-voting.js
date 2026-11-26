/* RIVALSNOTEBOOK v13.37 community voting and Group Synergy Rules UI. */
(() => {
  'use strict';
  if (window.__rnV1337CommunityUiLoaded) return;
  window.__rnV1337CommunityUiLoaded = true;

  const $ = id => document.getElementById(id);
  const appState = () => {
    try { if (typeof state !== 'undefined') return state; } catch (_) {}
    return window.state || null;
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const onlyUpvoted = {synergy:false,counter:false};

  function groupRuleFormActive() {
    const s = appState();
    const title = String($('comboModalTitle')?.textContent || '').toLowerCase();
    return !!(s && (
      s.editingComboRule ||
      s.activePage === 'groupsPage' ||
      s.returnToGroupManager ||
      (s.rnGroupRuleMode === 'synergy' && /rule/.test(title))
    ));
  }

  function installGroupSynergyValidation() {
    const form = $('comboForm');
    if (!form || form.dataset.rnV1337Validation) return;
    form.dataset.rnV1337Validation = '1';

    const help = $('comboExpansionHelp');
    if (help && !help.querySelector('.rn-group-synergy-requirement')) {
      const note = document.createElement('div');
      note.className = 'rn-group-synergy-requirement';
      note.textContent = 'Group Synergy Rules require a Hero Group on at least one side. Two individual heroes belong in regular Synergies.';
      help.appendChild(note);
    }

    form.addEventListener('submit', event => {
      if (!groupRuleFormActive()) return;
      const sourceType = $('comboSourceType')?.value;
      const targetType = $('comboTargetType')?.value;
      if (sourceType !== 'group' && targetType !== 'group') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const message = 'To add a Group Synergy Rule, choose a Hero Group on at least one side.';
        if (typeof window.toast === 'function') window.toast(message);
        else window.__rnShowCommunityAuth?.(message);
      }
    }, true);
  }

  function directionForItem(item, kind) {
    const explicit = Number(item?.myVoteDirection);
    if (explicit === 1 || explicit === -1) return explicit;
    if (!item?.generated) return 0;
    const s = appState();
    const rules = kind === 'synergy' ? s?.comboRules : s?.groupRules;
    const ruleId = kind === 'synergy' ? item.ruleId : item.groupRuleId;
    const rule = (rules || []).find(value => String(value.id) === String(ruleId));
    const stored = Number(rule?.voteDirectionsByPair?.[item.pairKey]);
    if (stored === 1 || stored === -1) return stored;
    return rule?.myVotesByPair?.[item.pairKey] ? 1 : 0;
  }

  function makeVoteStack(type, contentId, score, direction) {
    const value = Number(score);
    const shownScore = Number.isFinite(value) ? Math.trunc(value) : 0;
    const mine = Number(direction) === 1 || Number(direction) === -1 ? Number(direction) : 0;
    const wrap = document.createElement('div');
    wrap.className = 'rn-reddit-vote-stack';
    wrap.dataset.rnVoteStack = '1';
    wrap.dataset.contentType = type;
    wrap.dataset.contentId = contentId;
    wrap.dataset.myDirection = String(mine);
    wrap.setAttribute('role','group');
    wrap.setAttribute('aria-label','Community vote score');
    wrap.innerHTML = `
      <button type="button" class="rn-reddit-vote rn-reddit-up ${mine===1?'active':''}"
        data-rn-vote-direction="1" data-rn-vote-type="${escape(type)}" data-rn-vote-id="${escape(contentId)}"
        aria-label="Upvote" aria-pressed="${mine===1?'true':'false'}" title="Upvote">▲</button>
      <span class="rn-reddit-score" aria-live="polite">${shownScore}</span>
      <button type="button" class="rn-reddit-vote rn-reddit-down ${mine===-1?'active':''}"
        data-rn-vote-direction="-1" data-rn-vote-type="${escape(type)}" data-rn-vote-id="${escape(contentId)}"
        aria-label="Downvote" aria-pressed="${mine===-1?'true':'false'}" title="Downvote">▼</button>`;
    return wrap;
  }

  function installDirectionalVoteRenderers() {
    if (typeof window.reasonHtml === 'function' && !window.reasonHtml.__rnV1337) {
      const original = window.reasonHtml;
      const wrapped = function(item) {
        const html = original.apply(this, arguments);
        const template = document.createElement('template');
        template.innerHTML = String(html || '').trim();
        const old = template.content.querySelector('[data-vote-groupcounter],[data-vote-counter]');
        if (!old) return html;
        const isGroup = old.hasAttribute('data-vote-groupcounter');
        const ruleId = old.getAttribute('data-vote-groupcounter') || '';
        const pairKey = old.getAttribute('data-pair-key') || '';
        const type = isGroup ? 'group_counter' : 'counter_tip';
        const contentId = isGroup ? `${ruleId}::${pairKey}` : (old.getAttribute('data-vote-counter') || '');
        old.replaceWith(makeVoteStack(type, contentId, item?.votes, directionForItem(item,'counter')));
        return template.innerHTML;
      };
      wrapped.__rnV1337 = true;
      window.reasonHtml = wrapped;
    }

    if (typeof window.comboCardHtml === 'function' && !window.comboCardHtml.__rnV1337) {
      const original = window.comboCardHtml;
      const wrapped = function(item) {
        const html = original.apply(this, arguments);
        const template = document.createElement('template');
        template.innerHTML = String(html || '').trim();
        const old = template.content.querySelector('[data-vote-combo-rule],[data-vote-combo]');
        if (!old) return html;
        const isGroup = old.hasAttribute('data-vote-combo-rule');
        const ruleId = old.getAttribute('data-vote-combo-rule') || '';
        const pairKey = old.getAttribute('data-pair-key') || '';
        const type = isGroup ? 'group_synergy' : 'synergy';
        const contentId = isGroup ? `${ruleId}::${pairKey}` : (old.getAttribute('data-vote-combo') || '');
        old.replaceWith(makeVoteStack(type, contentId, item?.votes, directionForItem(item,'synergy')));
        return template.innerHTML;
      };
      wrapped.__rnV1337 = true;
      window.comboCardHtml = wrapped;
    }

    if (typeof window.pocketAction === 'function' && !window.pocketAction.__rnV1337) {
      const original = window.pocketAction;
      const wrapped = function() {
        return String(original.apply(this, arguments) || '')
          .replace(/<span>PLAY<\/span>/g, '<span>SEE PLAY</span>');
      };
      wrapped.__rnV1337 = true;
      window.pocketAction = wrapped;
    }
  }

  function createFilter(id, kind, labelText) {
    const label = document.createElement('label');
    label.className = 'rn-upvoted-filter';
    label.dataset.filterKind = kind;
    label.innerHTML = `<input type="checkbox" id="${id}"><span>${labelText}</span>`;
    return label;
  }

  function installFilters() {
    const counterTitle = document.querySelector('#counterPage .result-scroll > .section-title');
    if (counterTitle && !$('rnShowOnlyUpvotedCounter')) {
      const target = counterTitle.querySelector('#addCounterBtn')?.parentElement || counterTitle;
      target.insertBefore(createFilter('rnShowOnlyUpvotedCounter','counter','Show Only Upvoted Counter Picks'),target.firstChild);
    }

    const synergyMount = $('synergyAddMount');
    if (synergyMount && !$('rnShowOnlyUpvotedSynergy')) {
      synergyMount.insertBefore(
        createFilter('rnShowOnlyUpvotedSynergy','synergy','Show Only Upvoted Synergies'),
        synergyMount.firstChild
      );
    }

    document.querySelectorAll('.rn-upvoted-filter input').forEach(input => {
      if (input.dataset.rnV1337Bound) return;
      input.dataset.rnV1337Bound = '1';
      input.addEventListener('change', () => {
        const kind = input.id === 'rnShowOnlyUpvotedCounter' ? 'counter' : 'synergy';
        if (input.checked && !window.__rnIsSignedIn?.()) {
          input.checked = false;
          window.__rnRequireCommunityAccount?.(`view only the ${kind === 'counter' ? 'counter picks' : 'synergies'} you have upvoted`);
          return;
        }
        onlyUpvoted[kind] = !!input.checked;
        if (kind === 'counter') window.renderCounterResults?.();
        else window.renderComboResults?.();
      });
    });
  }

  function applyCounterFilter() {
    const root = $('counterResults');
    if (!root) return;
    let visibleReasons = 0;
    const reasons = [...root.querySelectorAll('.reason')];
    reasons.forEach(reason => {
      const stack = reason.querySelector('[data-rn-vote-stack]');
      const visible = !onlyUpvoted.counter || Number(stack?.dataset.myDirection) === 1;
      reason.classList.toggle('rn-filtered-out',!visible);
      if (visible) visibleReasons++;
    });
    root.querySelectorAll('.pick-card').forEach(card => {
      const rows = [...card.querySelectorAll('.reason')];
      if (rows.length) card.classList.toggle('rn-filtered-out',onlyUpvoted.counter && rows.every(row=>row.classList.contains('rn-filtered-out')));
    });
    let notice = root.querySelector('.rn-vote-filter-empty');
    if (onlyUpvoted.counter && reasons.length && visibleReasons === 0) {
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'empty-state rn-vote-filter-empty';
        notice.textContent = 'You have not upvoted any counter picks for this enemy lineup yet.';
        root.appendChild(notice);
      }
    } else notice?.remove();
  }

  function installRenderFilters() {
    if (typeof window.renderCounterResults === 'function' && !window.renderCounterResults.__rnV1337) {
      const original = window.renderCounterResults;
      const wrapped = function() {
        const result = original.apply(this,arguments);
        applyCounterFilter();
        return result;
      };
      wrapped.__rnV1337 = true;
      window.renderCounterResults = wrapped;
    }

    if (typeof window.renderComboCards === 'function' && !window.renderComboCards.__rnV1337) {
      const original = window.renderComboCards;
      const wrapped = function(combos,containerId,label) {
        const source = Array.isArray(combos) ? combos : [];
        const visible = onlyUpvoted.synergy
          ? source.filter(item=>directionForItem(item,'synergy')===1)
          : source;
        const target = $(containerId);
        if (onlyUpvoted.synergy && source.length && !visible.length && target) {
          target.innerHTML = '<div class="empty-state">You have not upvoted any matching synergies yet.</div>';
          return;
        }
        return original.call(this,visible,containerId,label);
      };
      wrapped.__rnV1337 = true;
      window.renderComboCards = wrapped;
    }
  }

  function installVotingEvents() {
    if (document.documentElement.dataset.rnV1337VoteEvents) return;
    document.documentElement.dataset.rnV1337VoteEvents = '1';
    document.addEventListener('click',event=>{
      const button = event.target instanceof Element ? event.target.closest('[data-rn-vote-direction]') : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.__rnVoteCommunity?.(
        button.dataset.rnVoteType,
        button.dataset.rnVoteId,
        Number(button.dataset.rnVoteDirection)
      );
    },true);

    window.addEventListener('rn-account-state-changed',event=>{
      if (event.detail?.signedIn) {
        if (onlyUpvoted.counter) window.renderCounterResults?.();
        if (onlyUpvoted.synergy) window.renderComboResults?.();
        return;
      }
      onlyUpvoted.counter = false;
      onlyUpvoted.synergy = false;
      if ($('rnShowOnlyUpvotedCounter')) $('rnShowOnlyUpvotedCounter').checked = false;
      if ($('rnShowOnlyUpvotedSynergy')) $('rnShowOnlyUpvotedSynergy').checked = false;
      window.renderCounterResults?.();
      window.renderComboResults?.();
    });
  }

  function installStyles() {
    if ($('rn-v1337-community-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'rn-v1337-community-ui-style';
    style.textContent = `
      .rn-group-synergy-requirement{
        margin-top:8px;padding:7px 9px;border-left:3px solid #e7c95b;
        background:#363a37;color:#f0e3ad;font-size:10px;line-height:1.35;
      }
      .rn-upvoted-filter{
        display:inline-flex;flex:0 1 auto;align-items:center;gap:5px;
        min-width:0;color:#bdc9d5;font-size:9px;font-weight:750;line-height:1.25;
        white-space:nowrap;cursor:pointer;
      }
      .rn-upvoted-filter input{
        width:13px!important;height:13px!important;margin:0!important;
        flex:0 0 13px;accent-color:#e4a15d;cursor:pointer;
      }
      #synergyAddMount .rn-upvoted-filter{margin-right:6px;}
      #counterPage .section-title .rn-upvoted-filter{margin-right:7px;}
      .rn-reddit-vote-stack{
        display:inline-flex;flex:0 0 auto;flex-direction:column;align-items:center;
        justify-content:center;gap:0;min-width:26px;padding:2px 3px;
        border:1px solid #465462;border-radius:7px;background:#202a34;
        vertical-align:middle;
      }
      .rn-reddit-vote{
        display:grid;place-items:center;width:22px;height:15px;min-height:15px;
        padding:0!important;border:0!important;border-radius:3px!important;
        background:transparent!important;color:#8f9eac!important;
        font-size:11px!important;font-weight:950!important;line-height:1!important;
        cursor:pointer;
      }
      .rn-reddit-vote:hover{background:#354351!important;color:#d7e0e7!important;}
      .rn-reddit-up.active{color:#ff8a4b!important;}
      .rn-reddit-down.active{color:#7eb9ee!important;}
      .rn-reddit-score{
        display:block;min-width:22px;padding:1px 0;text-align:center;
        color:#d9e1e8;font-size:10px;font-weight:850;line-height:1.1;
        font-variant-numeric:tabular-nums;
      }
      .reason-actions .rn-reddit-vote-stack{margin:0 2px;}
      .reason-actions .pocket-open-btn{
        order:99!important;margin-left:auto!important;flex:0 0 auto!important;
        white-space:nowrap!important;
      }
      .reason-actions{min-width:0;}
      #synergyAddMount{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px;}
      #synergyAddMount .rn-upvoted-filter{order:0;}
      #synergyAddMount>button{order:2;}
      #counterPage .section-title>div{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px;}
      #counterPage .reason.rn-filtered-out,
      #counterPage .pick-card.rn-filtered-out{display:none!important;}
      .rn-vote-filter-empty{margin-top:8px;}
      @media(max-width:700px){
        .rn-upvoted-filter{white-space:normal;max-width:190px;}
        #synergyAddMount{justify-content:flex-start;}
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    installGroupSynergyValidation();
    installDirectionalVoteRenderers();
    installFilters();
    installRenderFilters();
    installVotingEvents();
    // Account-state / layout installers can finish a tick after this script loads.
    const retry = () => {
      installFilters();
      installRenderFilters();
      installDirectionalVoteRenderers();
    };
    retry();
    const synergyMount = $('synergyAddMount');
    if (synergyMount) new MutationObserver(retry).observe(synergyMount,{childList:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
