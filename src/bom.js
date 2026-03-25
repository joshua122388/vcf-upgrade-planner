// BOM (Bill of Materials)
// Source: Dell VCF on VxRail Release Notes
// This is the ONLY file that needs updating when new VCF versions ship.
// Add a new key to BOM matching the version string, then add it to VCF_VERSIONS.

export const BOM = {
  "5.1.0": {
    sddc:    { version: "5.1.0.0",       build: "23480212" },
    nsx:     { version: "4.1.2.1",        build: "23324879" },
    vcenter: { version: "8.0.2.00100",    build: "22617221" },
    vxrail:  { version: "8.0.210",        build: "23484605" },
    esxi:    { version: "8.0.2",          build: "23305546" },
  },
  "5.1.1": {
    sddc:    { version: "5.1.1.0",       build: "23480300" },
    nsx:     { version: "4.1.2.3",        build: "23647243" },
    vcenter: { version: "8.0.2.00200",    build: "22617221" },
    vxrail:  { version: "8.0.212",        build: "23601200" },
    esxi:    { version: "8.0.2",          build: "23305546" },
  },
  "5.2.0": {
    sddc:    { version: "5.2.0.0",       build: "24108943" },
    nsx:     { version: "4.2.0.0",        build: "24105817" },
    vcenter: { version: "8.0.3.00200",    build: "24262322" },
    vxrail:  { version: "8.0.300",        build: "28709350" },
    esxi:    { version: "8.0.3",          build: "24022510" },
  },
  "5.2.1": {
    sddc:    { version: "5.2.1.0",       build: "24500100" },
    nsx:     { version: "4.2.1.0",        build: "24540234" },
    vcenter: { version: "8.0.3.00400",    build: "24596400" },
    vxrail:  { version: "8.0.330",        build: "28900100" },
    esxi:    { version: "8.0 update 3c",  build: "24480200" },
  },
  "5.2.2": {
    sddc:    { version: "5.2.2.0",       build: "24936865" },
    nsx:     { version: "4.2.3",          build: "24866349" },
    vcenter: { version: "8.0 Update 3g",  build: "24853646" },
    vxrail:  { version: "8.0.361",        build: "29253789" },
    esxi:    { version: "8.0 Update 3g",  build: "24859861" },
  },
};

export const VCF_VERSIONS = Object.keys(BOM);
