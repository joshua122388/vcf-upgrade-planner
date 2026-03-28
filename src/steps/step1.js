import { BOM, VCF_VERSIONS } from '../bom.js';
import { state, resetBomOverrides } from '../state.js';
import { ASYNC_PATCHES } from '../patches.js';

const PRODUCT_LABELS = [
  { key: 'sddc',    label: 'SDDC Manager'  },
  { key: 'nsx',     label: 'NSX-T'         },
  { key: 'vcenter', label: 'vCenter'        },
  { key: 'vxrail',  label: 'VxRail Manager' },
  { key: 'esxi',    label: 'ESXi'           },
];

// Components that support async patching (SDDC Manager excluded)
const PATCH_COMPONENTS = [
  { key: 'nsx',     label: 'NSX-T'         },
  { key: 'vcenter', label: 'vCenter'        },
  { key: 'esxi',    label: 'ESXi'           },
  { key: 'vxrail',  label: 'VxRail Manager' },
];

export function renderStep1(container) {
  container.innerHTML = `
    <div class="step-card">
      <h2>Select VCF on VxRail Versions</h2>
      <p class="step-description">Choose your current (source) version and the version you are upgrading to.</p>

      <div class="version-selectors">
        <div class="field-group">
          <label for="sel-source">Source (current) version</label>
          <select id="sel-source">
            <option value="">-- select --</option>
            ${VCF_VERSIONS.map(v => `<option value="${v}" ${state.sourceVersion === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="arrow-between">→</div>
        <div class="field-group">
          <label for="sel-target">Target version</label>
          <select id="sel-target">
            <option value="">-- select --</option>
            ${VCF_VERSIONS.map(v => `<option value="${v}" ${state.targetVersion === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="bom-preview"></div>
      <div id="async-patches-section"></div>
      <div id="step1-error" class="error-msg" style="display:none"></div>
    </div>
  `;

  const selSource      = container.querySelector('#sel-source');
  const selTarget      = container.querySelector('#sel-target');
  const preview        = container.querySelector('#bom-preview');
  const patchSection   = container.querySelector('#async-patches-section');

  function syncDisabled() {
    Array.from(selSource.options).forEach(opt => {
      opt.disabled = opt.value !== '' && opt.value === selTarget.value;
    });
    Array.from(selTarget.options).forEach(opt => {
      opt.disabled = opt.value !== '' && opt.value === selSource.value;
    });
  }

  function renderBomTable() {
    const src = state.sourceVersion;
    const tgt = state.targetVersion;
    if (!src && !tgt) { preview.innerHTML = ''; return; }
    const srcData = src ? BOM[src] : null;
    const tgtData = tgt ? BOM[tgt] : null;

    const rows = PRODUCT_LABELS.map(({ key, label }) => {
      const sv = srcData ? srcData[key].version : '—';
      const sb = srcData ? srcData[key].build   : '—';
      const ov = state.bomOverrides.target[key];
      const tv = ov ? ov.version : (tgtData ? tgtData[key].version : '—');
      const tb = ov ? ov.build   : (tgtData ? tgtData[key].build   : '—');
      const overrideClass = ov ? ' class="overridden-cell"' : '';
      return `
        <tr>
          <td class="product-cell">${label}</td>
          <td>${sv}</td>
          <td class="build-cell">${sb}</td>
          <td class="sep-cell">→</td>
          <td${overrideClass}>${tv}</td>
          <td class="build-cell"${overrideClass}>${tb}</td>
        </tr>`;
    }).join('');
    preview.innerHTML = `
      <table class="bom-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Current Version ${src ? `(${src})` : ''}</th>
            <th>Build</th>
            <th></th>
            <th>Target Version ${tgt ? `(${tgt})` : ''}</th>
            <th>Build</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderPatchSection() {
    const tgt = state.targetVersion;
    if (!tgt) { patchSection.innerHTML = ''; return; }

    const overrideCount = Object.keys(state.bomOverrides.target).length;
    const badgeHtml = overrideCount > 0
      ? `<span class="override-badge">${overrideCount} override${overrideCount > 1 ? 's' : ''}</span>`
      : '';

    const rows = PATCH_COMPONENTS.map(({ key, label }) => {
      const patches = (ASYNC_PATCHES[key] || []).filter(p => p.supportedVcf.includes(tgt));
      const current = state.bomOverrides.target[key];
      const isCustom = current && !patches.find(p => p.version === current.version);

      const options = [
        `<option value="">— None —</option>`,
        ...patches.map(p => {
          const sel = current && !isCustom && current.version === p.version ? 'selected' : '';
          return `<option value="${p.version}" data-build="${p.build}" ${sel}>${p.version}</option>`;
        }),
        `<option value="__custom__" ${isCustom ? 'selected' : ''}>Custom…</option>`,
      ].join('');

      const buildVal   = current ? current.build : '';
      const verVal     = isCustom ? current.version : '';
      const buildRO    = current && !isCustom ? 'readonly' : '';

      const customVerHtml = isCustom
        ? `<input type="text" class="patch-custom-ver" data-component="${key}" placeholder="Version" value="${verVal}" style="width:110px">`
        : `<input type="text" class="patch-custom-ver" data-component="${key}" placeholder="Version" value="${verVal}" style="width:110px;display:none">`;

      return `
        <tr class="patch-row" data-component="${key}">
          <td class="patch-label">${label}</td>
          <td>
            <select class="patch-select" data-component="${key}">
              ${options}
            </select>
          </td>
          <td>${customVerHtml}</td>
          <td>
            <span class="patch-build-label">Build:</span>
            <input type="text" class="patch-build" data-component="${key}" value="${buildVal}" placeholder="Build number" ${buildRO} style="width:110px">
          </td>
        </tr>`;
    }).join('');

    const hasSomeOptions = PATCH_COMPONENTS.some(({ key }) =>
      (ASYNC_PATCHES[key] || []).some(p => p.supportedVcf.includes(tgt))
    );

    if (!hasSomeOptions) { patchSection.innerHTML = ''; return; }

    patchSection.innerHTML = `
      <div class="patch-collapsible">
        <button type="button" class="patch-toggle" id="patch-toggle-btn">
          <span class="patch-toggle-icon" id="patch-toggle-icon">▶</span>
          Flexible BOM Versions (optional) ${badgeHtml}
        </button>
        <div class="patch-body" id="patch-body" style="display:none">
          <p class="patch-description">Override the target version/build for any component. Use this to reflect an async patch or correct BOM data for your environment.</p>
          <table class="patch-table">
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    // Re-open if previously expanded (state persists across re-renders)
    if (patchSection._expanded) {
      patchSection.querySelector('#patch-body').style.display = '';
      patchSection.querySelector('#patch-toggle-icon').textContent = '▼';
    }

    // Toggle collapse
    patchSection.querySelector('#patch-toggle-btn').addEventListener('click', () => {
      const body = patchSection.querySelector('#patch-body');
      const icon = patchSection.querySelector('#patch-toggle-icon');
      const open = body.style.display === 'none';
      body.style.display = open ? '' : 'none';
      icon.textContent   = open ? '▼' : '▶';
      patchSection._expanded = open;
    });

    // Dropdown change handler
    patchSection.querySelectorAll('.patch-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const comp      = sel.dataset.component;
        const val       = sel.value;
        const row       = patchSection.querySelector(`.patch-row[data-component="${comp}"]`);
        const buildInp  = row.querySelector('.patch-build');
        const customVer = row.querySelector('.patch-custom-ver');

        if (val === '') {
          // None selected
          delete state.bomOverrides.target[comp];
          buildInp.value    = '';
          buildInp.readOnly = false;
          customVer.style.display = 'none';
          customVer.value = '';
        } else if (val === '__custom__') {
          // Custom — free-text both fields
          delete state.bomOverrides.target[comp];
          buildInp.value    = '';
          buildInp.readOnly = false;
          customVer.style.display = '';
          customVer.value = '';
        } else {
          // Known patch selected — auto-fill build
          const patch = ASYNC_PATCHES[comp].find(p => p.version === val);
          buildInp.value    = patch.build;
          buildInp.readOnly = true;
          customVer.style.display = 'none';
          customVer.value = '';
          state.bomOverrides.target[comp] = { version: patch.version, build: patch.build };
        }
        renderBomTable();
        renderPatchSection(); // refresh badge
      });
    });

    // Custom version input handler
    patchSection.querySelectorAll('.patch-custom-ver').forEach(inp => {
      inp.addEventListener('input', () => {
        const comp     = inp.dataset.component;
        const row      = patchSection.querySelector(`.patch-row[data-component="${comp}"]`);
        const buildInp = row.querySelector('.patch-build');
        const ver      = inp.value.trim();
        const bld      = buildInp.value.trim();
        if (ver || bld) {
          state.bomOverrides.target[comp] = { version: ver, build: bld };
        } else {
          delete state.bomOverrides.target[comp];
        }
        renderBomTable();
        renderPatchSection();
      });
    });

    // Custom build input handler
    patchSection.querySelectorAll('.patch-build').forEach(inp => {
      if (inp.readOnly) return;
      inp.addEventListener('input', () => {
        const comp     = inp.dataset.component;
        const row      = patchSection.querySelector(`.patch-row[data-component="${comp}"]`);
        const sel      = row.querySelector('.patch-select');
        const customVer = row.querySelector('.patch-custom-ver');
        const bld      = inp.value.trim();
        if (sel.value === '__custom__') {
          const ver = customVer.value.trim();
          if (ver || bld) {
            state.bomOverrides.target[comp] = { version: ver, build: bld };
          } else {
            delete state.bomOverrides.target[comp];
          }
          renderBomTable();
          renderPatchSection();
        }
      });
    });
  }

  function updatePreview() {
    const src = selSource.value;
    const tgt = selTarget.value;

    const targetChanged = state.targetVersion !== (tgt || null);
    state.sourceVersion = src || null;
    state.targetVersion = tgt || null;

    if (targetChanged) resetBomOverrides();

    syncDisabled();

    if (!src && !tgt) { preview.innerHTML = ''; patchSection.innerHTML = ''; return; }

    renderBomTable();

    renderPatchSection();
  }

  selSource.addEventListener('change', updatePreview);
  selTarget.addEventListener('change', updatePreview);

  if (state.sourceVersion || state.targetVersion) updatePreview();
}

export function validateStep1() {
  const errEl = document.getElementById('step1-error');
  if (!state.sourceVersion || !state.targetVersion) {
    errEl.textContent = 'Please select both a source and a target version.';
    errEl.style.display = 'block';
    return false;
  }
  if (state.sourceVersion === state.targetVersion) {
    errEl.textContent = 'Source and target versions must be different.';
    errEl.style.display = 'block';
    return false;
  }
  errEl.style.display = 'none';
  return true;
}
