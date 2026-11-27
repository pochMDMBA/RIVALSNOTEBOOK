/* RIVALSNOTEBOOK v13.44 Counterpicker, Synergies and Playbook UI refinements. */
(() => {
  'use strict';
  if (window.__rnV1344UIUpdatesLoaded) return;
  window.__rnV1344UIUpdatesLoaded = true;

  const style = document.createElement('style');
  style.id = 'rn-v1344-ui-updates-style';
  style.textContent = `
    #counterPage .rn-counter-role-column .reason-top{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important}
    #counterPage .rn-counter-role-column .reason-actions{order:1!important;flex:0 1 auto!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important}
    #counterPage .rn-counter-role-column .reason-target{order:2!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;text-align:right!important;flex:0 1 auto!important;min-width:0!important;margin-left:auto!important}
    #counterPage .rn-counter-role-column .reason-target-hero{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;min-width:0!important;text-align:right!important}
    #counterPage .reason-bottom-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;width:100%!important;margin-top:6px!important}
    #counterPage .rn-counter-collapse-control,#synergiesPage .rn-synergy-collapse-control{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-height:22px!important;padding:3px 8px!important;margin:0!important;border:1px solid #526271!important;border-radius:999px!important;background:linear-gradient(145deg,#2a3944,#1d2b35)!important;color:#d7e1e8!important;font:850 7px/1.1 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.06em!important;white-space:nowrap!important;cursor:pointer!important}
    #counterPage .rn-counter-collapse-control:hover,#synergiesPage .rn-synergy-collapse-control:hover{border-color:#91b1c4!important;background:#344956!important;color:#fff!important}
    #counterPage .rn-counter-header-meta{gap:5px!important}
    #counterPage .rn-counter-header-meta .rn-post-points{order:1!important}
    #counterPage .rn-counter-header-meta .rn-post-rating{order:2!important}
    #counterPage .rn-counter-header-meta .rn-counter-collapse-control{order:3!important}
    #synergiesPage .rn-synergy-suggestion-header{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
    #synergiesPage .rn-synergy-header-meta{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 0 auto!important;gap:6px!important;margin-left:auto!important}
    #synergiesPage .rn-synergy-team-entry-header{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important}
    #synergiesPage .rn-synergy-entry-right{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 1 auto!important;flex-wrap:wrap!important;gap:7px!important;margin-left:auto!important;min-width:0!important}
    #synergiesPage .rn-synergy-team-identity{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 1 auto!important;gap:5px!important;min-width:0!important;margin-left:auto!important;white-space:nowrap!important}
    #synergiesPage .rn-synergy-team-avatar{width:26px!important;height:26px!important;min-width:26px!important;min-height:26px!important;flex-basis:26px!important}
    #synergiesPage .rn-synergy-team-name{font-size:9px!important;color:#e6eef4!important;font-weight:900!important}
    #synergiesPage .rn-synergy-entry-meta{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:5px!important;min-width:0!important}
    #synergiesPage .rn-synergy-entry-category{display:inline-flex!important;align-items:center!important;min-height:20px!important;padding:3px 7px!important;border-radius:4px!important;font-size:7px!important;font-weight:900!important;letter-spacing:.045em!important;white-space:nowrap!important}
    #synergiesPage .rn-synergy-contribution-points{margin:0!important;color:#f0d98a!important;font-size:8px!important;font-weight:950!important;white-space:nowrap!important}
    #synergiesPage .rn-synergy-entry-edit-row{display:flex!important;align-items:center!important;justify-content:flex-end!important;width:100%!important;margin:6px 0 0!important}
    #synergiesPage .rn-synergy-entry-edit-row .edit-btn{min-height:22px!important;padding:3px 7px!important;font-size:7px!important}
    #synergiesPage .rn-synergy-entry-description{margin:5px 0 0!important;padding:0!important}
    #synergiesPage .rn-synergy-entry-description .combo-reason{font-size:9px!important;line-height:1.4!important;color:#d6e0e8!important}
    #synergiesPage .rn-synergy-team-list[hidden]{display:none!important}
    @media(max-width:600px){#synergiesPage .rn-synergy-entry-right{width:100%!important;justify-content:flex-end!important}#synergiesPage .rn-synergy-team-identity{margin-left:auto!important}}
  `;
  document.head.appendChild(style);

  function installCounterControls() {
    document.querySelectorAll('#counterPage .counter-post').forEach(card => {
      const body = card.querySelector(':scope > .counter-card-body');
      const meta = card.querySelector('.rn-post-header-copy .rn-counter-header-meta');
      if (!body || !meta || !meta.querySelector('.rn-post-rating')) return;
      const extra = body.querySelector('.rn-counter-more-matchups');
      if (extra) { extra.open = true; extra.querySelector(':scope > summary')?.remove(); }
      let button = meta.querySelector(':scope > .rn-counter-collapse-control');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rn-counter-collapse-control';
        meta.appendChild(button);
      }
      const hidden = card.dataset.rnCounterMatchupsHidden === 'true';
      body.hidden = hidden;
      button.textContent = hidden ? 'SHOW' : 'HIDE';
      button.setAttribute('aria-expanded', String(!hidden));
      button.title = hidden ? 'Show all matchup entries' : 'Hide matchup details while keeping the hero summary visible';
    });
  }

  function installSynergyEntries() {
    document.querySelectorAll('#synergiesPage .rn-synergy-team-entry').forEach(entry => {
      const header = entry.querySelector(':scope > .rn-synergy-team-entry-header');
      if (!header) return;
      let right = header.querySelector(':scope > .rn-synergy-entry-right');
      if (!right) {
        header.querySelectorAll('.rn-synergy-entry-icon,.rn-post-rating-community').forEach(node => node.remove());
        right = document.createElement('div');
        right.className = 'rn-synergy-entry-right';
        const meta = document.createElement('div');
        meta.className = 'rn-synergy-entry-meta';
        const points = entry.querySelector(':scope > .rn-synergy-community-actions .rn-synergy-contribution-points');
        if (points) meta.appendChild(points);
        const categoryEdit = header.querySelector('.rn-post-category-edit');
        if (categoryEdit) {
          [...categoryEdit.querySelectorAll('.rn-post-rating,.combo-official,.tiny-tag')].forEach(node => {
            if (!node.classList.contains('rn-post-rating-community')) {
              node.classList.add('rn-synergy-entry-category');
              meta.appendChild(node);
            }
          });
        }
        header.querySelectorAll(':scope > .rn-synergy-entry-category,:scope > .combo-official,:scope > .tiny-tag').forEach(node => {
          if (!node.classList.contains('rn-post-rating-community') && !meta.contains(node)) {
            node.classList.add('rn-synergy-entry-category');
            meta.appendChild(node);
          }
        });
        if (meta.children.length) right.appendChild(meta);
        const avatar = header.querySelector(':scope > .rn-synergy-team-avatar');
        const name = header.querySelector(':scope > .rn-synergy-team-name');
        if (avatar || name) {
          const identity = document.createElement('div');
          identity.className = 'rn-synergy-team-identity';
          const label = document.createElement('span');
          label.className = 'reason-vs rn-synergy-with-label';
          label.textContent = 'WITH';
          identity.appendChild(label);
          if (avatar) identity.appendChild(avatar);
          if (name) identity.appendChild(name);
          right.appendChild(identity);
        }
        header.appendChild(right);
      }

      const description = entry.querySelector(':scope > .rn-synergy-entry-description');
      if (!description) return;
      let editRow = entry.querySelector(':scope > .rn-synergy-entry-edit-row');
      if (!editRow) {
        editRow = document.createElement('div');
        editRow.className = 'rn-synergy-entry-edit-row';
        description.insertAdjacentElement('afterend', editRow);
      }
      entry.querySelectorAll(':scope > .rn-synergy-team-entry-header .rn-post-category-edit .edit-btn,:scope > .rn-synergy-entry-footer .edit-btn,:scope > .rn-synergy-team-entry-header > .edit-btn').forEach(button => editRow.appendChild(button));
      const categoryEdit = header.querySelector('.rn-post-category-edit');
      if (categoryEdit && !categoryEdit.querySelector('.edit-btn') && !categoryEdit.children.length) categoryEdit.remove();
    });
  }

  function installSynergyControls() {
    document.querySelectorAll('#synergiesPage .rn-synergy-suggestion-post').forEach(card => {
      const header = card.querySelector(':scope > .rn-synergy-suggestion-header');
      const list = card.querySelector(':scope > .rn-synergy-team-list');
      const total = header?.querySelector('.rn-synergy-total-points');
      if (!header || !list || !total) return;
      let meta = header.querySelector(':scope > .rn-synergy-header-meta');
      if (!meta) { meta = document.createElement('div'); meta.className = 'rn-synergy-header-meta'; header.appendChild(meta); }
      if (!meta.contains(total)) meta.appendChild(total);
      let button = meta.querySelector(':scope > .rn-synergy-collapse-control');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rn-synergy-collapse-control';
        meta.appendChild(button);
      }
      const hidden = card.dataset.rnSynergyDetailsHidden === 'true';
      list.hidden = hidden;
      button.textContent = hidden ? 'SHOW' : 'HIDE';
      button.setAttribute('aria-expanded', String(!hidden));
      button.title = hidden ? 'Show teammate synergy details' : 'Hide teammate synergy details while keeping the suggested hero and total points visible';
    });
  }

  function install() { installCounterControls(); installSynergyEntries(); installSynergyControls(); }
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const counter = target?.closest('#counterPage .rn-counter-collapse-control');
    if (counter) {
      const card = counter.closest('.counter-post');
      const body = card?.querySelector(':scope > .counter-card-body');
      if (!card || !body) return;
      const hidden = !body.hidden;
      body.hidden = hidden;
      card.dataset.rnCounterMatchupsHidden = String(hidden);
      counter.textContent = hidden ? 'SHOW' : 'HIDE';
      counter.setAttribute('aria-expanded', String(!hidden));
      return;
    }
    const synergy = target?.closest('#synergiesPage .rn-synergy-collapse-control');
    if (synergy) {
      const card = synergy.closest('.rn-synergy-suggestion-post');
      const list = card?.querySelector(':scope > .rn-synergy-team-list');
      if (!card || !list) return;
      const hidden = !list.hidden;
      list.hidden = hidden;
      card.dataset.rnSynergyDetailsHidden = String(hidden);
      synergy.textContent = hidden ? 'SHOW' : 'HIDE';
      synergy.setAttribute('aria-expanded', String(!hidden));
    }
  }, true);

  function start() {
    install();
    if (!document.body || document.body.dataset.rnV1344Observer) return;
    document.body.dataset.rnV1344Observer = '1';
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; install(); });
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
