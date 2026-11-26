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


  function communityThreadIsOpen(threadKey) {
    const open = appState()?.openCommunityCommentThreads;
    return Array.isArray(open) && open.includes(threadKey);
  }

  function communityThreadCommentCount(threadKey) {
    try {
      if (typeof communityCommentCount === 'function') {
        const count = Number(communityCommentCount(threadKey));
        return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
      }
    } catch (_) {}
    const stored = appState()?.communityComments?.[threadKey];
    return Array.isArray(stored) ? stored.length : 0;
  }

  function communityThreadPanelHtml(threadKey) {
    try {
      if (typeof communityCommentPanelHtml === 'function') {
        return String(communityCommentPanelHtml(threadKey) || '');
      }
    } catch (_) {}
    return '';
  }

  function makeCommunityCommentToggle(threadKey) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rn-post-comment-toggle rn-matchup-comment-toggle';
    button.dataset.communityCommentToggle = threadKey;
    button.setAttribute('aria-expanded', String(communityThreadIsOpen(threadKey)));
    button.title = 'Open the matchup discussion';
    button.textContent = `◯ ${communityThreadCommentCount(threadKey)} COMMENTS`;
    return button;
  }

  function makeCommunityCommentPanel(threadKey) {
    const html = communityThreadPanelHtml(threadKey);
    if (!html) return null;
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content;
  }

  function appendMatchupCommunityActions(reason, voteStack, threadKey) {
    if (!reason) return;
    const row = document.createElement('div');
    row.className = 'rn-matchup-community-actions';
    if (voteStack) row.appendChild(voteStack);
    row.appendChild(makeCommunityCommentToggle(threadKey));
    reason.appendChild(row);
    const panel = makeCommunityCommentPanel(threadKey);
    if (panel) reason.appendChild(panel);
  }

  function counterMatchupThreadKey(item, isGroup, ruleId, pairKey, contentId) {
    const identity = isGroup ? `group:${ruleId}:${pairKey}` : `tip:${contentId || item?.id || 'unknown'}`;
    return `counter-matchup:${identity}`;
  }

  function placeSelectedTeamMemberFirst(template, item) {
    const allies = (appState()?.ally || []).map(name => String(name).trim().toLowerCase());
    const a = String(item?.a || '').trim().toLowerCase();
    const b = String(item?.b || '').trim().toLowerCase();
    if (!allies.includes(b) || allies.includes(a)) return;

    const pair = template.content.querySelector('.rn-post-avatar-pair');
    const avatars = pair ? [...pair.querySelectorAll('.rn-post-pair-avatar')] : [];
    const plus = pair?.querySelector('.rn-post-pair-plus');
    if (avatars.length >= 2 && plus) pair.replaceChildren(avatars[1], plus, avatars[0]);

    const title = template.content.querySelector('.rn-post-title');
    if (title) title.textContent = `${item.b} + ${item.a}`;
  }

  function cleanupCounterPostChrome(root = document) {
    root.querySelectorAll('#counterPage .counter-post').forEach(card => {
      card.querySelector('.rn-post-header .rn-post-byline')?.remove();
      card.querySelector('.rn-post-header .rn-post-subtitle')?.remove();
      card.querySelector('.rn-post-targets')?.remove();
      card.querySelector('.rn-post-actions .rn-post-vote')?.remove();
      card.querySelector('.rn-post-actions [data-community-comment-toggle]')?.remove();
      card.querySelector('.counter-card-body > .rn-post-section-label')?.remove();
      card.querySelector('.counter-card-body > .rn-post-comments-heading')?.remove();
      [...card.children].filter(child => child.classList?.contains('rn-community-comment-panel')).forEach(panel => panel.remove());
      const actions = card.querySelector(':scope > .rn-post-actions');
      if (actions && !actions.children.length) actions.remove();
    });
  }

  function installMatchupLayoutStyles() {
    if ($('rn-v1342-matchup-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'rn-v1342-matchup-layout-style';
    style.textContent = `
      #counterPage .rn-post-header .rn-post-byline,
      #counterPage .rn-post-header .rn-post-subtitle,
      #synergiesPage .rn-post-header .rn-post-byline,
      #synergiesPage .rn-post-header .rn-post-subtitle{display:none!important}
      #counterPage .rn-post-targets{display:none!important}
      #counterPage .rn-post-actions .rn-post-vote,
      #counterPage .rn-post-actions .rn-post-comment-toggle{display:none!important}
      #counterPage .counter-card-body>.rn-post-section-label,
      #counterPage .counter-card-body>.rn-post-comments-heading{display:none!important}
      #counterPage .reason-actions .tier-badge,
      #counterPage .reason-actions .reason-points{display:none!important}
      #counterPage .reason-bottom-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex-wrap:wrap!important}
      .rn-matchup-community-actions{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important;margin:6px 0 1px!important;padding-top:5px!important;border-top:1px solid #344451!important}
      .rn-matchup-community-actions .rn-reddit-vote-stack{display:inline-flex!important;flex-direction:row!important;align-items:center!important;gap:4px!important;min-width:0!important;padding:3px 6px!important;border-radius:999px!important}
      .rn-matchup-community-actions .rn-reddit-vote{width:18px!important;height:18px!important;min-height:18px!important}
      .rn-matchup-community-actions .rn-reddit-score{min-width:14px!important;padding:0!important;font-size:9px!important}
      .rn-matchup-community-actions .rn-matchup-comment-toggle{min-height:24px!important;padding:3px 8px!important;font-size:8px!important}
      #counterPage .rn-matchup-community-actions{margin-top:5px!important}
      #counterPage .rn-matchup-comment-toggle{margin-left:0!important}
      #synergiesPage .rn-post-community-attribution{display:block!important;margin:5px 0 0!important;color:#9babb8!important;font-size:8px!important;line-height:1.35!important}
      #synergiesPage .rn-post-community-attribution a{color:#b9d9ec!important;text-decoration:none!important}
      #synergiesPage .rn-post-community-attribution a:hover{text-decoration:underline!important}
      #synergiesPage .rn-synergy-community-actions{margin-top:6px!important}
      #synergiesPage .rn-post-actions{margin:5px 0!important}
      @media(max-width:600px){
        .rn-matchup-community-actions{gap:5px!important}
        .rn-matchup-community-actions .rn-post-comment-toggle{white-space:normal!important}
      }
    `;
    document.head.appendChild(style);
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
        const contentId = isGroup ? `${ruleId}::${pairKey}` : (old.getAttribute('data-vote-counter') || item?.id || '');
        const voteStack = makeVoteStack(type, contentId, item?.votes, directionForItem(item,'counter'));
        old.replaceWith(voteStack);

        const reason = template.content.querySelector('.reason');
        const actions = template.content.querySelector('.reason-actions');
        const bottomActions = template.content.querySelector('.reason-bottom-actions');
        const seePlay = actions?.querySelector('.pocket-open-btn');
        if (seePlay) {
          if (bottomActions) bottomActions.insertBefore(seePlay, bottomActions.firstChild);
          else if (reason) {
            const bottom = document.createElement('div');
            bottom.className = 'reason-bottom-actions';
            bottom.appendChild(seePlay);
            reason.appendChild(bottom);
          }
        }
        actions?.querySelectorAll('.tier-badge,.reason-points').forEach(node => node.remove());
        if (actions && !actions.children.length) actions.remove();

        const threadKey = counterMatchupThreadKey(item, isGroup, ruleId, pairKey, contentId);
        let attribution = reason?.querySelector('.tip-foot');
        if (reason && !attribution) {
          attribution = document.createElement('div');
          attribution.className = 'tip-foot rn-matchup-community-label';
          attribution.textContent = item?.source || 'Community matchup tip';
          const description = reason.querySelector('.reason-text');
          if (description) description.after(attribution);
          else reason.appendChild(attribution);
        }
        appendMatchupCommunityActions(reason, voteStack, threadKey);
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
        const contentId = isGroup ? `${ruleId}::${pairKey}` : (old.getAttribute('data-vote-combo') || item?.id || '');
        const threadKey = `synergy:${item?.id || contentId}`;
        const voteStack = makeVoteStack(type, contentId, item?.votes, directionForItem(item,'synergy'));
        old.replaceWith(voteStack);

        placeSelectedTeamMemberFirst(template, item);

        const header = template.content.querySelector('.rn-post-header');
        const byline = template.content.querySelector('.rn-post-byline');
        const description = template.content.querySelector('.rn-post-description');
        const sourceMarkup = byline ? (() => {
          const source = byline.cloneNode(true);
          source.querySelectorAll('span').forEach(span => {
            if (span.textContent.trim().toLowerCase() === 'submitted by') span.remove();
          });
          return source.innerHTML.trim();
        })() : '';
        byline?.remove();
        header?.querySelector('.rn-post-subtitle')?.remove();

        if (description) {
          const attribution = document.createElement('div');
          attribution.className = 'rn-post-community-attribution';
          attribution.innerHTML = sourceMarkup || '<span>Community synergy tip</span>';
          description.appendChild(attribution);
        }

        const actions = template.content.querySelector('.rn-post-actions');
        const commentButton = actions?.querySelector('[data-community-comment-toggle]');
        commentButton?.remove();
        const oldPanel = template.content.querySelector('.rn-community-comment-panel');
        const seePlay = template.content.querySelector('.combo-foot .reason-actions > .pocket-open-btn');
        const comboFoot = template.content.querySelector('.combo-foot');
        if (seePlay && comboFoot) comboFoot.appendChild(seePlay);

        actions?.querySelector('.group-result-tag')?.remove();
        if (actions && header) header.after(actions);

        const communityRow = document.createElement('div');
        communityRow.className = 'rn-matchup-community-actions rn-synergy-community-actions';
        communityRow.appendChild(voteStack);
        communityRow.appendChild(makeCommunityCommentToggle(threadKey));
        if (description) description.after(communityRow);
        else if (actions) actions.after(communityRow);

        if (oldPanel) communityRow.after(oldPanel);
        else {
          const panel = makeCommunityCommentPanel(threadKey);
          if (panel) communityRow.after(panel);
        }

        return template.innerHTML;
      };
      wrapped.__rnV1337 = true;
      window.comboCardHtml = wrapped;
    }

    if (typeof window.pocketAction === 'function' && !window.pocketAction.__rnV1337) {
      const original = window.pocketAction;
      const wrapped = function() {
        return String(original.apply(this, arguments) || '')
          .replaceAll('<span>PLAY</span>', '<span>SEE PLAY</span>');
      };
      wrapped.__rnV1337 = true;
      window.pocketAction = wrapped;
    }
  }


  function installMatchupCommentToggleEvents() {
    if (document.documentElement.dataset.rnV1342CommentToggle) return;
    document.documentElement.dataset.rnV1342CommentToggle = '1';
    document.addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('.rn-matchup-comment-toggle')
        : null;
      if (!button) return;

      const row = button.closest('.rn-matchup-community-actions');
      const panel = row?.nextElementSibling?.matches?.('[data-community-comment-panel]')
        ? row.nextElementSibling
        : null;
      if (!panel) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(willOpen));

      const thread = button.getAttribute('data-community-comment-toggle') || '';
      const s = appState();
      if (!s) return;
      if (!Array.isArray(s.openCommunityCommentThreads)) s.openCommunityCommentThreads = [];
      const index = s.openCommunityCommentThreads.indexOf(thread);
      if (willOpen && index < 0) s.openCommunityCommentThreads.push(thread);
      if (!willOpen && index >= 0) s.openCommunityCommentThreads.splice(index, 1);
    }, true);
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
        cleanupCounterPostChrome();
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
      .reason-actions{min-width:0;}
      .reason-top>.pocket-open-btn,
      .combo-foot>.pocket-open-btn,
      .group-rule-detail>.pocket-open-btn{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        order:99!important;margin-left:auto!important;flex:0 0 auto!important;
        white-space:nowrap!important;
      }
      .reason-actions>.pocket-open-btn{margin-left:0!important;}
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
    installMatchupLayoutStyles();
    cleanupCounterPostChrome();
    installGroupSynergyValidation();
    installDirectionalVoteRenderers();
    installMatchupCommentToggleEvents();
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
    // The Synergies DOM is assembled by the base app after startup. Watch the
    // page shell so both filters are installed even when their mount nodes appear later.
    if (document.body && !document.body.dataset.rnV1337UiObserver) {
      document.body.dataset.rnV1337UiObserver = '1';
      const observer = new MutationObserver(() => {
        retry();
        cleanupCounterPostChrome();
        if (onlyUpvoted.counter) applyCounterFilter();
      });
      observer.observe(document.body,{childList:true,subtree:true});
      window.__rnV1337UiObserver = observer;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
