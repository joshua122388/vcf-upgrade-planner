import { COLUMNS } from './styles.js';
import { writeTitleRow, writeHeaderRow, writeDomainGroup, buildMgmtRows, buildWLDRows } from './rows.js';

export async function generateExcel(state) {
  // ExcelJS and saveAs are loaded as globals from vendor scripts
  const ExcelJS = window.ExcelJS;
  const saveAs  = window.saveAs;
  if (!ExcelJS) throw new Error('ExcelJS library not loaded. Check vendor/exceljs.min.js.');
  if (!saveAs)  throw new Error('FileSaver library not loaded. Check vendor/FileSaver.min.js.');

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'VCF on VxRail Upgrade Planner';
  wb.created  = new Date();
  const ws    = wb.addWorksheet('Upgrade Plan');

  // Column widths
  ws.columns = COLUMNS.map(({ width }) => ({ width }));

  // Title + header
  writeTitleRow(ws, state);
  writeHeaderRow(ws);

  // Freeze panes at row 3 (keeps title + header visible when scrolling)
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3' }];

  let currentRow = 3;
  let altBg      = false;

  // Management domain
  const mgmtLabel = `MGMT\nName: ${state.mgmtDomain.name}`;
  const mgmtRows  = buildMgmtRows(state);
  currentRow = writeDomainGroup(ws, mgmtLabel, mgmtRows, currentRow, altBg);
  altBg = !altBg;

  // Workload domains
  for (const wld of state.workloadDomains) {
    const wldLabel = `VI WLD\nName: "${wld.name}"`;
    const wldRows  = buildWLDRows(wld, state);
    currentRow = writeDomainGroup(ws, wldLabel, wldRows, currentRow, altBg);
    altBg = !altBg;
  }

  // Generate buffer and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const now    = new Date();
  const date   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const fname  = `VCF_UpgradePlan_${state.sourceVersion}_to_${state.targetVersion}_${date}.xlsx`;

  saveAs(blob, fname);
  state.generatedAt = new Date();
}
