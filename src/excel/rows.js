import {
  COLORS, COLUMNS,
  thinBorder, solidFill,
  TITLE_FONT, HEADER_FONT, DOMAIN_FONT,
  PRODUCT_FONT, CELL_FONT, CLUSTER_LABEL_FONT,
  HEALTHY_FONT, PENDING_FONT, CENTER_ALIGN,
} from './styles.js';
import { BOM } from '../bom.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function styleCell(cell, { font, fill, alignment, border }) {
  if (font)      cell.font      = font;
  if (fill)      cell.fill      = fill;
  if (alignment) cell.alignment = alignment;
  if (border)    cell.border    = border;
}

// ── Title row (row 1) ─────────────────────────────────────────────────────────

export function writeTitleRow(ws, state) {
  ws.mergeCells('A1:H1');
  const cell  = ws.getCell('A1');
  const now   = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ` +
                `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  cell.value = `VCF on VxRail  |  Upgrade Plan  |  ${state.sourceVersion}  ->  ${state.targetVersion}  |  Generated: ${stamp}`;
  styleCell(cell, {
    font:      TITLE_FONT,
    fill:      solidFill(COLORS.TITLE_BG),
    alignment: CENTER_ALIGN,
    border:    thinBorder(),
  });
  ws.getRow(1).height = 24;
}

// ── Header row (row 2) ────────────────────────────────────────────────────────

export function writeHeaderRow(ws) {
  const row = ws.getRow(2);
  COLUMNS.forEach(({ header }, i) => {
    const cell = row.getCell(i + 1);
    cell.value = header;
    styleCell(cell, {
      font:      HEADER_FONT,
      fill:      solidFill(COLORS.HEADER_BG),
      alignment: CENTER_ALIGN,
      border:    thinBorder(),
    });
  });
  row.height = 22;
}

// ── Domain group ──────────────────────────────────────────────────────────────
// Returns the next available row number after writing this domain group.

export function writeDomainGroup(ws, domainLabel, dataRows, startRow, altBackground) {
  const bg = altBackground ? COLORS.ALT_BG : COLORS.WHITE;
  let   r  = startRow;

  for (const { clusterLabel, product, curVer, curBuild, tgtVer, tgtBuild } of dataRows) {
    const isCluster = Boolean(clusterLabel);
    const rowBg     = isCluster ? COLORS.CLUSTER_BG : bg;
    const exRow     = ws.getRow(r);

    // Col A: domain placeholder (will be merged + styled after loop)
    const domCell = exRow.getCell(1);
    domCell.border = thinBorder();
    if (isCluster) {
      domCell.value     = clusterLabel;
      domCell.font      = CLUSTER_LABEL_FONT;
      domCell.fill      = solidFill(COLORS.CLUSTER_BG);
      domCell.alignment = CENTER_ALIGN;
    }

    // Col B: Product
    const prodCell = exRow.getCell(2);
    prodCell.value = product;
    styleCell(prodCell, { font: PRODUCT_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col C: Current Version
    const cvCell = exRow.getCell(3);
    cvCell.value = curVer;
    styleCell(cvCell, { font: CELL_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col D: Current Build
    const cbCell = exRow.getCell(4);
    cbCell.value = curBuild;
    styleCell(cbCell, { font: CELL_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col E: Go to Version
    const tvCell = exRow.getCell(5);
    tvCell.value = tgtVer;
    styleCell(tvCell, { font: CELL_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col F: Go to Build
    const tbCell = exRow.getCell(6);
    tbCell.value = tgtBuild;
    styleCell(tbCell, { font: CELL_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col G: Health Checks
    const hcCell = exRow.getCell(7);
    hcCell.value = 'Healthy';
    styleCell(hcCell, { font: HEALTHY_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    // Col H: Status
    const stCell = exRow.getCell(8);
    stCell.value = 'Pending';
    styleCell(stCell, { font: PENDING_FONT, fill: solidFill(rowBg), alignment: CENTER_ALIGN, border: thinBorder() });

    exRow.height = 18;
    r++;
  }

  // Merge domain column and apply domain style
  const endRow = r - 1;
  if (endRow > startRow) {
    ws.mergeCells(startRow, 1, endRow, 1);
  }
  const domainCell = ws.getCell(startRow, 1);
  domainCell.value = domainLabel;
  styleCell(domainCell, {
    font:      DOMAIN_FONT,
    fill:      solidFill(COLORS.DOMAIN_BG),
    alignment: CENTER_ALIGN,
    border:    thinBorder(),
  });

  return r; // next available row
}

// ── Row builders ──────────────────────────────────────────────────────────────

function bomRow(src, tgt, component, state) {
  const tgtOv = state?.bomOverrides?.target?.[component];
  return {
    curVer:   src[component].version,
    curBuild: src[component].build,
    tgtVer:   tgtOv?.version ?? tgt[component].version,
    tgtBuild: tgtOv?.build   ?? tgt[component].build,
  };
}

export function buildMgmtRows(state) {
  const src = BOM[state.sourceVersion];
  const tgt = BOM[state.targetVersion];
  const mc  = state.mgmtDomain.clusterName;
  const mh  = state.mgmtDomain.hostCount;

  return [
    { clusterLabel: '',          product: 'SDDC Manager',         ...bomRow(src, tgt, 'sddc',    state) },
    { clusterLabel: '',          product: 'NSX-T',                 ...bomRow(src, tgt, 'nsx',     state) },
    { clusterLabel: '',          product: 'vCenter',               ...bomRow(src, tgt, 'vcenter', state) },
    { clusterLabel: `"${mc}"`,   product: 'VxRail Manager',        ...bomRow(src, tgt, 'vxrail',  state) },
    { clusterLabel: `"${mc}"`,   product: `ESXi (0/${mh})`,        ...bomRow(src, tgt, 'esxi',    state) },
  ];
}

export function buildWLDRows(wld, state) {
  const src = BOM[state.sourceVersion];
  const tgt = BOM[state.targetVersion];
  const rows = [
    { clusterLabel: '', product: 'NSX-T',   ...bomRow(src, tgt, 'nsx',     state) },
    { clusterLabel: '', product: 'vCenter', ...bomRow(src, tgt, 'vcenter', state) },
  ];
  for (const cl of wld.clusters) {
    rows.push({ clusterLabel: `"${cl.name}"`, product: 'VxRail Manager',           ...bomRow(src, tgt, 'vxrail', state) });
    rows.push({ clusterLabel: `"${cl.name}"`, product: `ESXi (0/${cl.hostCount})`, ...bomRow(src, tgt, 'esxi',   state) });
  }
  return rows;
}
