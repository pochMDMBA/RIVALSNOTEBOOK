/* RIVALSNOTEBOOK v13.59 role-column Synergy ranking and reliable detail/edit controls. */
(() => {
  'use strict';
  if (window.__rnV1359SynergyUiLoaded) return;
  window.__rnV1359SynergyUiLoaded = true;

  const style = document.createElement('style');
  style.id = 'rn-v1347-layout-fixes-style';
  style.textContent = `
    #counterPage .rn-counter-hide-all,#synergiesPage .rn-synergy-hide-all{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:25px!important;padding:4px 9px!important;border:1px solid #526b79!important;border-radius:6px!important;background:#263b47!important;color:#dceaf1!important;font:850 8px/1.1 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.055em!important;white-space:nowrap!important;cursor:pointer!important}
    #counterPage .rn-counter-hide-all:hover,#synergiesPage .rn-synergy-hide-all:hover{border-color:#83c9bd!important;background:#2c4b52!important;color:#f1fffb!important}
    #counterPage .result-scroll .section-title .rn-counter-hide-all{margin-left:5px!important}
    #synergiesPage .rn-synergy-hide-all{margin-left:2px!important}
    #counterPage .rn-counter-role-column .reason-top{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important}
    #counterPage .rn-counter-role-column .reason-actions{order:1!important;flex:0 1 auto!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important}
    #counterPage .rn-counter-role-column .reason-target{order:2!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;text-align:right!important;flex:0 1 auto!important;min-width:0!important;margin-left:auto!important}
    #counterPage .rn-counter-role-column .reason-target-hero{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;min-width:0!important;text-align:right!important}
    #counterPage .reason-bottom-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;width:100%!important;margin-top:6px!important}
    #counterPage .rn-counter-collapse-control,#synergiesPage .rn-synergy-collapse-control{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-height:22px!important;padding:3px 8px!important;margin:0!important;border:1px solid #526271!important;border-radius:999px!important;background:linear-gradient(145deg,#2a3944,#1d2b35)!important;color:#d7e1e8!important;font:850 7px/1.1 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.06em!important;white-space:nowrap!important;cursor:pointer!important}
    #counterPage .rn-counter-collapse-control:hover,#synergiesPage .rn-synergy-collapse-control:hover{border-color:#91b1c4!important;background:#344956!important;color:#fff!important}
    #counterPage .rn-counter-title-row{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:7px!important;width:100%!important;min-width:0!important}
    #counterPage .rn-counter-title-row .rn-post-title{flex:0 1 auto!important;min-width:0!important}
    #counterPage .rn-counter-header-meta{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;margin:0 0 0 auto!important;min-width:0!important}

    #counterPage .reason-top{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:nowrap!important;width:100%!important;min-width:0!important}
    #counterPage .reason-top>.reason-target{display:flex!important;flex:1 1 auto!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;width:100%!important;min-width:0!important;margin:0 0 0 auto!important;white-space:nowrap!important}
    #counterPage .reason-target-hero{display:inline-flex!important;flex:0 0 auto!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;width:auto!important;min-width:0!important;margin:0!important;white-space:nowrap!important}
    #counterPage .reason-target-icon{width:31px!important;height:31px!important;flex:0 0 31px!important}
    #counterPage .reason-target-name{white-space:nowrap!important}
    #counterPage .reason-target .group-result-tag{flex:0 0 auto!important;white-space:nowrap!important}
    body:not(.playbook-mode) #synergiesPage .synergy-results .synergy-section-title{position:sticky!important;top:0!important;z-index:20!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:39px!important;margin:0 0 11px!important;padding:7px 0 9px!important;background:#1c2a35!important;border:0!important;border-bottom:1px solid #526271!important;border-radius:0!important;box-shadow:0 5px 9px #101820aa!important}
    body:not(.playbook-mode) #synergiesPage .synergy-results .synergy-section-title h2{margin:0!important;line-height:1.25!important}
    body:not(.playbook-mode) #synergiesPage .synergy-results .result-scroll{scroll-padding-top:46px!important}
    #synergiesPage .synergy-results .rn-synergy-suggestion-post{position:relative!important;z-index:1!important}

    #counterPage .reason-top{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;width:100%!important;min-width:0!important;margin-bottom:8px!important}
    #counterPage .reason-target-hero{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;width:100%!important;min-width:0!important;margin-left:auto!important;text-align:right!important;white-space:nowrap!important}
    #counterPage .reason-target-hero .reason-vs{font-size:9px!important;font-weight:950!important;letter-spacing:.08em!important;color:#93aabb!important}
    #counterPage .rn-counter-vs-avatar{position:relative!important;display:inline-grid!important;place-items:center!important;width:32px!important;height:32px!important;flex:0 0 32px!important;overflow:hidden!important;border:1px solid #526271!important;border-radius:7px!important;background:#2b3944!important;color:#e4edf4!important;font-size:8px!important;font-weight:900!important}
    #counterPage .rn-counter-vs-avatar img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
    #counterPage .rn-counter-vs-avatar.broken img{display:none!important}
    #counterPage .rn-counter-vs-avatar.broken>span{display:block!important}
    #counterPage .rn-counter-vs-avatar:not(.broken)>span{display:none!important}
    #counterPage .rn-counter-vs-name{font-size:10px!important;font-weight:900!important;color:#e7d98d!important}
    #counterPage .reason{margin:0 0 8px!important;padding:12px 14px!important;border:1px solid #394956!important;border-left:1px solid #394956!important;border-radius:10px!important;background:#22313b!important}
    #counterPage .reason-text{margin-top:6px!important;line-height:1.48!important}
    #counterPage .reason-bottom-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;margin-top:10px!important}
    #counterPage .reason-bottom-row>.tip-foot{flex:1 1 auto!important;min-width:0!important;margin:0!important}
    #counterPage .reason-bottom-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 0 auto!important;margin:0 0 0 auto!important}
    #counterPage .reason-bottom-actions .edit-btn{min-height:26px!important;padding:4px 10px!important;font-size:9px!important}
    #counterPage .rn-matchup-community-actions{margin-top:10px!important;padding-top:9px!important}
    #counterPage .rn-counter-header-meta{gap:5px!important}
    #counterPage .rn-counter-header-meta .rn-post-points{order:2!important}
    #counterPage .rn-counter-header-meta .rn-post-rating{order:1!important}
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
    #synergiesPage .rn-synergy-entry-edit-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;margin:8px 0 0!important}
    #synergiesPage .rn-synergy-entry-edit-row .rn-post-community-attribution{display:block!important;flex:1 1 auto!important;min-width:0!important;margin:0!important}
    #synergiesPage .rn-synergy-entry-edit-row .edit-btn{margin-left:auto!important}
    #synergiesPage .rn-synergy-contribution-points{margin:0 0 0 auto!important}
    #synergiesPage .rn-synergy-entry-edit-row .edit-btn{min-height:22px!important;padding:3px 7px!important;font-size:7px!important}
    #synergiesPage .rn-synergy-entry-description{margin:5px 0 0!important;padding:0!important}
    #synergiesPage .rn-synergy-entry-description .combo-reason{font-size:9px!important;line-height:1.4!important;color:#d6e0e8!important}
    #synergiesPage .rn-synergy-team-list[hidden]{display:none!important}
    @media(max-width:600px){#synergiesPage .rn-synergy-entry-right{width:100%!important;justify-content:flex-end!important}#synergiesPage .rn-synergy-team-identity{margin-left:auto!important}}

    /* v13.47: toolbar is part of the scrolling content, never a floating overlay. */
    body:not(.playbook-mode) #synergiesPage .synergy-results .result-scroll{
      display:flex!important;flex-direction:column!important;align-items:stretch!important;
      min-width:0!important;min-height:0!important;
    }
    body:not(.playbook-mode) #synergiesPage .synergy-results .synergy-section-title{
      position:static!important;top:auto!important;z-index:auto!important;flex:0 0 auto!important;
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      flex-wrap:wrap!important;gap:8px!important;width:100%!important;min-width:0!important;
      min-height:32px!important;height:auto!important;margin:0 0 11px!important;padding:0 0 8px!important;
      background:transparent!important;border:0!important;border-bottom:1px solid #526271!important;
      border-radius:0!important;box-shadow:none!important;
    }
    body:not(.playbook-mode) #synergiesPage .synergy-results .synergy-section-title h2{
      flex:0 1 auto!important;min-width:0!important;margin:0!important;line-height:1.25!important;
    }
    body:not(.playbook-mode) #synergiesPage #synergyAddMount{
      position:static!important;display:flex!important;flex:0 1 auto!important;align-items:center!important;
      justify-content:flex-end!important;flex-wrap:wrap!important;gap:8px!important;
      min-width:0!important;margin:0 0 0 auto!important;white-space:normal!important;
    }
    body:not(.playbook-mode) #synergiesPage #synergyAddMount .rn-upvoted-filter{
      position:static!important;flex:0 1 auto!important;max-width:none!important;margin:0!important;
    }
    body:not(.playbook-mode) #synergiesPage #synergyAddMount>button{
      position:static!important;flex:0 0 auto!important;margin:0!important;
    }
    body:not(.playbook-mode) #synergiesPage .synergy-result-scroll .combo-list{
      flex:0 0 auto!important;min-width:0!important;margin-top:0!important;
    }

    /* Counterpicker: keep VS, hero portrait and hero name in one right-aligned row. */
    #counterPage .reason-top{
      display:flex!important;flex-direction:row!important;align-items:center!important;
      justify-content:flex-end!important;flex-wrap:nowrap!important;gap:8px!important;
      width:100%!important;min-width:0!important;
    }
    #counterPage .reason-top>.reason-target{
      display:inline-flex!important;flex:0 1 auto!important;flex-direction:row!important;
      align-items:center!important;justify-content:flex-end!important;flex-wrap:nowrap!important;
      gap:7px!important;width:auto!important;min-width:0!important;margin:0 0 0 auto!important;
      white-space:nowrap!important;
    }
    #counterPage .reason-target-hero{
      display:inline-flex!important;flex:0 1 auto!important;flex-direction:row!important;
      align-items:center!important;justify-content:flex-end!important;flex-wrap:nowrap!important;
      gap:6px!important;width:auto!important;min-width:0!important;margin:0!important;
      white-space:nowrap!important;
    }
    #counterPage .reason-target .reason-vs{flex:0 0 auto!important;white-space:nowrap!important}
    #counterPage .reason-target-icon{flex:0 0 31px!important;width:31px!important;height:31px!important}
    #counterPage .reason-target-name{flex:0 1 auto!important;white-space:nowrap!important}
    #counterPage .reason-target .group-result-tag{display:none!important}
    @media(max-width:600px){
      body:not(.playbook-mode) #synergiesPage .synergy-results .synergy-section-title{align-items:flex-start!important}
      body:not(.playbook-mode) #synergiesPage #synergyAddMount{justify-content:flex-start!important;margin-left:0!important}
      #counterPage .reason-top>.reason-target{gap:5px!important}
    }
  `;
  style.textContent += `
    #synergiesPage .rn-synergy-content-toolbar{position:static!important;top:auto!important;z-index:auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:9px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0 0 9px!important;padding:0 0 8px!important;border:0!important;border-bottom:1px solid #526271!important;background:transparent!important;box-shadow:none!important}
    #synergiesPage .rn-synergy-content-toolbar-title{flex:0 1 auto!important;min-width:0!important;color:#f0f5f7!important;font-size:13px!important;font-weight:950!important;line-height:1.25!important}
    #synergiesPage .rn-synergy-content-toolbar-actions{position:static!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 1 auto!important;flex-wrap:wrap!important;gap:8px!important;min-width:0!important;margin-left:auto!important}
    #synergiesPage #synergyAddMount{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:8px!important;white-space:normal!important}
    #synergiesPage .rn-include-group-rules{display:inline-flex!important;align-items:center!important;gap:5px!important;flex:0 1 auto!important;min-width:0!important;color:#bdc9d5!important;font-size:9px!important;font-weight:750!important;line-height:1.25!important;white-space:nowrap!important;cursor:pointer!important}
    #synergiesPage .rn-include-group-rules input{width:13px!important;height:13px!important;margin:0!important;flex:0 0 13px!important;accent-color:#7dbb91!important;cursor:pointer!important}
    #synergiesPage .rn-synergy-strength-badge,#groupsPage .rn-synergy-strength-chip{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:19px!important;padding:3px 7px!important;border-radius:5px!important;font-size:7px!important;font-weight:950!important;letter-spacing:.055em!important;white-space:nowrap!important;border:1px solid #647485!important;background:#263b46!important;color:#dcecf3!important}
    #synergiesPage .rn-synergy-strength-badge.strength-strong,#groupsPage .rn-synergy-strength-chip.strength-strong{border-color:#579a78!important;background:#254a3d!important;color:#b9f0d1!important}
    #synergiesPage .rn-synergy-strength-badge.strength-moderate,#groupsPage .rn-synergy-strength-chip.strength-moderate{border-color:#ad9250!important;background:#4b422a!important;color:#f5dfa0!important}
    #synergiesPage .rn-synergy-strength-badge.strength-situational,#groupsPage .rn-synergy-strength-chip.strength-situational{border-color:#64798f!important;background:#2b3e50!important;color:#c8d9ed!important}
    @media(max-width:700px){#synergiesPage .rn-synergy-content-toolbar{align-items:flex-start!important}#synergiesPage .rn-synergy-content-toolbar-actions{justify-content:flex-start!important;margin-left:0!important}}
  `;
  style.textContent += `
    /* v13.51: make the active workspace and roster tabs unmistakable. */
    .page-nav .page-tab.active{
      border:1px solid #f2d36f!important;
      background:linear-gradient(135deg,#426f70,#2f5059)!important;
      color:#fff9dc!important;
      font-weight:950!important;
      text-shadow:0 0 8px #fff1b0a6!important;
      box-shadow:0 0 0 1px #f2d36f70,0 0 16px #6ddfd36b,inset 0 1px #ffffff38!important;
      filter:brightness(1.18)!important;
    }
    .tabs .tab.active{
      border:1px solid #f2d36f!important;
      background:linear-gradient(135deg,#416d70,#2c4d59)!important;
      color:#fff9dc!important;
      font-weight:950!important;
      text-shadow:0 0 7px #fff1b0a6!important;
      box-shadow:0 0 0 1px #f2d36f70,0 0 13px #6ddfd35e,inset 0 1px #ffffff38!important;
      filter:brightness(1.2)!important;
    }

    /* v13.51: keep the matchup target identity aligned to the right. */
    #counterPage .rn-counter-role-column .reason-target{
      display:flex!important;flex:1 1 100%!important;align-items:center!important;
      justify-content:flex-end!important;text-align:right!important;
      width:100%!important;min-width:0!important;margin:0 0 0 auto!important;
      white-space:nowrap!important;
    }
    #counterPage .rn-counter-role-column .reason-target .reason-vs,
    #counterPage .rn-counter-role-column .reason-target .rn-counter-vs-avatar,
    #counterPage .rn-counter-role-column .reason-target .rn-counter-vs-name{
      flex:0 0 auto!important;
    }
    #counterPage .rn-counter-role-column .reason-target .rn-counter-vs-name{
      text-align:right!important;white-space:nowrap!important;
    }
`;
  document.head.appendChild(style);

  function installCounterControls() {
    document.querySelectorAll('#counterPage .counter-post').forEach(card => {
      const body = card.querySelector(':scope > .counter-card-body');
      const meta = card.querySelector('.rn-post-header-copy .rn-counter-header-meta');
      if (!body || !meta || !meta.querySelector('.rn-post-points')) return;
      const extra = body.querySelector('.rn-counter-more-matchups');
      if (extra) {
        const reasonList = extra.querySelector(':scope > .reason-list');
        if (reasonList) extra.replaceWith(reasonList);
        else extra.remove();
      }
      let button = meta.querySelector(':scope > .rn-counter-collapse-control');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rn-counter-collapse-control';
        meta.appendChild(button);
      }
      const hidden = card.dataset.rnCounterMatchupsHidden === 'true';
      if (body.hidden !== hidden) body.hidden = hidden;
      const label = hidden ? 'SHOW' : 'HIDE';
      if (button.textContent !== label) button.textContent = label;
      const expanded = String(!hidden);
      if (button.getAttribute('aria-expanded') !== expanded) button.setAttribute('aria-expanded', expanded);
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
      const attribution = description.querySelector('.rn-post-community-attribution');
      if (attribution && !editRow.contains(attribution)) editRow.prepend(attribution);
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
      if (list.hidden !== hidden) list.hidden = hidden;
      const label = hidden ? 'SHOW' : 'HIDE';
      if (button.textContent !== label) button.textContent = label;
      const expanded = String(!hidden);
      if (button.getAttribute('aria-expanded') !== expanded) button.setAttribute('aria-expanded', expanded);
      button.title = hidden ? 'Show teammate synergy details' : 'Hide teammate synergy details while keeping the suggested hero and total points visible';
    });
  }


  // The bulk setting is the default for newly rendered cards. Per-card overrides
  // are stored on each card, so individual Show/Hide continues to work after a bulk action.
  let counterBulkDefaultHidden = false;
  let synergyBulkDefaultHidden = false;
  const counterCardOverrides = new Map();
  const synergyCardOverrides = new Map();

  function installGlobalHideAllControls() {
    const counterHeading = document.querySelector('#counterPage .result-scroll .section-title');
    if (counterHeading) {
      let actions = counterHeading.querySelector(':scope > div');
      if (!actions) {
        actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.alignItems = 'center';
        actions.style.gap = '5px';
        counterHeading.appendChild(actions);
      }
      let button = actions.querySelector(':scope > .rn-counter-hide-all');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rn-counter-hide-all';
        actions.appendChild(button);
      }

      const cards = [...document.querySelectorAll('#counterPage .counter-post')];
      cards.forEach(card => {
        const body = card.querySelector(':scope > .counter-card-body');
        if (!body) return;
        if (card.dataset.rnCounterBulkInitialized !== 'true') {
          card.dataset.rnCounterBulkInitialized = 'true';
          const key = card.dataset.counterSuggestion || '';
          const initial = key && counterCardOverrides.has(key) ? counterCardOverrides.get(key) : counterBulkDefaultHidden;
          card.dataset.rnCounterMatchupsHidden = String(initial);
        }
        const hidden = card.dataset.rnCounterMatchupsHidden === 'true';
        if (body.hidden !== hidden) body.hidden = hidden;
        const individual = card.querySelector('.rn-counter-collapse-control');
        if (individual) {
          const label = hidden ? 'SHOW' : 'HIDE';
          if (individual.textContent !== label) individual.textContent = label;
          individual.setAttribute('aria-expanded', String(!hidden));
        }
      });

      const allHidden = cards.length > 0 && cards.every(card =>
        card.querySelector(':scope > .counter-card-body')?.hidden === true
      );
      const label = allHidden ? 'SHOW ALL' : 'HIDE ALL';
      if (button.textContent !== label) button.textContent = label;
      button.title = allHidden ? 'Show all Counterpicker details' : 'Hide all Counterpicker details';
      button.setAttribute('aria-expanded', String(!allHidden));
    }

    const synergyActions = document.querySelector('#synergiesPage #synergyAddMount')
      || document.querySelector('#synergiesPage .rn-synergy-content-toolbar-actions');
    if (synergyActions) {
      let button = synergyActions.querySelector(':scope > .rn-synergy-hide-all');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rn-synergy-hide-all';
        synergyActions.appendChild(button);
      }

      const cards = [...document.querySelectorAll('#synergiesPage .rn-synergy-suggestion-post')];
      cards.forEach(card => {
        const list = card.querySelector(':scope > .rn-synergy-team-list');
        if (!list) return;
        if (card.dataset.rnSynergyBulkInitialized !== 'true') {
          card.dataset.rnSynergyBulkInitialized = 'true';
          const key = card.dataset.suggestionHero || '';
          const initial = key && synergyCardOverrides.has(key) ? synergyCardOverrides.get(key) : synergyBulkDefaultHidden;
          card.dataset.rnSynergyDetailsHidden = String(initial);
        }
        const hidden = card.dataset.rnSynergyDetailsHidden === 'true';
        if (list.hidden !== hidden) list.hidden = hidden;
        const individual = card.querySelector(':scope > .rn-synergy-suggestion-header .rn-synergy-collapse-control');
        if (individual) {
          const label = hidden ? 'SHOW' : 'HIDE';
          if (individual.textContent !== label) individual.textContent = label;
          individual.setAttribute('aria-expanded', String(!hidden));
        }
      });

      const allHidden = cards.length > 0 && cards.every(card =>
        card.querySelector(':scope > .rn-synergy-team-list')?.hidden === true
      );
      const label = allHidden ? 'SHOW ALL' : 'HIDE ALL';
      if (button.textContent !== label) button.textContent = label;
      button.title = allHidden ? 'Show all synergy suggestions' : 'Hide all synergy suggestions';
      button.setAttribute('aria-expanded', String(!allHidden));
    }
  }

  function install() {
    installCounterControls();
    installSynergyEntries();
    installSynergyControls();
    installGlobalHideAllControls();
  }
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    // The condensed Synergy DOM re-parents EDIT buttons. Route them here rather than
    // relying on the old listener attached to the pre-condensed result element.
    const editCombo = target.closest('#synergiesPage [data-edit-combo]');
    const editRule = target.closest('#synergiesPage [data-edit-combo-rule]');
    if (editCombo || editRule) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const appState = (() => {
        try { if (typeof state !== 'undefined') return state; } catch (_) {}
        return window.state || null;
      })();
      if (!appState) return;
      if (editRule) {
        const rule = (appState.comboRules || []).find(item => item.id === editRule.dataset.editComboRule);
        if (!rule) return;
        appState.returnToGroupManager = true;
        appState.rnGroupRuleMode = 'synergy';
        window.switchPage?.('groupsPage');
        window.openComboRuleEditor?.(rule);
      } else {
        const combo = (appState.combos || []).find(item => item.id === editCombo.dataset.editCombo);
        if (!combo) return;
        appState.rnGroupRuleMode = '';
        appState.returnToGroupManager = false;
        window.switchPage?.('synergiesPage');
        window.openComboEditor?.(combo);
      }
      return;
    }

    const counterAll = target.closest('#counterPage .rn-counter-hide-all');
    if (counterAll) {
      const cards = [...document.querySelectorAll('#counterPage .counter-post')];
      if (!cards.length) return;
      const allHidden = cards.every(card => card.querySelector(':scope > .counter-card-body')?.hidden === true);
      counterBulkDefaultHidden = !allHidden;
      counterCardOverrides.clear();
      cards.forEach(card => {
        const body = card.querySelector(':scope > .counter-card-body');
        if (!body) return;
        card.dataset.rnCounterBulkInitialized = 'true';
        card.dataset.rnCounterMatchupsHidden = String(counterBulkDefaultHidden);
        body.hidden = counterBulkDefaultHidden;
        const individual = card.querySelector('.rn-counter-collapse-control');
        if (individual) {
          individual.textContent = counterBulkDefaultHidden ? 'SHOW' : 'HIDE';
          individual.setAttribute('aria-expanded', String(!counterBulkDefaultHidden));
        }
      });
      installGlobalHideAllControls();
      return;
    }

    const synergyAll = target.closest('#synergiesPage .rn-synergy-hide-all');
    if (synergyAll) {
      const cards = [...document.querySelectorAll('#synergiesPage .rn-synergy-suggestion-post')];
      if (!cards.length) return;
      const allHidden = cards.every(card => card.querySelector(':scope > .rn-synergy-team-list')?.hidden === true);
      synergyBulkDefaultHidden = !allHidden;
      synergyCardOverrides.clear();
      cards.forEach(card => {
        const list = card.querySelector(':scope > .rn-synergy-team-list');
        if (!list) return;
        card.dataset.rnSynergyBulkInitialized = 'true';
        card.dataset.rnSynergyDetailsHidden = String(synergyBulkDefaultHidden);
        list.hidden = synergyBulkDefaultHidden;
        const individual = card.querySelector(':scope > .rn-synergy-suggestion-header .rn-synergy-collapse-control');
        if (individual) {
          individual.textContent = synergyBulkDefaultHidden ? 'SHOW' : 'HIDE';
          individual.setAttribute('aria-expanded', String(!synergyBulkDefaultHidden));
        }
      });
      installGlobalHideAllControls();
      return;
    }

    const counter = target.closest('#counterPage .rn-counter-collapse-control');
    if (counter) {
      const card = counter.closest('.counter-post');
      const body = card?.querySelector(':scope > .counter-card-body');
      if (!card || !body) return;
      const hidden = !body.hidden;
      body.hidden = hidden;
      card.dataset.rnCounterBulkInitialized = 'true';
      card.dataset.rnCounterMatchupsHidden = String(hidden);
      const key = card.dataset.counterSuggestion || '';
      if (key) counterCardOverrides.set(key, hidden);
      counter.textContent = hidden ? 'SHOW' : 'HIDE';
      counter.setAttribute('aria-expanded', String(!hidden));
      installGlobalHideAllControls();
      return;
    }

    const synergy = target.closest('#synergiesPage .rn-synergy-collapse-control');
    if (synergy) {
      const card = synergy.closest('.rn-synergy-suggestion-post');
      const list = card?.querySelector(':scope > .rn-synergy-team-list');
      if (!card || !list) return;
      const hidden = !list.hidden;
      list.hidden = hidden;
      card.dataset.rnSynergyBulkInitialized = 'true';
      card.dataset.rnSynergyDetailsHidden = String(hidden);
      const key = card.dataset.suggestionHero || '';
      if (key) synergyCardOverrides.set(key, hidden);
      synergy.textContent = hidden ? 'SHOW' : 'HIDE';
      synergy.setAttribute('aria-expanded', String(!hidden));
      installGlobalHideAllControls();
    }
  }, true);

  function start() {
    install();
    if (!document.body || document.body.dataset.rnV1359Observer) return;
    document.body.dataset.rnV1359Observer = '1';
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
