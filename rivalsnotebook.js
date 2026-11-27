/* RIVALSNOTEBOOK cloud, community and collaboration layer.
 * Browser uses only the Supabase publishable/anon key. Database security is enforced by RLS.
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const CLIENT_ID = (crypto.randomUUID ? crypto.randomUUID() : `rn-${Date.now()}-${Math.random()}`);
  const LOCAL_CONFIG_KEY = 'rivalsnotebook-supabase-config';
  const pendingImportKey = (userId) => `rivalsnotebook-pending-import:${userId}`;
  const GROUP_VOTE_REFRESH_MS = 1000;

  let sb = null;
  let currentUser = null;
  let authSubscription = null;
  let workspaceTimer = null;
  let notebookTimer = null;
  let applyingRemote = false;
  let activeNotebook = null;
  let notebookChannel = null;
  let voteChannel = null;
  let groupChannel = null;
  let knownVotes = new Map();
  let myVotes = new Set();
  let myVoteDirections = new Map();
  let communityGroups = [];
  let myCommunityGroupVotes = new Set();
  let groupView = 'mine';
  let remoteUpdatePending = false;
  let previousSessionUserId = null;
  let pendingLocalImport = null;
  let supabaseSdkLoadPromise = null;

  // Cloud features are optional at startup. Load the Supabase UMD SDK asynchronously so a
  // slow or blocked CDN never prevents the local Counterpicker / Synergies / Playbook UI from rendering.
  function ensureSupabaseSdk() {
    if (window.supabase?.createClient) return Promise.resolve(true);
    if (supabaseSdkLoadPromise) return supabaseSdkLoadPromise;
    supabaseSdkLoadPromise = new Promise(resolve => {
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        supabaseSdkLoadPromise = null;
        resolve(!!ok && !!window.supabase?.createClient);
      };
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      const timer = setTimeout(() => finish(false), 8000);
      document.head.appendChild(script);
    });
    return supabaseSdkLoadPromise;
  }

  const getConfig = () => {
    let local = {};
    try { local = JSON.parse(localStorage.getItem(LOCAL_CONFIG_KEY) || '{}'); } catch (_) {}
    const fileConfig = window.RIVALSNOTEBOOK_CONFIG || {};
    return {
      supabaseUrl: String(local.supabaseUrl || fileConfig.supabaseUrl || '').trim(),
      supabaseAnonKey: String(local.supabaseAnonKey || fileConfig.supabaseAnonKey || '').trim()
    };
  };
  const hasConfig = () => {
    const c = getConfig();
    return /^https:\/\/.+/.test(c.supabaseUrl) && !!c.supabaseAnonKey;
  };
  const message = (text, good = false) => {
    const el = $('rnAuthMessage');
    if (el) { el.textContent = text || ''; el.style.color = good ? '#8fe0c7' : '#f0d47c'; }
  };
  const showModal = (id) => $(id)?.classList.add('open');
  const hideModal = (id) => $(id)?.classList.remove('open');
  const makeId = (prefix = 'rn') => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const safeClone = (value) => JSON.parse(JSON.stringify(value ?? null));
  function databaseErrorHelp(error) {
    const raw = String(error?.message || error || 'Unknown database error');
    const missingTable = error?.code === 'PGRST205' || /could not find the table .*schema cache/i.test(raw);
    if (!missingTable) return raw;
    return `${raw}\n\nDATABASE SETUP REQUIRED\n1. Confirm config.js points to the same Supabase project where you will run the SQL.\n2. In that project's SQL Editor, run the entire supabase/schema.sql file from this package.\n3. In Integrations → Data API → Settings, make sure public is listed under Exposed schemas (older dashboards may show Project Settings → Data API). If an Exposed tables list is shown, make sure notebooks and community_groups are enabled.\n4. Run supabase/verify_schema.sql, then run NOTIFY pgrst, 'reload schema'; if the error remains.\n5. Confirm public.notebooks and public.community_groups both exist before retrying.`;
  }

  function installModals() {
    if (!$('rnAuthModal')) {
      const auth = document.createElement('div');
      auth.className = 'rn-modal-layer'; auth.id = 'rnAuthModal';
      auth.innerHTML = `
        <section class="rn-modal" role="dialog" aria-modal="true" aria-labelledby="rnAuthTitle">
          <div class="rn-modal-head"><h2 id="rnAuthTitle">YOUR RIVALSNOTEBOOK ACCOUNT</h2><button class="rn-modal-close" type="button" data-rn-close="rnAuthModal" aria-label="Close">×</button></div>
          <p class="rn-modal-copy">Sign in to sync your private workspace, vote in the community, publish hero groups, and collaborate on shared tactical notebooks.</p>
          <div class="rn-field"><label for="rnEmail">EMAIL</label><input id="rnEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>
          <div class="rn-field"><label for="rnPassword">PASSWORD</label><input id="rnPassword" type="password" autocomplete="current-password" placeholder="At least 8 characters"></div>
          <div class="rn-modal-actions"><button class="btn primary" type="button" id="rnSignInBtn">SIGN IN</button><button class="btn" type="button" id="rnSignUpBtn">CREATE ACCOUNT</button></div>
          <div class="rn-modal-actions"><button class="btn danger hidden" type="button" id="rnSignOutBtn">SIGN OUT</button><button class="btn hidden" type="button" id="rnImportLocalBtn">IMPORT THIS DEVICE'S LOCAL DATA</button></div>
          <div class="rn-modal-message" id="rnAuthMessage" role="status" aria-live="polite"></div>
          <details class="rn-config-box" id="rnConfigDetails">
            <summary>CONNECT SUPABASE PROJECT</summary>
            <p class="rn-modal-copy" style="margin-top:8px">Paste your Supabase Project URL and publishable key (or legacy anon key). Never paste a service-role key here.</p>
            <div class="rn-field"><label for="rnSupabaseUrl">PROJECT URL</label><input id="rnSupabaseUrl" type="url" placeholder="https://your-project.supabase.co"></div>
            <div class="rn-field"><label for="rnSupabaseKey">PUBLISHABLE / ANON KEY</label><input id="rnSupabaseKey" type="password" autocomplete="off" placeholder="sb_publishable_… or eyJ…"></div>
            <div class="rn-modal-actions"><button class="btn primary" type="button" id="rnSaveConfigBtn">SAVE CONNECTION</button></div>
          </details>
        </section>`;
      document.body.appendChild(auth);
    }
    if (!$('rnShareModal')) {
      const share = document.createElement('div');
      share.className = 'rn-modal-layer'; share.id = 'rnShareModal';
      share.innerHTML = `
        <section class="rn-modal" role="dialog" aria-modal="true" aria-labelledby="rnShareTitle">
          <div class="rn-modal-head"><h2 id="rnShareTitle">LIVE COLLABORATIVE NOTEBOOK</h2><button class="rn-modal-close" type="button" data-rn-close="rnShareModal" aria-label="Close">×</button></div>
          <p class="rn-modal-copy">Create a private invitation link. Anyone you share it with can sign in, join this notebook, and edit the tactical board. Changes are synced live through Supabase Realtime.</p>
          <div class="rn-modal-actions"><button class="btn primary" type="button" id="rnCreateShareBtn">CREATE SHARE LINK</button><button class="btn" type="button" id="rnCopyShareBtn" disabled>COPY LINK</button></div>
          <div class="rn-field" style="margin-top:10px"><label for="rnShareUrl">INVITATION LINK</label><input id="rnShareUrl" type="text" readonly placeholder="Create a link to begin…"></div>
          <div class="rn-share-note" id="rnShareMessage">Your private My Groups and account data stay private. This shared notebook contains the current Playbook name and whiteboard objects.</div>
        </section>`;
      document.body.appendChild(share);
    }
    document.querySelectorAll('[data-rn-close]').forEach(btn => btn.addEventListener('click', () => hideModal(btn.dataset.rnClose)));
    document.querySelectorAll('.rn-modal-layer').forEach(layer => layer.addEventListener('click', e => { if (e.target === layer) layer.classList.remove('open'); }));
    $('rnAuthBtn')?.addEventListener('click', () => { refreshAuthModal(); showModal('rnAuthModal'); });
    $('rnShareBtn')?.addEventListener('click', () => {
      if (!currentUser) { showModal('rnAuthModal'); message('Sign in first to create or join a shared notebook.'); return; }
      const url = $('rnShareUrl');
      if (activeNotebook?.token && url) { url.value = shareUrl(activeNotebook.token); $('rnCopyShareBtn').disabled = false; }
      showModal('rnShareModal');
    });
    $('rnSignInBtn')?.addEventListener('click', signIn);
    $('rnSignUpBtn')?.addEventListener('click', signUp);
    $('rnSignOutBtn')?.addEventListener('click', signOut);
    $('rnImportLocalBtn')?.addEventListener('click', importLocalWorkspace);
    $('rnSaveConfigBtn')?.addEventListener('click', saveConfigFromModal);
    $('rnCreateShareBtn')?.addEventListener('click', createShareLink);
    $('rnCopyShareBtn')?.addEventListener('click', copyShareLink);
    $('rnPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') signIn(); });
    refreshAuthModal();
  }

  function refreshAuthModal() {
    const config = getConfig();
    if ($('rnSupabaseUrl') && !$('rnSupabaseUrl').value) $('rnSupabaseUrl').value = config.supabaseUrl;
    if ($('rnSupabaseKey') && !$('rnSupabaseKey').value) $('rnSupabaseKey').value = config.supabaseAnonKey;
    $('rnSignOutBtn')?.classList.toggle('hidden', !currentUser);
    $('rnImportLocalBtn')?.classList.toggle('hidden', !currentUser || !pendingLocalImport);
    $('rnSignInBtn')?.classList.toggle('hidden', !!currentUser);
    $('rnSignUpBtn')?.classList.toggle('hidden', !!currentUser);
    $('rnEmail')?.toggleAttribute('disabled', !!currentUser);
    $('rnPassword')?.toggleAttribute('disabled', !!currentUser);
    if ($('rnEmail') && currentUser) $('rnEmail').value = currentUser.email || '';
    const details = $('rnConfigDetails');
    if (details) details.open = !hasConfig();
    if (!hasConfig()) message('Supabase is not connected yet. Add your project URL and publishable/anon key below.');
    else if (!currentUser) message('Sign in or create an account to enable cross-device sync and community voting.');
    else message(`Signed in as ${currentUser.email || 'RivalsNotebook member'}.`, true);
  }

  function saveConfigFromModal() {
    const supabaseUrl = String($('rnSupabaseUrl')?.value || '').trim().replace(/\/$/, '');
    const supabaseAnonKey = String($('rnSupabaseKey')?.value || '').trim();
    if (!/^https:\/\/.+/.test(supabaseUrl) || !supabaseAnonKey) { message('Enter a valid HTTPS project URL and publishable/anon key.'); return; }
    if (/service_role/i.test(supabaseAnonKey)) { message('Do not use a service-role key in the browser. Use the publishable/anon key.'); return; }
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify({supabaseUrl, supabaseAnonKey}));
    message('Connection saved. Reloading the app to initialize Supabase…', true);
    setTimeout(() => location.reload(), 350);
  }

  async function initializeSupabase() {
    if (!hasConfig()) { setLiveStatus('BACKEND NOT CONFIGURED', ''); return false; }
    const sdkReady = await ensureSupabaseSdk();
    if (!sdkReady) {
      setLiveStatus('CLOUD SDK UNAVAILABLE', '');
      message('The local notebook is available, but the Supabase SDK could not be reached. Check your connection and refresh to retry cloud sync.');
      return false;
    }
    const config = getConfig();
    try {
      sb = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data: { session }, error } = await sb.auth.getSession();
      if (error) throw error;
      if (authSubscription) authSubscription.unsubscribe();
      const { data } = sb.auth.onAuthStateChange((_event, nextSession) => {
        // Defer database work outside Supabase's auth callback transaction.
        setTimeout(() => handleSession(nextSession).catch(err => console.warn('RIVALSNOTEBOOK auth sync:', err)), 0);
      });
      authSubscription = data.subscription;
      await handleSession(session);
      return true;
    } catch (err) {
      console.error('Supabase initialization failed:', err);
      setLiveStatus('CONNECTION ERROR', '');
      message(`Could not connect to Supabase: ${err.message || err}`);
      return false;
    }
  }

  function syncPlaybookAccountControls() {
    const status = $('rnPlaybookLiveStatus');
    if (status) {
      const main = $('rnLiveStatus');
      status.textContent = main?.textContent || (activeNotebook ? 'LIVE NOTEBOOK' : currentUser ? 'ACCOUNT SYNC' : 'LOCAL MODE');
      status.classList.toggle('connected', !!currentUser);
      status.classList.toggle('collab', !!activeNotebook);
    }
    const auth = $('rnPlaybookAuthBtn');
    if (auth) auth.textContent = currentUser ? String(currentUser.email || 'ACCOUNT').split('@')[0].slice(0, 12).toUpperCase() : 'SIGN IN';
  }
  function setLiveStatus(label, mode = '') {
    const el = $('rnLiveStatus');
    if (el) { el.textContent = label; el.classList.remove('connected', 'collab'); if (mode) el.classList.add(mode); }
    syncPlaybookAccountControls();
  }
  function updateAccountButton() {
    const button = $('rnAuthBtn');
    if (button) button.textContent = currentUser ? (String(currentUser.email || 'ACCOUNT').split('@')[0].slice(0, 15).toUpperCase()) : 'SIGN IN';
    if (!currentUser) setLiveStatus(hasConfig() ? 'PRIVATE WORKSPACE' : 'LOCAL WORKSPACE');
    else setLiveStatus('ACCOUNT SYNC ON', 'connected');
    syncPlaybookAccountControls();
  }

  function workspaceSnapshot() {
    return {
      schemaVersion: 1,
      enemy: safeClone(state.enemy || []), ally: safeClone(state.ally || []),
      counterTips: safeClone(state.counterTips || []), combos: safeClone(state.combos || []),
      groups: safeClone(state.groups || []), groupRules: safeClone(state.groupRules || []),
      comboRules: safeClone(state.comboRules || []), plays: safeClone(state.plays || []),
      activePlayId: state.activePlayId || null, playName: state.playName || 'Untitled Play',
      playItems: safeClone(state.playItems || []), pendingPocketLink: safeClone(state.pendingPocketLink || null)
    };
  }
  function notebookSnapshot() {
    return {
      schemaVersion: 1, clientId: CLIENT_ID, savedAt: new Date().toISOString(),
      playName: state.playName || 'Untitled Play',
      activePlayId: state.activePlayId || null,
      plays: safeClone(state.plays || []),
      playItems: safeClone(state.playItems || [])
    };
  }
  function applyWorkspaceSnapshot(data, shouldRender = true) {
    if (!data || typeof data !== 'object') return;
    applyingRemote = true;
    try {
      if (Array.isArray(data.enemy)) state.enemy = data.enemy.filter(n => HEROES.some(h => h.name === n));
      if (Array.isArray(data.ally)) state.ally = data.ally.filter(n => HEROES.some(h => h.name === n));
      if (Array.isArray(data.counterTips)) state.counterTips = window.rnMergeBuiltInRecords(DEFAULT_COUNTER_TIPS, data.counterTips, normalizeTips);
      if (Array.isArray(data.combos)) state.combos = window.rnMergeBuiltInRecords(DEFAULT_COMBOS, data.combos, normalizeCombos);
      if (Array.isArray(data.groups)) state.groups = normalizeGroups(data.groups);
      if (Array.isArray(data.groupRules)) state.groupRules = normalizeGroupRules(data.groupRules);
      if (Array.isArray(data.comboRules)) state.comboRules = normalizeComboRules(data.comboRules);
      if (Array.isArray(data.plays)) state.plays = normalizePlays(data.plays);
      if (Object.prototype.hasOwnProperty.call(data, 'activePlayId')) state.activePlayId = data.activePlayId || null;
      if (typeof data.playName === 'string') state.playName = data.playName.slice(0, 70) || 'Untitled Play';
      if (Array.isArray(data.playItems)) state.playItems = normalizePlayItems(data.playItems);
      if (data.pendingPocketLink && typeof data.pendingPocketLink === 'object') state.pendingPocketLink = data.pendingPocketLink;
      if (shouldRender) { render(); if (typeof renderPlaybook === 'function') renderPlaybook(); if (typeof renderGroupManager === 'function') renderGroupManager(); }
    } finally { applyingRemote = false; }
  }
  function hasLocalWorkspaceContent(snapshot = workspaceSnapshot()) {
    const builtTips = new Set(DEFAULT_COUNTER_TIPS.map(x => x.id));
    const builtCombos = new Set(DEFAULT_COMBOS.map(x => x.id));
    return !!((snapshot.groups || []).length || (snapshot.groupRules || []).length || (snapshot.comboRules || []).length ||
      (snapshot.plays || []).length || (snapshot.playItems || []).length || (snapshot.enemy || []).length || (snapshot.ally || []).length ||
      (snapshot.counterTips || []).some(x => !builtTips.has(x.id)) || (snapshot.combos || []).some(x => !builtCombos.has(x.id)));
  }
  function emptyWorkspaceSnapshot() {
    return {
      schemaVersion: 1, enemy: [], ally: [], counterTips: safeClone(DEFAULT_COUNTER_TIPS), combos: safeClone(DEFAULT_COMBOS),
      groups: [], groupRules: [], comboRules: [], plays: [], activePlayId: null, playName: 'Untitled Play', playItems: [], pendingPocketLink: null
    };
  }
  function readPendingLocalImport(userId) {
    try {
      const raw = localStorage.getItem(pendingImportKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) { return null; }
  }
  function storePendingLocalImport(userId, snapshot) {
    try { localStorage.setItem(pendingImportKey(userId), JSON.stringify(snapshot)); } catch (_) {}
  }
  function clearPendingLocalImport(userId) {
    try { localStorage.removeItem(pendingImportKey(userId)); } catch (_) {}
  }
  async function importLocalWorkspace() {
    if (!currentUser || !pendingLocalImport) return;
    if (!confirm('Import this browser data into your account? This will replace the current private workspace stored in that account.')) return;
    const local = pendingLocalImport;
    applyWorkspaceSnapshot(local);
    persist();
    await saveWorkspaceNow();
    clearPendingLocalImport(currentUser.id);
    pendingLocalImport = null;
    refreshAuthModal();
    message('This browser workspace has been imported into your account.', true);
    toast('Local workspace imported');
  }
  async function loadWorkspace() {
    if (!sb || !currentUser) return;
    const { data, error } = await sb.from('user_workspaces').select('data').eq('user_id', currentUser.id).maybeSingle();
    if (error) { console.warn('Workspace load:', error); setLiveStatus(error.code === 'PGRST205' ? 'DATABASE SETUP REQUIRED' : 'WORKSPACE LOAD ISSUE',''); message(databaseErrorHelp(error)); return; }
    const savedPendingImport = readPendingLocalImport(currentUser.id);
    if (data?.data && Object.keys(data.data).length) {
      pendingLocalImport = savedPendingImport;
      applyWorkspaceSnapshot(data.data);
    } else {
      // A new account starts with a clean private workspace. The user can explicitly
      // import local data after confirming that it belongs to them. Keep the pending
      // snapshot scoped to this account so it survives a refresh without leaking to others.
      const local = savedPendingImport || workspaceSnapshot();
      pendingLocalImport = hasLocalWorkspaceContent(local) ? local : null;
      if (pendingLocalImport) storePendingLocalImport(currentUser.id, pendingLocalImport);
      applyWorkspaceSnapshot(emptyWorkspaceSnapshot());
      applyingRemote = true;
      try { persist(); } finally { applyingRemote = false; }
      await saveWorkspaceNow();
    }
    refreshAuthModal();
    if (pendingLocalImport) message('Local data is available on this browser for this account. Import it only if it belongs to you.', true);
  }
  async function saveWorkspaceNow() {
    if (!sb || !currentUser || applyingRemote) return;
    const payload = { user_id: currentUser.id, data: workspaceSnapshot(), updated_at: new Date().toISOString() };
    const { error } = await sb.from('user_workspaces').upsert(payload, { onConflict: 'user_id' });
    if (error) { console.warn('Workspace save:', error); setLiveStatus(error.code === 'PGRST205' ? 'DATABASE SETUP REQUIRED' : 'SYNC ISSUE', ''); message(databaseErrorHelp(error)); }
  }
  function scheduleCloudSave() {
    if (!sb || !currentUser || applyingRemote) return;
    clearTimeout(workspaceTimer);
    workspaceTimer = setTimeout(() => saveWorkspaceNow().catch(err => console.warn(err)), 700);
    if (activeNotebook) {
      clearTimeout(notebookTimer);
      notebookTimer = setTimeout(() => saveNotebookNow().catch(err => console.warn(err)), 500);
    }
  }

  async function handleSession(session) {
    const nextUser = session?.user || null;
    const nextUserId = nextUser?.id || null;
    const accountChanged = !!previousSessionUserId && previousSessionUserId !== nextUserId;
    if (accountChanged || (!nextUserId && previousSessionUserId)) {
      pendingLocalImport = null;
      applyWorkspaceSnapshot(emptyWorkspaceSnapshot());
      applyingRemote = true;
      try { persist(); } finally { applyingRemote = false; }
    }
    previousSessionUserId = nextUserId;
    currentUser = nextUser;
    updateAccountButton(); refreshAuthModal();
    window.dispatchEvent(new CustomEvent('rn-account-state-changed', {detail:{signedIn:!!currentUser}}));
    if (!currentUser || !sb) {
      if (notebookChannel && sb) { await sb.removeChannel(notebookChannel); notebookChannel = null; }
      activeNotebook = null;
      refreshAuthModal();
      return;
    }
    await loadWorkspace();
    await refreshCommunityVotes(false);
    if (groupView === 'community') await loadCommunityGroups();
    const token = new URLSearchParams(location.search).get('notebook');
    if (token && !activeNotebook) await joinNotebookByToken(token);
    syncPlaybookAccountControls();
  }

  function requireAccount(actionText = 'continue') {
    if (!hasConfig() || !sb) {
      showModal('rnAuthModal'); message(`Connect a Supabase project to ${actionText}.`); return false;
    }
    if (!currentUser) {
      showModal('rnAuthModal'); message(`Sign in to ${actionText}.`); return false;
    }
    return true;
  }
  async function signIn() {
    if (!sb) { message('Connect Supabase first using the project settings below.'); $('rnConfigDetails').open = true; return; }
    const email = String($('rnEmail')?.value || '').trim();
    const password = String($('rnPassword')?.value || '');
    if (!email || !password) { message('Enter your email and password.'); return; }
    const button = $('rnSignInBtn'); if (button) button.disabled = true;
    const { error } = await sb.auth.signInWithPassword({email, password});
    if (button) button.disabled = false;
    if (error) { message(error.message); return; }
    message('Signed in. Loading your workspace…', true);
  }
  async function signUp() {
    if (!sb) { message('Connect Supabase first using the project settings below.'); $('rnConfigDetails').open = true; return; }
    const email = String($('rnEmail')?.value || '').trim();
    const password = String($('rnPassword')?.value || '');
    if (!email || password.length < 8) { message('Enter a valid email and a password with at least 8 characters.'); return; }
    const button = $('rnSignUpBtn'); if (button) button.disabled = true;
    const { data, error } = await sb.auth.signUp({email, password});
    if (button) button.disabled = false;
    if (error) { message(error.message); return; }
    if (data.session) message('Account created. Your workspace is being initialized.', true);
    else message('Account created. Check your email for the confirmation link, then sign in.', true);
  }
  async function signOut() {
    if (!sb) return;
    const { error } = await sb.auth.signOut();
    if (error) { message(error.message); return; }
    hideModal('rnAuthModal'); toast('Signed out');
  }

  // Global vote totals are public; individual vote rows remain private to their owner.
  function voteKey(type, id) { return `${type}::${id}`; }
  function applyVoteTotals() {
    (state.counterTips || []).forEach(item => {
      const key = voteKey('counter_tip', item.id);
      item.votes = knownVotes.get(key) || 0;
      item.myVoteDirection = myVoteDirections.get(key) || 0;
      item.myVote = item.myVoteDirection !== 0;
    });
    (state.combos || []).forEach(item => {
      const key = voteKey('synergy', item.id);
      item.votes = knownVotes.get(key) || 0;
      item.myVoteDirection = myVoteDirections.get(key) || 0;
      item.myVote = item.myVoteDirection !== 0;
    });
    (state.groupRules || []).forEach(rule => {
      rule.votesByPair ||= {};
      rule.myVotesByPair ||= {};
      rule.voteDirectionsByPair ||= {};
      const sources = groupMembers(rule.sourceType, rule.sourceValue);
      const targets = groupMembers(rule.targetType, rule.targetValue);
      sources.forEach(source => targets.forEach(target => {
        const pair = `${source}|||${target}`;
        const id = `${rule.id}::${pair}`;
        const key = voteKey('group_counter', id);
        const direction = myVoteDirections.get(key) || 0;
        rule.votesByPair[pair] = knownVotes.get(key) || 0;
        if (direction) {
          rule.myVotesByPair[pair] = true;
          rule.voteDirectionsByPair[pair] = direction;
        } else {
          delete rule.myVotesByPair[pair];
          delete rule.voteDirectionsByPair[pair];
        }
      }));
    });
    (state.comboRules || []).forEach(rule => {
      rule.votesByPair ||= {};
      rule.myVotesByPair ||= {};
      rule.voteDirectionsByPair ||= {};
      const sources = groupMembers(rule.sourceType, rule.sourceValue);
      const targets = groupMembers(rule.targetType, rule.targetValue);
      sources.forEach(source => targets.forEach(target => {
        const pair = [source, target].sort((a,b)=>String(a).localeCompare(String(b))).join('|||');
        const id = `${rule.id}::${pair}`;
        const key = voteKey('group_synergy', id);
        const direction = myVoteDirections.get(key) || 0;
        rule.votesByPair[pair] = knownVotes.get(key) || 0;
        if (direction) {
          rule.myVotesByPair[pair] = true;
          rule.voteDirectionsByPair[pair] = direction;
        } else {
          delete rule.myVotesByPair[pair];
          delete rule.voteDirectionsByPair[pair];
        }
      }));
    });
  }

  async function refreshCommunityVotes(shouldRender = true) {
    if (!sb) return;
    const totals = await sb.from('community_vote_totals').select('content_type,content_id,vote_count');
    if (totals.error) { console.warn('Community vote totals:', totals.error); return; }
    knownVotes = new Map((totals.data || []).map(row => [
      voteKey(row.content_type, row.content_id),
      Number(row.vote_count) || 0
    ]));
    myVotes = new Set();
    myVoteDirections = new Map();
    if (currentUser) {
      let own = await sb.from('community_votes')
        .select('content_type,content_id,vote_value')
        .eq('user_id', currentUser.id);
      if (own.error && /vote_value|column .* does not exist|schema cache/i.test(String(own.error.message || ''))) {
        // Compatibility before the supplied migration is applied: existing records
        // are all treated as upvotes, and the user can still remove an old upvote.
        own = await sb.from('community_votes')
          .select('content_type,content_id')
          .eq('user_id', currentUser.id);
        if (!own.error) (own.data || []).forEach(row => {
          const key = voteKey(row.content_type, row.content_id);
          myVotes.add(key);
          myVoteDirections.set(key, 1);
        });
      } else if (!own.error) {
        (own.data || []).forEach(row => {
          const key = voteKey(row.content_type, row.content_id);
          const direction = Number(row.vote_value) === -1 ? -1 : 1;
          myVotes.add(key);
          myVoteDirections.set(key, direction);
        });
      } else {
        console.warn('Community vote ownership:', own.error);
      }
    }
    applyVoteTotals();
    if (shouldRender) render();
  }

  async function toggleCommunityVote(type, id, requestedDirection = 1) {
    if (!requireAccount('vote in the community')) return;
    const direction = Number(requestedDirection) === -1 ? -1 : 1;
    const { data: existing, error: readError } = await sb.from('community_votes')
      .select('id,vote_value')
      .eq('content_type', type)
      .eq('content_id', String(id))
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (readError && /vote_value|column .* does not exist|schema cache/i.test(String(readError.message || ''))) {
      if (direction === -1) {
        toast('Downvotes require the community voting migration. Run supabase/migrations/20261126_community_vote_directions.sql in Supabase SQL Editor.');
        return;
      }
      const legacy = await sb.from('community_votes')
        .select('id')
        .eq('content_type', type)
        .eq('content_id', String(id))
        .eq('user_id', currentUser.id)
        .maybeSingle();
      if (legacy.error) { toast(`Could not check vote: ${databaseErrorHelp(legacy.error)}`); return; }
      const result = legacy.data
        ? await sb.from('community_votes').delete().eq('id', legacy.data.id)
        : await sb.from('community_votes').insert({content_type:type, content_id:String(id), user_id:currentUser.id});
      if (result.error) { toast(`Vote failed: ${databaseErrorHelp(result.error)}`); return; }
    } else {
      if (readError) { toast(`Could not check vote: ${databaseErrorHelp(readError)}`); return; }
      let result;
      if (existing && Number(existing.vote_value) === direction) {
        result = await sb.from('community_votes').delete().eq('id', existing.id);
      } else if (existing) {
        result = await sb.from('community_votes').update({vote_value:direction}).eq('id', existing.id);
      } else {
        result = await sb.from('community_votes').insert({
          content_type:type,
          content_id:String(id),
          user_id:currentUser.id,
          vote_value:direction
        });
      }
      if (result.error) {
        if (/vote_value|column .* does not exist|schema cache/i.test(String(result.error.message || ''))) {
          toast('Run supabase/migrations/20261126_community_vote_directions.sql in Supabase SQL Editor to enable downvotes.');
        } else toast(`Vote failed: ${databaseErrorHelp(result.error)}`);
        return;
      }
    }
    await refreshCommunityVotes(false);
    render();
  }

  window.__rnIsSignedIn = () => !!currentUser;
  window.__rnRequireCommunityAccount = actionText => requireAccount(actionText || 'vote in the community');
  window.__rnShowCommunityAuth = actionText => {
    showModal('rnAuthModal');
    message(`Sign in or create an account to ${actionText || 'vote in the community'}.`);
    return false;
  };
  window.__rnVoteCommunity = (type, id, direction) => toggleCommunityVote(type, id, direction);

  // Replace browser-local counters with account-backed directional community votes.
  window.voteItem = async function(kind, id) {
    const list = kind === 'counter' ? state.counterTips : state.combos;
    if (!list?.some(item => item.id === id)) return;
    await toggleCommunityVote(kind === 'counter' ? 'counter_tip' : 'synergy', id, 1);
  };
  window.voteGroupPair = async function(ruleId, key) {
    await toggleCommunityVote('group_counter', `${ruleId}::${key}`, 1);
  };
  window.voteComboPair = async function(ruleId, key) {
    await toggleCommunityVote('group_synergy', `${ruleId}::${key}`, 1);
  };

  // Public group directory and private-to-public publishing.
  function installGroupSwitch() {
    const panel = document.querySelector('#groupsPage .group-browser-panel');
    const heading = panel?.querySelector('.group-page-heading');
    if (!panel || !heading || $('rnGroupViewTabs')) return;
    const tabs = document.createElement('div'); tabs.id = 'rnGroupViewTabs'; tabs.className = 'rn-group-view-tabs';
    tabs.innerHTML = '<button type="button" data-group-view="mine" class="active">MY GROUPS <span>· PRIVATE</span></button><button type="button" data-group-view="community">COMMUNITY GROUPS <span>· PUBLIC</span></button>';
    heading.insertAdjacentElement('afterend', tabs);
    tabs.addEventListener('click', e => {
      const button = e.target.closest('[data-group-view]'); if (!button) return;
      setGroupView(button.dataset.groupView);
    });
    $('groupManagerList')?.addEventListener('click', onGroupListClick);
  }
  function setGroupView(view) {
    groupView = view === 'community' ? 'community' : 'mine';
    const page = $('groupsPage');
    page?.classList.toggle('rn-community-view', groupView === 'community');
    document.querySelectorAll('#rnGroupViewTabs [data-group-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.groupView === groupView));
    if (groupView === 'mine') renderMyGroups();
    else { renderCommunityGroups(); loadCommunityGroups().catch(err => console.warn(err)); }
  }
  function renderMyGroups() {
    baseRenderGroupManager();
    const cards = document.querySelectorAll('#groupManagerList .group-manage-card[data-drop-group]');
    cards.forEach(card => {
      const group = (state.groups || []).find(g => g.id === card.dataset.dropGroup);
      const actions = card.querySelector('.group-actions');
      if (!group || !actions || actions.querySelector('[data-rn-publish-group]')) return;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'edit-btn rn-publish-group';
      button.dataset.rnPublishGroup = group.id; button.textContent = 'SUBMIT TO COMMUNITY'; button.title = 'Publish a copy of this private group to Community Groups';
      actions.appendChild(button);
    });
  }
  const baseRenderGroupManager = window.renderGroupManager || (() => {});
  window.renderGroupManager = function() { if (groupView === 'community') renderCommunityGroups(); else renderMyGroups(); };
  function renderCommunityGroups() {
    const container = $('groupManagerList'); if (!container) return;
    if (!hasConfig() || !sb) {
      container.innerHTML = '<div class="rn-community-empty"><strong>Community Groups need a Supabase connection.</strong><br>Connect the project in SIGN IN to browse and vote on public hero groups. My Groups remain available privately.</div>'; return;
    }
    if (!communityGroups.length) {
      container.innerHTML = '<div class="rn-community-empty">No public groups have been submitted yet. Create a private group, then choose <strong>SUBMIT TO COMMUNITY</strong> to publish a copy.</div>'; return;
    }
    const sorted = [...communityGroups].sort((a,b) => (Number(b.vote_count)||0) - (Number(a.vote_count)||0) || String(a.name).localeCompare(String(b.name)));
    container.innerHTML = `<div class="rn-community-toolbar"><span><strong>PUBLIC DIRECTORY</strong> · ${sorted.length} groups</span><button class="btn" type="button" id="rnRefreshCommunityGroups">REFRESH</button></div><div class="rn-community-grid">${sorted.map(group => {
      const memberNames = Array.isArray(group.members) ? group.members : [];
      const memberHtml = memberNames.map(name => {
        const h = HEROES.find(hero => hero.name === name);
        return `<span class="rn-community-member">${h?.img ? `<img src="${escapeHtml(h.img)}" alt="" loading="lazy">` : ''}${escapeHtml(name)}</span>`;
      }).join('');
      const voted = myCommunityGroupVotes.has(group.id);
      const alreadySaved = (state.groups || []).some(g => g.name.toLowerCase() === String(group.name).toLowerCase() && g.members.join('|') === memberNames.join('|'));
      return `<article class="rn-community-card" data-rn-community-group="${escapeHtml(group.id)}"><div class="rn-community-card-head"><span class="rn-community-icon">${escapeHtml(group.icon || '✦')}</span><div class="rn-community-title"><strong>${escapeHtml(group.name)}</strong><small>${memberNames.length} HEROES · ${escapeHtml(new Date(group.created_at).toLocaleDateString())}</small></div></div><div class="rn-community-description">${escapeHtml(group.description || 'No description provided.')}</div><div class="rn-community-members">${memberHtml || '<span class="rn-community-member">No members</span>'}</div><div class="rn-community-card-foot"><button type="button" class="rn-group-vote ${voted?'voted':''}" data-rn-vote-group="${escapeHtml(group.id)}" title="${voted?'Remove your upvote':'Upvote this public group'}">▲ ${Number(group.vote_count)||0} UPVOTES</button><button type="button" class="btn" data-rn-add-group="${escapeHtml(group.id)}" ${alreadySaved?'disabled':''}>${alreadySaved?'IN MY GROUPS':'＋ ADD TO MY GROUPS'}</button></div></article>`;
    }).join('')}</div>`;
    $('rnRefreshCommunityGroups')?.addEventListener('click', () => loadCommunityGroups());
  }
  async function loadCommunityGroups() {
    if (!sb) return;
    const { data, error } = await sb.from('community_groups').select('id,owner_id,source_group_id,name,icon,description,members,vote_count,created_at').order('vote_count', {ascending:false}).limit(200);
    if (error) { console.warn('Community groups:', error); $('groupManagerList').innerHTML = `<div class="rn-community-empty"><strong>Unable to load public groups</strong><br><span style="white-space:pre-line">${escapeHtml(databaseErrorHelp(error))}</span></div>`; return; }
    communityGroups = data || [];
    myCommunityGroupVotes = new Set();
    if (currentUser) {
      const { data: votes, error: voteError } = await sb.from('community_group_votes').select('group_id').eq('user_id', currentUser.id);
      if (!voteError) (votes || []).forEach(row => myCommunityGroupVotes.add(row.group_id));
    }
    if (groupView === 'community') renderCommunityGroups();
  }
  async function publishPrivateGroup(groupId) {
    if (!requireAccount('submit a group to Community Groups')) return;
    // Publish a detached snapshot. Community submission must never mutate the private
    // group object (especially its name/icon) or reuse an editor draft by reference.
    const source = (state.groups || []).find(item => String(item.id) === String(groupId));
    if (!source) { toast('This private group is no longer available. Refresh My Groups and try again.'); return; }
    const group = {
      id: String(source.id),
      name: String(source.name || '').trim(),
      icon: String(source.icon || '✦'),
      description: String(source.description || ''),
      members: Array.isArray(source.members) ? [...source.members] : []
    };
    if (!group.name || !group.members.length) { toast('Add a group name and at least one hero before submitting.'); return; }
    const payload = {
      owner_id: currentUser.id, source_group_id: group.id,
      name: group.name, icon: group.icon, description: group.description,
      members: group.members
    };
    const { error } = await sb.from('community_groups').upsert(payload, {onConflict:'owner_id,source_group_id'});
    if (error) { toast(`Could not publish group: ${databaseErrorHelp(error)}`); return; }
    // Verify the in-memory private source is unchanged before refreshing public data.
    const stillPrivate = (state.groups || []).find(item => String(item.id) === group.id);
    if (stillPrivate && (stillPrivate.name !== group.name || stillPrivate.icon !== group.icon)) {
      console.warn('Private group metadata changed during community publish; keeping the original saved values.');
      stillPrivate.name = group.name; stillPrivate.icon = group.icon;
      if (typeof persist === 'function') persist();
    }
    await loadCommunityGroups(); toast('Group submitted to the community'); setGroupView('community');
  }
  async function toggleCommunityGroupVote(groupId) {
    if (!requireAccount('upvote a Community Group')) return;
    const { data: existing, error: readError } = await sb.from('community_group_votes').select('id').eq('group_id',groupId).eq('user_id',currentUser.id).maybeSingle();
    if (readError) { toast(`Could not check vote: ${databaseErrorHelp(readError)}`); return; }
    const result = existing
      ? await sb.from('community_group_votes').delete().eq('id',existing.id)
      : await sb.from('community_group_votes').insert({group_id:groupId,user_id:currentUser.id});
    if (result.error) { toast(`Vote failed: ${databaseErrorHelp(result.error)}`); return; }
    await loadCommunityGroups();
  }
  function addCommunityGroupToMine(groupId) {
    const group = communityGroups.find(g => g.id === groupId); if (!group) return;
    const members = (Array.isArray(group.members) ? group.members : []).filter(name => HEROES.some(h => h.name === name));
    const nameExists = (state.groups || []).some(g => g.name.toLowerCase() === String(group.name).toLowerCase());
    const name = nameExists ? `${group.name} (Community)` : group.name;
    state.groups = normalizeGroups([...(state.groups || []), {id:makeId('group'),name,icon:group.icon||'✦',description:group.description||'',members}]);
    persist(); renderGroupManager(); toast('Added to My Groups'); setGroupView('mine');
  }
  function onGroupListClick(e) {
    const publish = e.target.closest('[data-rn-publish-group]');
    const vote = e.target.closest('[data-rn-vote-group]');
    const add = e.target.closest('[data-rn-add-group]');
    if (publish) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      publishPrivateGroup(publish.dataset.rnPublishGroup); return;
    }
    if (vote) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      toggleCommunityGroupVote(vote.dataset.rnVoteGroup); return;
    }
    if (add) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      addCommunityGroupToMine(add.dataset.rnAddGroup); return;
    }
  }

  // Notebook links invite signed-in accounts to one shared tactical board.
  function shareUrl(token) {
    const url = new URL(location.href); url.searchParams.set('notebook', token); return url.toString();
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Link copied'); }
    catch (_) { const input = $('rnShareUrl'); if (input) { input.focus(); input.select(); document.execCommand('copy'); toast('Link copied'); } }
  }
  async function copyShareLink() { const value = $('rnShareUrl')?.value; if (value) await copyText(value); }
  async function createShareLink() {
    if (!requireAccount('create a collaborative notebook')) return;
    if (activeNotebook?.token) {
      $('rnShareUrl').value = shareUrl(activeNotebook.token); $('rnCopyShareBtn').disabled = false; $('rnShareMessage').textContent = 'This notebook is already shared. Send the same link to more collaborators.'; return;
    }
    const token = crypto.randomUUID ? crypto.randomUUID() : makeId('token');
    const { data, error } = await sb.from('notebooks').insert({
      owner_id: currentUser.id, share_token: token, title: state.playName || 'RivalsNotebook', data: notebookSnapshot()
    }).select('id,share_token').single();
    if (error) { $('rnShareMessage').textContent = `Could not create notebook: ${databaseErrorHelp(error)}`; return; }
    activeNotebook = {id:data.id,token:data.share_token};
    await connectNotebookRealtime();
    $('rnShareUrl').value = shareUrl(token); $('rnCopyShareBtn').disabled = false;
    $('rnShareMessage').textContent = 'Link created. Friends can open it, sign in, and join this live board. My Groups remain private.';
    setLiveStatus('LIVE NOTEBOOK READY','collab');
  }
  async function joinNotebookByToken(token) {
    if (!sb || !currentUser || !token) return;
    if (activeNotebook?.token === token) return;
    try {
      const { data: notebookId, error: joinError } = await sb.rpc('join_notebook_by_token', {p_share_token:token});
      if (joinError) throw joinError;
      const { data, error } = await sb.from('notebooks').select('id,title,share_token,data').eq('id',notebookId).single();
      if (error) throw error;
      activeNotebook = {id:data.id,token:data.share_token};
      applyNotebookSnapshot(data.data);
      await connectNotebookRealtime();
      setLiveStatus('LIVE COLLABORATION ON','collab');
      if ($('rnShareUrl')) $('rnShareUrl').value = shareUrl(token);
      if ($('rnShareMessage')) $('rnShareMessage').textContent = `Joined “${data.title || 'Shared Notebook'}”. Changes to the tactical whiteboard sync live.`;
      toast('Joined shared notebook');
    } catch (err) {
      console.error('Notebook join:', err);
      toast(`Could not join notebook: ${databaseErrorHelp(err)}`);
    }
  }
  function applyNotebookSnapshot(data) {
    if (!data || data.clientId === CLIENT_ID) return;
    applyingRemote = true;
    try {
      if (typeof data.playName === 'string') state.playName = data.playName || 'Untitled Play';
      if (Array.isArray(data.plays)) state.plays = normalizePlays(data.plays);
      if (Object.prototype.hasOwnProperty.call(data, 'activePlayId')) state.activePlayId = data.activePlayId || null;
      if (Array.isArray(data.playItems)) state.playItems = normalizePlayItems(data.playItems);
      if (typeof renderPlaybook === 'function') renderPlaybook();
      setLiveStatus('LIVE UPDATE RECEIVED','collab');
    } finally { applyingRemote = false; }
  }
  async function connectNotebookRealtime() {
    if (!sb || !activeNotebook) return;
    if (notebookChannel) { await sb.removeChannel(notebookChannel); notebookChannel = null; }
    const channel = sb.channel(`rivalsnotebook:${activeNotebook.id}`, {config:{presence:{key:currentUser.id}}});
    channel.on('postgres_changes', {event:'UPDATE',schema:'public',table:'notebooks',filter:`id=eq.${activeNotebook.id}`}, payload => {
      const next = payload.new?.data;
      if (!applyingRemote && next?.clientId !== CLIENT_ID) applyNotebookSnapshot(next);
    });
    channel.on('presence', {event:'sync'}, () => {
      const presence = channel.presenceState();
      const online = Object.keys(presence).length;
      setLiveStatus(`LIVE · ${online} ONLINE`, 'collab');
    });
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({user_id:currentUser.id,display_name:String(currentUser.email||'Member').split('@')[0],joined_at:new Date().toISOString()});
      }
    });
    notebookChannel = channel;
  }
  async function saveNotebookNow() {
    if (!sb || !currentUser || !activeNotebook || applyingRemote) return;
    const payload = notebookSnapshot();
    const {error} = await sb.from('notebooks').update({title:state.playName||'RivalsNotebook',data:payload,updated_at:new Date().toISOString()}).eq('id',activeNotebook.id);
    if (error) { console.warn('Notebook save:',error); setLiveStatus(error.code === 'PGRST205' ? 'DATABASE SETUP REQUIRED' : 'COLLAB SYNC ISSUE',''); message(databaseErrorHelp(error)); }
  }

  // Extend the app's existing local persistence with account and shared-notebook saves.
  const originalPersist = window.persist;
  if (typeof originalPersist === 'function') {
    window.persist = function() {
      originalPersist();
      if (!applyingRemote) scheduleCloudSave();
    };
  }

  function installCommunityRibbons() {
    const counter = $('counterResults');
    if (counter && !$('rnCounterRibbon')) {
      const ribbon = document.createElement('div'); ribbon.id='rnCounterRibbon'; ribbon.className='rn-community-ribbon';
      ribbon.innerHTML='<i class="rn-dot"></i><strong>COMMUNITY UPVOTES</strong><span>Ranked with votes from every signed-in RivalsNotebook account</span>';
      counter.insertAdjacentElement('beforebegin', ribbon);
    }
    const synergyHeading = document.querySelector('#synergiesPage .synergy-section-title');
    if (synergyHeading && !$('rnSynergyRibbon')) {
      const ribbon = document.createElement('div'); ribbon.id='rnSynergyRibbon'; ribbon.className='rn-community-ribbon';
      ribbon.innerHTML='<i class="rn-dot"></i><strong>GLOBAL COMMUNITY RANKING</strong><span>Shared upvotes update for everyone</span>';
      synergyHeading.insertAdjacentElement('afterend', ribbon);
    }
  }

  function installPlaybookAccountControls() {
    const topbar = document.querySelector('#playbookPage .playbook-topbar');
    const exit = $('exitPlaybookBtn');
    if (!topbar || !exit || $('rnPlaybookAccountActions')) return;
    const actions = document.createElement('div');
    actions.className = 'rn-playbook-account-actions';
    actions.id = 'rnPlaybookAccountActions';
    actions.innerHTML = '<span id="rnPlaybookLiveStatus" class="rn-live-status">LOCAL WORKSPACE</span><button class="btn rn-playbook-share" type="button" id="rnPlaybookShareBtn">COLLABORATE</button><button class="btn rn-playbook-auth" type="button" id="rnPlaybookAuthBtn">SIGN IN</button>';
    topbar.insertBefore(actions, exit);
    $('rnPlaybookShareBtn')?.addEventListener('click', () => $('rnShareBtn')?.click());
    $('rnPlaybookAuthBtn')?.addEventListener('click', () => $('rnAuthBtn')?.click());
    syncPlaybookAccountControls();
  }

  // Keyboard and zoom UI compatibility: prevent tool clicks being absorbed by drawing listeners.
  function protectBoardControls() {
    const board = $('playBoard');
    const controls = document.querySelector('.board-surface-zoom');
    if (!board || !controls || controls.dataset.rnProtected) return;
    controls.dataset.rnProtected = '1';
    // Rebind the original controls after removing their earlier listeners, and call
    // the actual zoom closure so pan offsets, limits and the zoom label stay in sync.
    ['boardZoomOutBtn','boardZoomInBtn'].forEach(id => {
      const oldButton = $(id); if (!oldButton) return;
      const button = oldButton.cloneNode(true); oldButton.replaceWith(button);
      button.addEventListener('pointerdown', e => e.stopPropagation());
      button.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const current = typeof window.__rnGetBoardZoom === 'function' ? window.__rnGetBoardZoom() : .65;
        if (typeof window.__rnSetBoardZoom === 'function') window.__rnSetBoardZoom(current + (id === 'boardZoomInBtn' ? .1 : -.1));
      });
    });
    controls.addEventListener('pointerdown', e => e.stopPropagation());
    // Capturing board handler guarantees zoom chrome never starts a marquee or pen stroke.
    board.addEventListener('pointerdown', e => { if (e.target.closest('.board-surface-zoom')) e.stopPropagation(); }, true);
  }

  // Initial app-level visual changes and data hydration.
  installModals();
  installGroupSwitch();
  installCommunityRibbons();
  installPlaybookAccountControls();
  protectBoardControls();
  const originalSwitchPage = window.switchPage;
  if (typeof originalSwitchPage === 'function') {
    window.switchPage = function(pageName) {
      originalSwitchPage(pageName);
      if (pageName === 'groupsPage') renderGroupManager();
      if (pageName === 'synergiesPage') refreshCommunityVotes(true);
    };
  }
  const startup = async () => {
    if (hasConfig()) {
      const ok = await initializeSupabase();
      if (ok) {
        await refreshCommunityVotes(false);
        installVoteRealtime();
      }
    } else {
      updateAccountButton();
    }
    if (groupView === 'mine') renderMyGroups();
    const shareToken = new URLSearchParams(location.search).get('notebook');
    if (shareToken && !currentUser) { showModal('rnAuthModal'); message('Sign in to join the shared notebook.'); }
  };
  function installVoteRealtime() {
    if (!sb || voteChannel) return;
    voteChannel = sb.channel('rivalsnotebook:community-votes')
      .on('postgres_changes',{event:'*',schema:'public',table:'community_vote_totals'},()=>refreshCommunityVotes(true))
      .subscribe();
    groupChannel = sb.channel('rivalsnotebook:community-groups')
      .on('postgres_changes',{event:'*',schema:'public',table:'community_groups'},()=>{ if (groupView==='community') loadCommunityGroups(); })
      .subscribe();
  }
  startup().catch(err => { console.error('RIVALSNOTEBOOK startup:',err); setLiveStatus('CLOUD SYNC ERROR',''); });
})();


/* Load Playbook patches in dependency order after the inline notebook UI is ready. */
(() => {
  if (window.__rnV1334PatchLoader) return;
  window.__rnV1334PatchLoader = true;
  const v1334 = document.createElement('script');
  v1334.src = './rn-v1334-playbook-upgrades.js?v=1334';
  v1334.async = false;
  v1334.onerror = () => console.error('RIVALSNOTEBOOK v13.34 Playbook upgrades could not be loaded.');
  v1334.onload = () => {
    const v1335 = document.createElement('script');
    v1335.src = './rn-v1335-regression-fixes.js?v=1335';
    v1335.async = false;
    v1335.onerror = () => console.error('RIVALSNOTEBOOK v13.35 regression fixes could not be loaded.');
    v1335.onload = () => {
      const v1337 = document.createElement('script');
      v1337.src = './rn-v1337-community-voting.js?v=1337';
      v1337.async = false;
      v1337.onerror = () => console.error('RIVALSNOTEBOOK v13.37 community voting UI could not be loaded.');
      v1337.onload = () => {
        const v1338 = document.createElement('script');
        v1338.src = './rn-v1338-pairing-attribution.js?v=1338';
        v1338.async = false;
        v1338.onerror = () => console.error('RIVALSNOTEBOOK v13.38 pairing and attribution updates could not be loaded.');
        v1338.onload = () => {
          const v1344 = document.createElement('script');
          v1344.src = './rn-v1344-ui-updates.js?v=1344';
          v1344.async = false;
          v1344.onerror = () => console.error('RIVALSNOTEBOOK v13.44 UI updates could not be loaded.');
          document.head.appendChild(v1344);
        };
        document.head.appendChild(v1338);
      };
      document.head.appendChild(v1337);
    };
    document.head.appendChild(v1335);
  };
  document.head.appendChild(v1334);
})();
