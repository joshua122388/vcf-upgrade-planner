import { state, addWLD, removeWLD, addCluster, removeCluster } from '../state.js';

export function renderStep2(container) {
  container.innerHTML = `
    <div class="step-card">
      <h2>Define Domain Topology</h2>
      <p class="step-description">Configure the management domain and any VI workload domains to include in the upgrade plan.</p>
      <div id="topo-root"></div>
      <div id="step2-error" class="error-msg" style="display:none"></div>
    </div>
  `;
  renderTopology(container.querySelector('#topo-root'));
}

function renderTopology(root) {
  root.innerHTML = '';

  // ── Management domain card ────────────────────────────────────────────────
  const mgmtCard = document.createElement('div');
  mgmtCard.className = 'domain-card mgmt-card';
  mgmtCard.innerHTML = `
    <div class="card-header">
      <span class="card-title">Management Domain</span>
      <span class="card-badge">MGMT</span>
    </div>
    <div class="card-body">
      <div class="inline-fields">
        <div class="field-group">
          <label>Domain name</label>
          <input type="text" id="mgmt-name" value="${esc(state.mgmtDomain.name)}" maxlength="64" />
        </div>
        <div class="field-group">
          <label>Cluster name</label>
          <input type="text" id="mgmt-cluster" value="${esc(state.mgmtDomain.clusterName)}" maxlength="64" />
        </div>
        <div class="field-group field-group--narrow">
          <label>ESXi hosts</label>
          <input type="number" id="mgmt-hosts" value="${state.mgmtDomain.hostCount}" min="1" max="999" />
        </div>
      </div>
    </div>
  `;
  root.appendChild(mgmtCard);

  // Live-bind management domain inputs
  mgmtCard.querySelector('#mgmt-name').addEventListener('input', e => {
    state.mgmtDomain.name = e.target.value.trim();
    clearError();
  });
  mgmtCard.querySelector('#mgmt-cluster').addEventListener('input', e => {
    state.mgmtDomain.clusterName = e.target.value.trim();
    clearError();
  });
  mgmtCard.querySelector('#mgmt-hosts').addEventListener('input', e => {
    const n = parseInt(e.target.value, 10);
    state.mgmtDomain.hostCount = isNaN(n) ? '' : n;
    clearError();
  });

  // ── WLD cards ─────────────────────────────────────────────────────────────
  state.workloadDomains.forEach(wld => {
    root.appendChild(buildWLDCard(wld, root));
  });

  // ── Add WLD button ────────────────────────────────────────────────────────
  const addBtn = document.createElement('div');
  addBtn.className = 'add-domain-btn';
  addBtn.innerHTML = `<span>＋ Add Workload Domain</span>`;
  addBtn.addEventListener('click', () => {
    addWLD();
    renderTopology(root);
  });
  root.appendChild(addBtn);
}

