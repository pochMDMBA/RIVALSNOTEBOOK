/* RIVALSNOTEBOOK v13.64 Counterpicker filters and readable matchup descriptions. */
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
  let includeGroupCounterRules = true;

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

  function appendMatchupCommunityActions(reason, voteStack, threadKey, points) {
    if (!reason) return;
    const row = document.createElement('div');
    row.className = 'rn-matchup-community-actions';
    if (voteStack) row.appendChild(voteStack);
    row.appendChild(makeCommunityCommentToggle(threadKey));
    const contribution = document.createElement('span');
    contribution.className = 'rn-matchup-contribution-points';
    contribution.textContent = `${points} PTS`;
    row.appendChild(contribution);
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
      card.querySelectorAll('.rn-counter-submitted-by').forEach(node => node.remove());
      card.querySelector('.rn-post-header .rn-post-subtitle')?.remove();
      card.querySelector('.rn-post-targets')?.remove();
      card.querySelector('.rn-post-actions .rn-post-vote')?.remove();
      card.querySelector('.rn-post-actions [data-community-comment-toggle]')?.remove();
      card.querySelector('.counter-card-body > .rn-post-section-label')?.remove();
      card.querySelector('.counter-card-body > .rn-post-comments-heading')?.remove();
      [...card.children].filter(child => child.classList?.contains('rn-community-comment-panel')).forEach(panel => panel.remove());
      const details = card.querySelector('.rn-counter-more-matchups');
      if (details) {
        const reasonList = details.querySelector(':scope > .reason-list');
        if (reasonList) details.replaceWith(reasonList);
        else details.remove();
      }
      const actions = card.querySelector(':scope > .rn-post-actions');
      if (actions) {
        const headerCopy = card.querySelector('.rn-post-header-copy');
        let titleRow = headerCopy?.querySelector('.rn-counter-title-row');
        if (headerCopy && !titleRow) {
          titleRow = document.createElement('div');
          titleRow.className = 'rn-counter-title-row';
          const title = headerCopy.querySelector('.rn-post-title');
          if (title) {
            title.before(titleRow);
            titleRow.appendChild(title);
          } else headerCopy.appendChild(titleRow);
        }
        let meta = headerCopy?.querySelector('.rn-counter-header-meta');
        if (titleRow && meta && !titleRow.contains(meta)) titleRow.appendChild(meta);
        if (titleRow && !meta) {
          meta = document.createElement('div');
          meta.className = 'rn-counter-header-meta';
          titleRow.appendChild(meta);
        }
        const tier = actions.querySelector('.rn-post-rating');
        tier?.remove();
        const points = actions.querySelector('.rn-post-points');
        if (points && meta && !meta.contains(points)) {
          points.classList.add('rn-counter-total-points');
          meta.appendChild(points);
        }
        if (tier && meta && !meta.contains(tier)) meta.appendChild(tier);
        if (!actions.children.length) actions.remove();
      }
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
      #synergiesPage .rn-synergy-community-actions{margin-top:6px!important}
      #synergiesPage .rn-post-actions{margin:5px 0!important}
      #counterPage .rn-counter-title-row{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;min-width:0!important}
      #counterPage .rn-counter-title-row .rn-post-title{flex:0 1 auto!important}
      #counterPage .rn-counter-header-meta{display:inline-flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;margin:0!important;min-width:0!important}
      #counterPage .rn-counter-header-meta .rn-post-points{margin:0!important}
      #counterPage .rn-counter-header-meta .rn-post-rating{min-height:22px!important;padding:3px 7px!important}
      #counterPage .rn-counter-more-matchups{display:block!important}
      #counterPage .rn-counter-more-matchups>summary{display:none!important}
      #counterPage .rn-matchup-contribution-points{margin-left:auto!important;color:#f0d98a!important;font-size:8px!important;font-weight:950!important;white-space:nowrap!important}
      #synergiesPage .rn-synergy-suggestion-post{display:block!important;margin:0 0 10px!important;padding:8px!important;border:1px solid #46515d!important;border-radius:9px!important;background:linear-gradient(145deg,#1d2832,#17212a)!important;min-width:0!important}
      #synergiesPage .rn-synergy-suggestion-header{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;margin-bottom:7px!important}
      #synergiesPage .rn-synergy-suggestion-avatar{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;flex-basis:38px!important}
      #synergiesPage .rn-synergy-suggestion-title{flex:1 1 auto!important;min-width:0!important;font-size:13px!important;font-weight:950!important;line-height:1.2!important}
      #synergiesPage .rn-synergy-total-points{margin:0 0 0 auto!important;flex:0 0 auto!important}
      #synergiesPage .rn-synergy-team-list{display:grid!important;gap:6px!important;min-width:0!important}
      #synergiesPage .rn-synergy-team-entry{display:block!important;min-width:0!important;padding:7px!important;border:1px solid #354754!important;border-radius:7px!important;background:#202f3a!important}
      #synergiesPage .rn-synergy-team-entry-header{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important}
      #synergiesPage .rn-synergy-team-avatar{width:26px!important;height:26px!important;min-width:26px!important;min-height:26px!important;flex-basis:26px!important}
      #synergiesPage .rn-synergy-team-name{font-size:9px!important;color:#e6eef4!important;font-weight:900!important}
      #synergiesPage .rn-synergy-entry-icon{display:grid!important;place-items:center!important;width:19px!important;height:19px!important;flex:0 0 19px!important;color:#d9c779!important}
      #synergiesPage .rn-synergy-entry-icon svg{width:100%!important;height:100%!important}
      #synergiesPage .rn-synergy-team-entry-header .rn-post-category-edit{margin-left:auto!important;display:inline-flex!important;align-items:center!important;flex-wrap:wrap!important;gap:4px!important}
      #synergiesPage .rn-synergy-team-entry-header .rn-post-category-edit .edit-btn{min-height:22px!important;padding:3px 6px!important;font-size:7px!important}
      #synergiesPage .rn-synergy-entry-description{margin:5px 0 0!important;padding:0!important}
      #synergiesPage .rn-synergy-entry-description .combo-reason{font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif!important;font-size:9px!important;line-height:1.4!important;color:#d6e0e8!important}
      #counterPage .rn-counter-role-column .reason-text{font-size:12px!important;line-height:1.55!important}
      #counterPage .rn-counter-submitted-by{display:block!important;margin:4px 0 0!important;color:#96a8b9!important;font-size:8px!important;font-weight:750!important;line-height:1.3!important}
      #synergiesPage .rn-synergy-entry-description .rn-post-source-attribution{margin-top:5px!important;color:#94a8b7!important;font-size:8px!important;line-height:1.3!important}
      #synergiesPage .rn-synergy-entry-description .rn-post-source-attribution a{color:#b7d9ed!important;text-decoration:none!important}
      #synergiesPage .rn-synergy-entry-description .rn-post-source-attribution a:hover{text-decoration:underline!important}
      #synergiesPage .rn-synergy-submitted-by{display:block!important;margin:5px 0 0!important;color:#96a8b9!important;font-size:8px!important;font-weight:750!important;line-height:1.3!important}
      #synergiesPage .rn-synergy-community-actions{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important;margin:6px 0 0!important}
      #synergiesPage .rn-synergy-contribution-points{margin-left:auto!important}
      #synergiesPage .rn-synergy-entry-footer{display:flex!important;justify-content:flex-end!important;margin-top:5px!important}
      #synergiesPage .rn-synergy-entry-footer:empty{display:none!important}
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
        // Source/category labels are not submitter names. The attribution layer adds
        // only "Submitted by [Username]" after this renderer finishes.
        reason?.querySelectorAll('.tip-foot,.rn-matchup-community-label,.rn-counter-submitted-by,.rn-post-byline,.rn-post-source-attribution')
          .forEach(node => node.remove());
        appendMatchupCommunityActions(reason, voteStack, threadKey, counterContributionPoints(item));
        if (actions && !actions.children.length) actions.remove();
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

        const selectedAllies = new Set((appState()?.ally || []).map(name => String(name).trim().toLowerCase()));
        const aInTeam = selectedAllies.has(String(item?.a || '').trim().toLowerCase());
        const bInTeam = selectedAllies.has(String(item?.b || '').trim().toLowerCase());
        const teamMember = bInTeam && !aInTeam ? String(item?.b || '') : String(item?.a || '');
        const suggestionHero = bInTeam && !aInTeam ? String(item?.a || '') : String(item?.b || '');
        const synergyCard = template.content.querySelector('.synergy-post');
        const contributionPoints = synergyContributionPoints(item, template.content);
        if (synergyCard) {
          synergyCard.dataset.rnSynergyTeamMember = teamMember;
          synergyCard.dataset.rnSynergySuggestion = suggestionHero;
          synergyCard.dataset.rnSynergyContributionPoints = String(contributionPoints);
          synergyCard.dataset.rnSynergyIcon = String(item?.icon || 'sparkles');
        }

        const header = template.content.querySelector('.rn-post-header');
        const byline = template.content.querySelector('.rn-post-byline');
        const description = template.content.querySelector('.rn-post-description');
        const sourceLink = item?.sourceUrl && !item?.generated
          ? byline?.querySelector('a')?.cloneNode(true)
          : null;
        byline?.remove();
        header?.querySelector('.rn-post-subtitle')?.remove();

        // The source/byline text may contain "Group synergy · A + B". It is not an
        // author name, so do not display it as a Submitted by attribution.
        if (description && sourceLink) {
          const source = document.createElement('div');
          source.className = 'rn-post-source-attribution';
          source.append('Source: ', sourceLink);
          description.appendChild(source);
        }

        const actions = template.content.querySelector('.rn-post-actions');
        const commentButton = actions?.querySelector('[data-community-comment-toggle]');
        commentButton?.remove();
        const oldPanel = template.content.querySelector('.rn-community-comment-panel');
        const seePlay = template.content.querySelector('.combo-foot .reason-actions > .pocket-open-btn');
        const comboFoot = template.content.querySelector('.combo-foot');
        if (seePlay && comboFoot) comboFoot.appendChild(seePlay);

        actions?.querySelectorAll('.group-result-tag').forEach(node => node.remove());
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



  function counterContributionPoints(item) {
    try {
      if (typeof counterPoints === 'function') {
        const value = Number(counterPoints(item));
        if (Number.isFinite(value)) return Math.round(value);
      }
    } catch (_) {}
    const fallback = Number(item?.points);
    return Number.isFinite(fallback) ? Math.round(fallback) : 0;
  }

  function synergyContributionPoints(item, card) {
    try {
      if (typeof synergyPoints === 'function') {
        const value = Number(synergyPoints(item));
        if (Number.isFinite(value)) return Math.round(value);
      }
    } catch (_) {}
    const rendered = Number(card?.querySelector('.rn-post-points strong')?.textContent);
    if (Number.isFinite(rendered)) return Math.round(rendered);
    const fallback = Number(item?.points);
    return Number.isFinite(fallback) ? Math.round(fallback) : 0;
  }

  function synergyEntryIconMarkup(iconName) {
    try {
      if (typeof iconSvg === 'function') return String(iconSvg(iconName || 'sparkles') || '✦');
    } catch (_) {}
    return '✦';
  }

  function condenseSynergySuggestions(target) {
    if (!target) return;
    const cards = [...target.querySelectorAll('.synergy-post')]
      .filter(card => !card.closest('.rn-synergy-suggestion-post'));
    if (!cards.length) return;

    const grouped = new Map();
    cards.forEach(card => {
      const suggestion = String(card.dataset.rnSynergySuggestion || '').trim();
      const teammate = String(card.dataset.rnSynergyTeamMember || '').trim();
      if (!suggestion || !teammate) return;
      if (!grouped.has(suggestion)) grouped.set(suggestion, []);
      grouped.get(suggestion).push(card);
    });

    const rankedGroups = [...grouped.entries()].map(([suggestion, entries]) => ({
      suggestion,
      entries: entries.sort((a,b) =>
        (Number(b.dataset.rnSynergyContributionPoints)||0) - (Number(a.dataset.rnSynergyContributionPoints)||0) ||
        String(a.dataset.rnSynergyTeamMember||'').localeCompare(String(b.dataset.rnSynergyTeamMember||''))),
      totalPoints: entries.reduce((sum,card)=>sum+(Number(card.dataset.rnSynergyContributionPoints)||0),0)
    }));

    const roleOrder = [
      {name:'Vanguard',className:'vanguard'},
      {name:'Duelist',className:'duelist'},
      {name:'Strategist',className:'strategist'}
    ];
    const byRole = new Map(roleOrder.map(role=>[role.name,[]]));
    rankedGroups.forEach(group=>{
      let role = 'Duelist';
      try {
        if (typeof roleColumnForHero === 'function') {
          role = roleColumnForHero(group.suggestion);
        } else if (typeof hero === 'function') {
          const rawRole = String(hero(group.suggestion)?.role||'').trim().toLowerCase();
          role = rawRole === 'vanguard' ? 'Vanguard'
            : (rawRole === 'strategist' || rawRole === 'support') ? 'Strategist'
            : 'Duelist';
        }
      } catch (_) {}
      if (!byRole.has(role)) role = 'Duelist';
      byRole.get(role).push(group);
    });

    const compareWithinRole = (a,b) =>
      b.totalPoints-a.totalPoints || a.suggestion.localeCompare(b.suggestion);
    roleOrder.forEach(role=>byRole.get(role.name).sort(compareWithinRole));

    const firstHost = cards[0]?.parentNode;
    if (!firstHost) return;
    const columns = document.createElement('div');
    columns.className = 'rn-role-columns rn-synergy-role-columns';
    columns.style.gridColumn = '1 / -1';
    columns.style.width = '100%';
    const columnStacks = new Map();

    roleOrder.forEach(role=>{
      const suggestions = byRole.get(role.name);
      const column = document.createElement('section');
      column.className = 'rn-role-column rn-synergy-role-column';
      column.dataset.role = role.name.toLowerCase();

      const heading = document.createElement('div');
      heading.className = 'rn-role-column-head';
      const label = document.createElement('span');
      label.className = 'role-pill ' + role.className;
      label.textContent = role.name;
      const count = document.createElement('span');
      count.className = 'rn-role-column-count';
      count.textContent = suggestions.length + (suggestions.length===1 ? ' PICK' : ' PICKS');
      heading.append(label,count);

      const stack = document.createElement('div');
      stack.className = 'rn-role-card-stack';
      if (!suggestions.length) {
        const empty = document.createElement('div');
        empty.className = 'rn-role-empty';
        empty.textContent = 'No suggestions';
        stack.appendChild(empty);
      }
      column.append(heading,stack);
      columns.appendChild(column);
      columnStacks.set(role.name,stack);
    });

    firstHost.appendChild(columns);

    for (const role of roleOrder) {
      for (const {suggestion, entries, totalPoints} of byRole.get(role.name)) {
      const firstCard = entries[0];
      const firstAvatars = [...firstCard.querySelectorAll('.rn-post-avatar-pair .rn-post-pair-avatar')];
      const suggestionAvatar = firstAvatars[1]?.cloneNode(true) || firstAvatars[0]?.cloneNode(true);
      const roleStack = columnStacks.get(role.name);
      if (!roleStack) continue;

      const parent = document.createElement('article');
      parent.className = 'combo-card synergy-match-card rn-reddit-post rn-synergy-suggestion-post';
      parent.dataset.suggestionHero = suggestion;

      const header = document.createElement('div');
      header.className = 'rn-synergy-suggestion-header';
      if (suggestionAvatar) {
        suggestionAvatar.classList.add('rn-synergy-suggestion-avatar');
        header.appendChild(suggestionAvatar);
      }
      const title = document.createElement('div');
      title.className = 'rn-synergy-suggestion-title';
      title.textContent = suggestion;
      header.appendChild(title);

      const totalNode = document.createElement('span');
      totalNode.className = 'rn-post-points rn-synergy-total-points';
      const totalValue = document.createElement('strong');
      totalNode.append(totalValue, Object.assign(document.createElement('span'), {textContent:'PTS'}));
      header.appendChild(totalNode);
      parent.appendChild(header);

      const list = document.createElement('div');
      list.className = 'rn-synergy-team-list';
      entries.forEach(card => {
        const teammate = String(card.dataset.rnSynergyTeamMember || '').trim();
        const points = Math.round(Number(card.dataset.rnSynergyContributionPoints) || 0);

        const avatars = [...card.querySelectorAll('.rn-post-avatar-pair .rn-post-pair-avatar')];
        const teammateAvatar = avatars[0]?.cloneNode(true);
        const entry = document.createElement('section');
        entry.className = 'rn-synergy-team-entry';

        const entryHeader = document.createElement('div');
        entryHeader.className = 'rn-synergy-team-entry-header';
        if (teammateAvatar) {
          teammateAvatar.classList.add('rn-synergy-team-avatar');
          entryHeader.appendChild(teammateAvatar);
        }

        const teammateTitle = document.createElement('strong');
        teammateTitle.className = 'rn-synergy-team-name';
        teammateTitle.textContent = teammate;
        entryHeader.appendChild(teammateTitle);

        // Group icons stay on the separate Group Synergy Rules screen, not individual Synergies rows.

        const originalActions = card.querySelector('.rn-post-actions');
        const categoryEdit = originalActions?.querySelector('.rn-post-category-edit');
        if (categoryEdit) entryHeader.appendChild(categoryEdit);

        const description = card.querySelector('.rn-post-description');
        if (description) {
          description.querySelector('.rn-post-section-label')?.remove();
          description.classList.add('rn-synergy-entry-description');
        }

        const communityRow = card.querySelector('.rn-synergy-community-actions');
        const pointsNode = originalActions?.querySelector('.rn-post-points');
        if (pointsNode) {
          pointsNode.classList.add('rn-synergy-contribution-points');
          communityRow?.appendChild(pointsNode);
        } else {
          const contribution = document.createElement('span');
          contribution.className = 'rn-post-points rn-synergy-contribution-points';
          contribution.innerHTML = '<strong>' + points + '</strong><span>PTS</span>';
          communityRow?.appendChild(contribution);
        }

        entry.appendChild(entryHeader);
        if (description) entry.appendChild(description);
        const submittedBy = card.querySelector('.rn-submitted-by');
        if (submittedBy) {
          submittedBy.classList.add('rn-synergy-submitted-by');
          entry.appendChild(submittedBy);
        }
        if (communityRow) entry.appendChild(communityRow);

        const panel = communityRow?.nextElementSibling?.matches?.('[data-community-comment-panel]')
          ? communityRow.nextElementSibling
          : card.querySelector('[data-community-comment-panel]');
        if (panel) entry.appendChild(panel);

        const pocketFooter = card.querySelector('.combo-foot');
        if (pocketFooter) {
          pocketFooter.classList.add('rn-synergy-entry-footer');
          entry.appendChild(pocketFooter);
        }
        list.appendChild(entry);
      });

      totalValue.textContent = String(totalPoints);
      parent.appendChild(list);
      // Suggestions are ranked only against other heroes in the same role lane.
      roleStack.appendChild(parent);
      entries.forEach(card => card.remove());
      }
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

  function createGroupCounterRulesFilter() {
    const label = document.createElement('label');
    label.className = 'rn-include-group-counter-rules';
    label.innerHTML = '<input type="checkbox" id="rnIncludeGroupCounterRules" checked><span>Include Group Rules</span>';
    return label;
  }

  function installFilters() {
    const counterTitle = document.querySelector('#counterPage .result-scroll > .section-title');
    if (counterTitle) {
      const target = counterTitle.querySelector('#addCounterBtn')?.parentElement || counterTitle;
      if (!$('rnShowOnlyUpvotedCounter')) {
        target.insertBefore(createFilter('rnShowOnlyUpvotedCounter','counter','Show Only Upvoted Counter Picks'),target.firstChild);
      }
      if (!$('rnIncludeGroupCounterRules')) {
        const toggle = createGroupCounterRulesFilter();
        const upvoted = $('rnShowOnlyUpvotedCounter')?.parentElement;
        target.insertBefore(toggle,upvoted?.nextSibling || target.firstChild);
      }
    }

    const synergyMount = $('synergyAddMount');
    if (synergyMount && !$('rnShowOnlyUpvotedSynergy')) {
      synergyMount.insertBefore(
        createFilter('rnShowOnlyUpvotedSynergy','synergy','Show Only Upvoted Synergies'),
        synergyMount.firstChild
      );
    }
    const counterGroupRulesToggle = $('rnIncludeGroupCounterRules');
    if (counterGroupRulesToggle && !counterGroupRulesToggle.dataset.rnV1364Bound) {
      counterGroupRulesToggle.dataset.rnV1364Bound = '1';
      counterGroupRulesToggle.checked = includeGroupCounterRules;
      counterGroupRulesToggle.addEventListener('change', () => {
        includeGroupCounterRules = !!counterGroupRulesToggle.checked;
        applyCounterFilter();
      });
    }

    const groupRulesToggle = $('rnIncludeGroupSynergyRules');
    if (groupRulesToggle && !groupRulesToggle.dataset.rnV1350Bound) {
      groupRulesToggle.dataset.rnV1350Bound = '1';
      groupRulesToggle.addEventListener('change', () => window.renderComboResults?.());
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
      const isGroupRule = !!reason.querySelector('[data-rn-vote-stack][data-content-type="group_counter"],[data-vote-groupcounter]');
      const visible = (!onlyUpvoted.counter || Number(stack?.dataset.myDirection) === 1)
        && (includeGroupCounterRules || !isGroupRule);
      reason.classList.toggle('rn-filtered-out',!visible);
      if (visible) visibleReasons++;
    });
    root.querySelectorAll('.pick-card').forEach(card => {
      const rows = [...card.querySelectorAll('.reason')];
      if (rows.length) card.classList.toggle('rn-filtered-out',rows.every(row=>row.classList.contains('rn-filtered-out')));
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
        const result = original.call(this,visible,containerId,label);
        condenseSynergySuggestions(target);
        return result;
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
      #counterPage #counterResults .reason-actions .tier-badge,
      #counterPage #counterResults .reason-actions .reason-points{display:none!important}
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
      #counterPage .rn-include-group-counter-rules{display:inline-flex;align-items:center;gap:5px;flex:0 1 auto;min-width:0;color:#bdc9d5;font-size:9px;font-weight:750;line-height:1.25;white-space:nowrap;cursor:pointer}
      #counterPage .rn-include-group-counter-rules input{width:13px;height:13px;margin:0;flex:0 0 13px;accent-color:#c26f64;cursor:pointer}
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
        if (onlyUpvoted.counter || !includeGroupCounterRules) applyCounterFilter();
      });
      observer.observe(document.body,{childList:true,subtree:true});
      window.__rnV1337UiObserver = observer;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
