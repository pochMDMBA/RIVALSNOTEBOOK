/* RIVALSNOTEBOOK v13.38 pairing validation and submission attribution. */
(() => {
  'use strict';
  if (window.__rnV1338RulesLoaded) return;
  window.__rnV1338RulesLoaded = true;

  const DEV_NAME = 'Developer';
  const DEV_EMAIL = 'pocholoansay@gmail.com';
  const $ = id => document.getElementById(id);
  const getState = () => {
    try { if (typeof state !== 'undefined') return state; } catch (_) {}
    return window.state || null;
  };
  const toast = message => {
    if (typeof window.toast === 'function') window.toast(message);
    else console.info('[RIVALSNOTEBOOK]', message);
  };

  function groupMode(kind) {
    const s = getState();
    return !!(s && s.activePage === 'groupsPage' && s.rnGroupRuleMode === kind);
  }

  function routeNormalSynergy() {
    const s = getState();
    if (!s) return;
    s.activePage = 'synergiesPage';
    s.rnGroupRuleMode = '';
    s.returnToGroupManager = false;
    s.editingComboRule = null;
    window.syncComboForm?.();
  }
  function routeNormalCounter() {
    const s = getState();
    if (!s) return;
    s.activePage = 'counterPage';
    s.rnGroupRuleMode = '';
    s.returnToGroupManager = false;
    s.editingCounterRule = null;
    window.syncCounterForm?.();
  }

  function installEditorContext() {
    const wrap = (name, before, after) => {
      const original = window[name];
      if (typeof original !== 'function' || original.__rnV1338Wrapped) return;
      const wrapped = function(...args) {
        before?.apply(this,args);
        const result = original.apply(this,args);
        after?.apply(this,args);
        return result;
      };
      wrapped.__rnV1338Wrapped = true;
      window[name] = wrapped;
    };

    wrap('openComboEditor', routeNormalSynergy, () => window.syncComboForm?.());
    wrap('openCounterEditor', routeNormalCounter, () => window.syncCounterForm?.());

    wrap('openComboRuleEditor', () => {
      const s=getState(); if(!s)return;
      s.activePage='groupsPage';
      s.rnGroupRuleMode='synergy';
      s.returnToGroupManager=true;
    }, () => window.syncComboForm?.());

    wrap('openGroupRuleEditor', () => {
      const s=getState(); if(!s)return;
      s.activePage='groupsPage';
      s.rnGroupRuleMode='counter';
      s.returnToGroupManager=true;
    }, () => window.syncCounterForm?.());

    wrap('openIndividualFromGroup', () => {
      const s=getState(); if(!s)return;
      s.rnGroupRuleMode='';
      s.returnToGroupManager=false;
      s.editingCounterRule=null;
    }, () => window.syncCounterForm?.());
  }

  function installFormPairingValidation() {
    if (document.documentElement.dataset.rnV1338FormValidation) return;
    document.documentElement.dataset.rnV1338FormValidation='1';

    document.addEventListener('submit', event => {
      const form=event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const s=getState();
      if (!s) return;

      if (form.id==='comboForm') {
        const isGroup=groupMode('synergy');
        if (isGroup) {
          const source=$('comboSourceType')?.value;
          const target=$('comboTargetType')?.value;
          if (source!=='group' && target!=='group') {
            event.preventDefault(); event.stopImmediatePropagation();
            toast('Group Synergy Rules require a Hero Group on at least one side.');
            return;
          }
          s.editingComboRule = s.editingComboRule || null;
        } else {
          if (s.editingComboRule) {
            event.preventDefault(); event.stopImmediatePropagation();
            toast('Edit Group Synergy Rules from the Groups tab.');
            return;
          }
          s.rnGroupRuleMode='';
          s.returnToGroupManager=false;
          $('comboSourceType').value='hero';
          $('comboTargetType').value='hero';
          window.syncComboForm?.();
        }
      }

      if (form.id==='counterForm') {
        const isGroup=groupMode('counter');
        if (isGroup) {
          const source=$('counterSourceType')?.value;
          const target=$('counterTargetType')?.value;
          if (source!=='group' && target!=='group') {
            event.preventDefault(); event.stopImmediatePropagation();
            toast('Group Counters require a Hero Group on at least one side. Use Group : Hero, Hero : Group or Group : Group.');
            return;
          }
        } else {
          if (s.editingCounterRule) {
            event.preventDefault(); event.stopImmediatePropagation();
            toast('Edit Group Counters from the Groups tab.');
            return;
          }
          s.rnGroupRuleMode='';
          s.returnToGroupManager=false;
          $('counterSourceType').value='hero';
          $('counterTargetType').value='hero';
          window.syncCounterForm?.();
        }
      }
    },true);

    // Editing a generated group-synergy pair opens the Group tab editor,
    // never the regular one-to-one Synergies form.
    document.addEventListener('click',event=>{
      const edit=event.target instanceof Element ? event.target.closest('[data-edit-combo-rule]') : null;
      if (!edit) return;
      const s=getState(); if(!s)return;
      s.returnToGroupManager=true;
      s.rnGroupRuleMode='synergy';
      if (typeof window.switchPage==='function') window.switchPage('groupsPage');
      else s.activePage='groupsPage';
    },true);
  }

  function markDeveloper(record) {
    if (!record || typeof record!=='object') return false;
    let changed=false;
    if (record.submittedByName!==DEV_NAME) { record.submittedByName=DEV_NAME; changed=true; }
    if (record.submittedByEmail!==DEV_EMAIL) { record.submittedByEmail=DEV_EMAIL; changed=true; }
    return changed;
  }

  function looksUserSubmitted(record, kind) {
    if (!record) return false;
    const id=String(record.id||'');
    const source=String(record.source||'');
    if (record.submittedByEmail===DEV_EMAIL || record.submittedByName===DEV_NAME) return true;
    if (kind==='group' || kind==='groupRule' || kind==='groupSynergy') return true;
    if (kind==='counter') return /^(tip-|override-|tip-migrated-)/.test(id) ||
      /^(Community edited|Individual override|Community tip)$/i.test(source);
    if (kind==='synergy') return /^(combo-|combo-migrated-)/.test(id) ||
      /Community edited|Community synergy|Official Team-Up · user entry/i.test(source);
    return false;
  }

  function stampDeveloperRecords() {
    const s=getState();
    if (!s) return false;
    let changed=false;
    (s.groups||[]).forEach(record=>{ if(looksUserSubmitted(record,'group'))changed=markDeveloper(record)||changed; });
    (s.groupRules||[]).forEach(record=>{ if(looksUserSubmitted(record,'groupRule'))changed=markDeveloper(record)||changed; });
    (s.comboRules||[]).forEach(record=>{ if(looksUserSubmitted(record,'groupSynergy'))changed=markDeveloper(record)||changed; });
    (s.counterTips||[]).forEach(record=>{ if(looksUserSubmitted(record,'counter'))changed=markDeveloper(record)||changed; });
    (s.combos||[]).forEach(record=>{ if(looksUserSubmitted(record,'synergy'))changed=markDeveloper(record)||changed; });
    return changed;
  }

  function developerSubmission(record, kind) {
    return looksUserSubmitted(record,kind);
  }

  function appendAttribution(parent) {
    if (!parent || parent.querySelector(':scope > .rn-submitted-by')) return;
    const label=document.createElement('div');
    label.className='rn-submitted-by';
    label.textContent='Submitted by - Developer';
    parent.appendChild(label);
  }

  function decorateCardHtml(html, selector, record, kind, insertBeforeSelector) {
    if (!developerSubmission(record,kind)) return html;
    const template=document.createElement('template');
    template.innerHTML=String(html||'').trim();
    const card=template.content.querySelector(selector);
    if (!card) return html;
    if (card.querySelector('.rn-submitted-by')) return template.innerHTML;
    const label=document.createElement('div');
    label.className='rn-submitted-by';
    label.textContent='Submitted by - Developer';
    const target=insertBeforeSelector ? card.querySelector(insertBeforeSelector) : null;
    if (target) target.insertAdjacentElement('beforebegin',label);
    else card.appendChild(label);
    return template.innerHTML;
  }

  function wrapCardRenderer(name, selector, type, kind, insertBeforeSelector, parentResolver) {
    const original=window[name];
    if (typeof original!=='function' || original.__rnV1338Author) return;
    const wrapped=function(item) {
      stampDeveloperRecords();
      let record=item;
      if (item?.generated && typeof parentResolver==='function') record=parentResolver(item)||item;
      const html=original.apply(this,arguments);
      return decorateCardHtml(html,selector,record,kind,insertBeforeSelector);
    };
    wrapped.__rnV1338Author=true;
    window[name]=wrapped;
  }

  function installSubmissionAttribution() {
    const s=getState();
    if (s) {
      // These collections contain user-created objects, not the bundled Reddit /
      // official reference rows. Older user-created IDs are backfilled as Developer.
      stampDeveloperRecords();
    }

    const originalPersist=window.persist;
    if (typeof originalPersist==='function' && !originalPersist.__rnV1338Author) {
      const wrapped=function(...args) {
        stampDeveloperRecords();
        return originalPersist.apply(this,args);
      };
      wrapped.__rnV1338Author=true;
      window.persist=wrapped;
    }

    ['comboForm','counterForm','groupForm'].forEach(id=>{
      const form=$(id);
      if (!form || form.dataset.rnV1338Author) return;
      form.dataset.rnV1338Author='1';
      form.addEventListener('submit',()=>{
        window.setTimeout(()=>{
          if (stampDeveloperRecords()) window.persist?.();
        },0);
      });
    });

    window.addEventListener('rn-account-state-changed',()=>{
      window.setTimeout(()=>{
        if (stampDeveloperRecords()) window.persist?.();
      },0);
    });

    wrapCardRenderer('reasonHtml','.reason','counter','counter','.reason-text',item=>{
      const s=getState();
      return item?.generated ? (s?.groupRules||[]).find(x=>x.id===item.groupRuleId) : item;
    });
    wrapCardRenderer('comboCardHtml','.combo-card','synergy','synergy','.combo-foot',item=>{
      const s=getState();
      return item?.generated ? (s?.comboRules||[]).find(x=>x.id===item.ruleId) : item;
    });

    const originalGroupManager=window.renderGroupManager;
    if (typeof originalGroupManager==='function' && !originalGroupManager.__rnV1338Author) {
      const wrapped=function(...args) {
        stampDeveloperRecords();
        const result=originalGroupManager.apply(this,args);
        const s=getState();
        document.querySelectorAll('#groupManagerList .group-manage-card[data-drop-group]').forEach(card=>{
          const group=(s?.groups||[]).find(x=>String(x.id)===card.dataset.dropGroup);
          if (developerSubmission(group,'group')) appendAttribution(card);
        });
        document.querySelectorAll('#groupRulesManagerList .group-rule-card').forEach(card=>{
          const button=card.querySelector('[data-edit-group-rule]');
          const rule=(s?.groupRules||[]).find(x=>String(x.id)===button?.dataset.editGroupRule);
          if (developerSubmission(rule,'groupRule')) appendAttribution(card);
        });
        return result;
      };
      wrapped.__rnV1338Author=true;
      window.renderGroupManager=wrapped;
    }

    const originalSynergyRules=window.renderGroupSynergyRules;
    if (typeof originalSynergyRules==='function' && !originalSynergyRules.__rnV1338Author) {
      const wrapped=function(...args) {
        stampDeveloperRecords();
        const result=originalSynergyRules.apply(this,args);
        const s=getState();
        document.querySelectorAll('#groupSynergyRulesManagerList .group-rule-card').forEach(card=>{
          const button=card.querySelector('[data-edit-group-synergy]');
          const rule=(s?.comboRules||[]).find(x=>String(x.id)===button?.dataset.editGroupSynergy);
          if (developerSubmission(rule,'groupSynergy')) appendAttribution(card);
        });
        return result;
      };
      wrapped.__rnV1338Author=true;
      window.renderGroupSynergyRules=wrapped;
    }
  }

  function migrateAccidentalHeroOnlyGroupRules() {
    const s=getState();
    if (!s) return false;
    let changed=false;

    const keepSynergy=[];
    (s.comboRules||[]).forEach(rule=>{
      if (rule.sourceType==='hero' && rule.targetType==='hero') {
        const a=rule.sourceValue,b=rule.targetValue;
        const existing=(s.combos||[]).find(item=>
          (item.a===a&&item.b===b)||(item.a===b&&item.b===a)
        );
        if (!existing) {
          const pair=[a,b].sort((x,y)=>String(x).localeCompare(String(y))).join('|||');
          const converted={
            id:`combo-migrated-${rule.id}`,a,b,reason:rule.reason||'',
            official:!!rule.official,votes:Number(rule.votesByPair?.[pair])||0,
            myVote:!!rule.myVotesByPair?.[pair],source:'Community synergy',
            sourceUrl:rule.sourceUrl||'',icon:rule.icon||'sparkles',
            pocketPlayId:rule.pocketPlayId||'',submittedByName:DEV_NAME,
            submittedByEmail:DEV_EMAIL
          };
          (s.combos||=[]).push(converted);
        } else markDeveloper(existing);
        changed=true;
      } else keepSynergy.push(rule);
    });
    if (s.comboRules) s.comboRules=keepSynergy;

    const keepCounters=[];
    (s.groupRules||[]).forEach(rule=>{
      if (rule.sourceType==='hero' && rule.targetType==='hero') {
        const heroName=rule.sourceValue,against=rule.targetValue;
        const existing=(s.counterTips||[]).find(item=>item.hero===heroName&&item.against===against);
        if (!existing) {
          const pair=`${heroName}|||${against}`;
          (s.counterTips||=[]).push({
            id:`tip-migrated-${rule.id}`,hero:heroName,against,
            tier:rule.tier||'moderate',reason:rule.reason||'',
            votes:Number(rule.votesByPair?.[pair])||0,
            myVote:!!rule.myVotesByPair?.[pair],
            source:'Community tip',sourceUrl:'',
            pocketPlayId:rule.pocketPlayId||'',
            submittedByName:DEV_NAME,submittedByEmail:DEV_EMAIL
          });
        } else markDeveloper(existing);
        changed=true;
      } else keepCounters.push(rule);
    });
    if (s.groupRules) s.groupRules=keepCounters;

    if (changed) {
      stampDeveloperRecords();
      window.persist?.();
      window.renderGroupManager?.();
      window.renderComboResults?.();
      window.renderCounterResults?.();
    }
    return changed;
  }

  function hideSupabaseProjectSetup() {
    if ($('rn-v1338-hide-supabase-style')) return;
    const style=document.createElement('style');
    style.id='rn-v1338-hide-supabase-style';
    style.textContent=`
      #rnConfigDetails,
      #rnConfigDetails *,
      #rnSaveConfigBtn{display:none!important;visibility:hidden!important}
      .rn-submitted-by{
        margin-top:5px;color:#96a8b9;font-size:8px;font-weight:750;
        letter-spacing:.015em;line-height:1.3;text-transform:none;
      }
    `;
    document.head.appendChild(style);
  }

  function installRenderLifecycle() {
    const original=window.render;
    if (typeof original!=='function' || original.__rnV1338Lifecycle) return;
    const wrapped=function(...args) {
      migrateAccidentalHeroOnlyGroupRules();
      stampDeveloperRecords();
      return original.apply(this,args);
    };
    wrapped.__rnV1338Lifecycle=true;
    window.render=wrapped;
  }

  function install() {
    hideSupabaseProjectSetup();
    installEditorContext();
    installFormPairingValidation();
    installSubmissionAttribution();
    installRenderLifecycle();
    migrateAccidentalHeroOnlyGroupRules();
    stampDeveloperRecords();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