function buildWLDCard(wld, root) {
  const card = document.createElement('div');
  card.className = 'domain-card wld-card';
  card.dataset.wldId = wld.id;

  const clusterRows = wld.clusters.map(cl => buildClusterRow(wld.id, cl)).join('');

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">VI Workload Domain</span>
      <button class="btn-remove-wld" data-wld="${wld.id}" title="Remove this workload domain">✕ Remove WLD</button>
    </div>
    <div class="card-body">
      <div class="field-group" style="max-width:320px; margin-bottom:1rem;">
        <label>Domain name</label>
        <input type="text" class="wld-name" data-wld="${wld.id}" value="${esc(wld.name)}" maxlength="64" />
      </div>
      <div class="cluster-list" data-wld="${wld.id}">
        ${clusterRows}
      </div>
      <button class="btn-add-cluster" data-wld="${wld.id}">＋ Add Cluster</button>
    </div>
  `;

  // Domain name change
  card.querySelector('.wld-name').addEventListener('input', e => {
    wld.name = e.target.value.trim();
    clearError();
  });

  // Remove WLD
  card.querySelector('.btn-remove-wld').addEventListener('click', () => {
    removeWLD(wld.id);
    renderTopology(root);
  });

  // Add cluster
  card.querySelector('.btn-add-cluster').addEventListener('click', () => {
    addCluster(wld.id);
    renderTopology(root);
  });

  // Remove cluster handlers (delegated)
  card.querySelector('.cluster-list').addEventListener('click', e => {
    const btn = e.target.closest('.btn-remove-cluster');
    if (!btn) return;
    removeCluster(wld.id, parseInt(btn.dataset.cluster, 10));
    renderTopology(root);
  });

  // Cluster field changes (delegated)
  card.querySelector('.cluster-list').addEventListener('input', e => {
    const input = e.target;
    const clusterId = parseInt(input.dataset.cluster, 10);
    const cl = wld.clusters.find(c => c.id === clusterId);
    if (!cl) return;
    if (input.classList.contains('cluster-name')) {
      cl.name = input.value.trim();
    } else if (input.classList.contains('cluster-hosts')) {
      const n = parseInt(input.value, 10);
      cl.hostCount = isNaN(n) ? '' : n;
    }
    clearError();
  });

  return card;
}

function buildClusterRow(wldId, cl) {
  const removable = true; // state enforces min-1 inside removeCluster
  return `
    <div class="cluster-row">
      <div class="field-group">
        <label>Cluster name</label>
        <input type="text" class="cluster-name" data-cluster="${cl.id}" value="${esc(cl.name)}" maxlength="64" />
      </div>
      <div class="field-group field-group--narrow">
        <label>ESXi hosts</label>
        <input type="number" class="cluster-hosts" data-cluster="${cl.id}" value="${cl.hostCount}" min="1" max="999" />
      </div>
      ${removable ? `<button class="btn-remove-cluster" data-cluster="${cl.id}" title="Remove cluster">✕</button>` : ''}
    </div>
  `;
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function clearError() {
  const el = document.getElementById('step2-error');
  if (el) el.style.display = 'none';
}

// ── Validation ────────────────────────────────────────────────────────────────
export function validateStep2() {
  const errEl = document.getElementById('step2-error');
  const show  = msg => { errEl.textContent = msg; errEl.style.display = 'block'; return false; };

  // Sync current input values into state (in case user typed without blurring)
  const mgmtNameEl    = document.getElementById('mgmt-name');
  const mgmtClusterEl = document.getElementById('mgmt-cluster');
  const mgmtHostsEl   = document.getElementById('mgmt-hosts');

  if (mgmtNameEl)    state.mgmtDomain.name        = mgmtNameEl.value.trim();
  if (mgmtClusterEl) state.mgmtDomain.clusterName  = mgmtClusterEl.value.trim();
  if (mgmtHostsEl)   state.mgmtDomain.hostCount    = parseInt(mgmtHostsEl.value, 10);

  if (!state.mgmtDomain.name)
    return show('Management domain name is required.');
  if (!state.mgmtDomain.clusterName)
    return show('Management cluster name is required.');
  if (!Number.isInteger(state.mgmtDomain.hostCount) || state.mgmtDomain.hostCount < 1)
    return show('Management cluster host count must be a positive integer.');

  const domainNames = new Set([state.mgmtDomain.name.toUpperCase()]);

  for (const wld of state.workloadDomains) {
    // Sync WLD name from DOM
    const wldNameEl = document.querySelector(`.wld-name[data-wld="${wld.id}"]`);
    if (wldNameEl) wld.name = wldNameEl.value.trim();

    if (!wld.name)
      return show(`A workload domain has an empty name. Please fill it in.`);

    const nameUpper = wld.name.toUpperCase();
    if (domainNames.has(nameUpper))
      return show(`Duplicate domain name "${wld.name}". Domain names must be unique.`);
    domainNames.add(nameUpper);

    for (const cl of wld.clusters) {
      const clNameEl  = document.querySelector(`.cluster-name[data-cluster="${cl.id}"]`);
      const clHostsEl = document.querySelector(`.cluster-hosts[data-cluster="${cl.id}"]`);
      if (clNameEl)  cl.name      = clNameEl.value.trim();
      if (clHostsEl) cl.hostCount = parseInt(clHostsEl.value, 10);

      if (!cl.name)
        return show(`A cluster in workload domain "${wld.name}" has an empty name.`);
      if (!Number.isInteger(cl.hostCount) || cl.hostCount < 1)
        return show(`Cluster "${cl.name}" host count must be a positive integer.`);
    }
  }

  errEl.style.display = 'none';
  return true;
}
