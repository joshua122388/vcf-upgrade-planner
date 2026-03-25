import { state } from '../state.js';
import { generateExcel } from '../excel/generator.js';

export function renderStep3(container) {
  const mgmt = state.mgmtDomain;

  const wldRows = state.workloadDomains.length === 0
    ? '<p class="no-wld">No workload domains defined.</p>'
    : state.workloadDomains.map(wld => `
        <div class="summary-domain">
          <div class="summary-domain-header">VI WLD — <strong>${esc(wld.name)}</strong></div>
          <table class="summary-cluster-table">
            <thead><tr><th>Cluster</th><th>ESXi Hosts</th></tr></thead>
            <tbody>
              ${wld.clusters.map(cl => `
                <tr>
                  <td>${esc(cl.name)}</td>
                  <td>${cl.hostCount}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`).join('');

  container.innerHTML = `
    <div class="step-card">
      <h2>Review &amp; Generate</h2>
      <p class="step-description">Review your upgrade plan, then click <strong>Generate Excel File</strong> to download.</p>

      <div class="summary-section">
        <h3>Versions</h3>
        <table class="summary-versions-table">
          <tr><td>Source</td><td><strong>${esc(state.sourceVersion)}</strong></td></tr>
          <tr><td>Target</td><td><strong>${esc(state.targetVersion)}</strong></td></tr>
        </table>
      </div>

      <div class="summary-section">
        <h3>Management Domain</h3>
        <div class="summary-domain">
          <div class="summary-domain-header">MGMT — <strong>${esc(mgmt.name)}</strong></div>
          <table class="summary-cluster-table">
            <thead><tr><th>Cluster</th><th>ESXi Hosts</th></tr></thead>
            <tbody>
              <tr><td>${esc(mgmt.clusterName)}</td><td>${mgmt.hostCount}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="summary-section">
        <h3>Workload Domains <span class="count-badge">${state.workloadDomains.length}</span></h3>
        ${wldRows}
      </div>

      <div class="generate-area">
        <button id="btn-generate" class="btn-primary btn-generate">
          ⬇ Generate Excel File
        </button>
        <div id="gen-status" style="display:none" class="gen-status"></div>
      </div>
    </div>
  `;

  container.querySelector('#btn-generate').addEventListener('click', async () => {
    const btn    = container.querySelector('#btn-generate');
    const status = container.querySelector('#gen-status');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    status.style.display = 'none';

    try {
      await generateExcel(state);
      btn.textContent = '⬇ Generate Excel File';
      status.textContent = 'File downloaded successfully.';
      status.className = 'gen-status gen-status--ok';
      status.style.display = 'block';
    } catch (err) {
      console.error(err);
      btn.textContent = '⬇ Generate Excel File';
      status.textContent = `Error: ${err.message}`;
      status.className = 'gen-status gen-status--err';
      status.style.display = 'block';
    } finally {
      btn.disabled = false;
    }
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
