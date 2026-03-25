# VCF on VxRail — Upgrade Plan Generator

A browser-based wizard that generates a formatted `.xlsx` upgrade plan for VCF on VxRail environments. No server, no Python, no install required.

---

## How to open

### Option A — Local HTTP server (recommended, avoids browser ES module restrictions)

```bash
cd vcf-upgrade-planner
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Option B — Direct file open

Double-click `index.html`. Works in Firefox. Chrome blocks ES module imports on `file://` URLs — use Option A for Chrome.

---

## Workflow

1. **Step 1 — Versions**: Select source (current) and target VCF on VxRail versions. A side-by-side BOM preview confirms the component versions.
2. **Step 2 — Topology**: Define the management domain (name, cluster, host count) and any VI workload domains (each with one or more clusters).
3. **Step 3 — Generate**: Review the full summary and click **Generate Excel File** to download the `.xlsx` plan.

Output filename format: `VCF_UpgradePlan_{source}_to_{target}_{YYYY-MM-DD}.xlsx`

---

## Adding new VCF versions

Edit **`src/bom.js`** only — nothing else needs to change.

```js
export const BOM = {
  // ... existing versions ...
  "5.3.0": {
    sddc:    { version: "5.3.0.0",    build: "XXXXXXXX" },
    nsx:     { version: "4.3.0.0",    build: "XXXXXXXX" },
    vcenter: { version: "8.0.4.00100",build: "XXXXXXXX" },
    vxrail:  { version: "8.0.400",    build: "XXXXXXXX" },
    esxi:    { version: "8.0.4",      build: "XXXXXXXX" },
  },
};
```

Version strings are taken from the Dell VCF on VxRail Release Notes.

---

## File structure

```
vcf-upgrade-planner/
├── index.html              # App shell, step nav, CSS
├── vendor/
│   ├── exceljs.min.js      # ExcelJS browser build (XLSX generation)
│   └── FileSaver.min.js    # Cross-browser file download
└── src/
    ├── bom.js              # BOM data — only file updated for new releases
    ├── state.js            # Central state + mutation helpers
    ├── wizard.js           # Step routing, Next/Back logic
    ├── steps/
    │   ├── step1.js        # Version selectors + BOM preview
    │   ├── step2.js        # Topology builder (WLDs + clusters)
    │   └── step3.js        # Summary + Generate trigger
    └── excel/
        ├── styles.js       # ExcelJS style constants
        ├── rows.js         # Row/cell writers + domain merge logic
        └── generator.js    # Workbook orchestration + download
```

---

## Excel output matches original Python CLI

| Feature | Status |
|---|---|
| Title row merged across 8 columns | ✓ |
| Header row (dark blue bg, white text) | ✓ |
| Domain cell vertically merged per group | ✓ |
| Cluster rows with grey cluster label | ✓ |
| Healthy = green text, Pending = amber text | ✓ |
| Frozen panes at row 3 | ✓ |
| Column widths preserved | ✓ |
