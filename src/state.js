// Central state for the wizard.
// All wizard steps read from and write to this object via the exported helpers.

let _idCounter = 0;
const uid = () => ++_idCounter;

export const state = {
  sourceVersion: null,
  targetVersion: null,
  mgmtDomain: {
    name: "MGMT",
    clusterName: "mgmt-cluster-1",
    hostCount: 4,
    nsxFederation: false,
  },
  workloadDomains: [],
  generatedAt: null,
  bomOverrides: { target: {} },
};

export function resetBomOverrides() {
  state.bomOverrides = { target: {} };
}

// ── Mutation helpers ──────────────────────────────────────────────────────────

export function addWLD() {
  const id = uid();
  state.workloadDomains.push({
    id,
    name: `PROD${state.workloadDomains.length + 1}`,
    nsxFederation: false,
    clusters: [{ id: uid(), name: `prod${state.workloadDomains.length + 1}-cluster-1`, hostCount: 4 }],
  });
  return id;
}

export function removeWLD(wldId) {
  state.workloadDomains = state.workloadDomains.filter(w => w.id !== wldId);
}

export function addCluster(wldId) {
  const wld = state.workloadDomains.find(w => w.id === wldId);
  if (!wld) return;
  const clusterNum = wld.clusters.length + 1;
  wld.clusters.push({
    id: uid(),
    name: `${wld.name.toLowerCase()}-cluster-${clusterNum}`,
    hostCount: 4,
  });
}

export function removeCluster(wldId, clusterId) {
  const wld = state.workloadDomains.find(w => w.id === wldId);
  if (!wld || wld.clusters.length <= 1) return; // keep at least one cluster
  wld.clusters = wld.clusters.filter(c => c.id !== clusterId);
}
