/**
 * One-time patch: creates issue reports from existing procurement data,
 * links PRs back to issues, updates asset known-issue fields where confirmed.
 * Run: node patch-issues.js
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const backupPath = path.join(__dirname, 'backups', `db-pre-issue-patch-${Date.now()}.json`);

const raw = fs.readFileSync(dbPath, 'utf8').replace(/^﻿/, '');
const db = JSON.parse(raw);

// Back up first
fs.writeFileSync(backupPath, raw, 'utf8');
console.log('Backup saved to', backupPath);

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const issueReports = [

  // ── IR-0001 ─ WL-HV-0002 VOLVO A40G / Muthaafushi ─ Hydraulic system failure
  {
    id: 'IR-0001',
    assetId: 'WL-HV-0002',
    assetLabel: 'WL-HV-0002 — VOLVO A40G (Hauler Dump Truck)',
    location: 'Muthaafushi',
    reportedBy: 'Janaka / Sampath',
    reportedAt: '2026-03-15T00:00:00.000Z',
    category: 'Hydraulic',
    priority: 'CRITICAL',
    title: 'Hydraulic control valve and hose leaking',
    description: 'Hydraulic control valve and hose are actively leaking on the VOLVO A40G hauler dump truck deployed at Muthaafushi. Machine is operational but losing hydraulic fluid — risk of full system failure if unaddressed.',
    symptoms: 'Visible hydraulic fluid leak at control valve area and along hose run. Possible pressure drop in hydraulic circuit.',
    solutionNotes: 'Replace hydraulic control valve and the leaking hose section. Flush and top up hydraulic fluid after replacement. Pressure-test system before returning to service.',
    parts: [
      {
        partId: 'p-ir001-1',
        name: 'Hydraulic Control Valve',
        partNumber: '',
        isOEM: true,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'OEM Volvo part — confirm part number from machine plate'
      },
      {
        partId: 'p-ir001-2',
        name: 'Hydraulic Hose (high-pressure)',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm hose diameter and length on site'
      }
    ],
    status: 'Parts Requested',
    linkedPRRefs: ['WL-PR-0001'],
    resolvedAt: null,
    resolutionNotes: ''
  },

  // ── IR-0002 ─ WL-HV-0008 KOMATSU PC350 (High Bed) ─ Hydraulic hose burst
  {
    id: 'IR-0002',
    assetId: 'WL-HV-0008',
    assetLabel: 'WL-HV-0008 — KOMATSU PC350 (High Bed Excavator)',
    location: 'Unknown — verify on site',
    reportedBy: 'Sampath (via Janaka)',
    reportedAt: '2026-03-07T00:00:00.000Z',
    category: 'Hydraulic',
    priority: 'CRITICAL',
    title: 'Hydraulic hose burst — machine grounded',
    description: 'Hydraulic hose burst on the KOMATSU PC350 high bed excavator. Machine is grounded and non-operational. Location needs to be verified with site team before dispatching parts.',
    symptoms: 'Hose burst — complete hydraulic fluid loss. Machine unable to operate. Grounded as of 7 March 2026.',
    solutionNotes: 'Identify exact hose spec (diameter, length, fittings, pressure rating) before ordering. Replace burst hose, bleed hydraulic system, refill hydraulic fluid. Confirm machine location first.',
    parts: [
      {
        partId: 'p-ir002-1',
        name: 'Hydraulic Hose (burst section)',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm hose spec on site — diameter, length, end fittings and pressure rating'
      },
      {
        partId: 'p-ir002-2',
        name: 'Hydraulic Fluid (replacement)',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm grade from machine manual — ISO VG 46 or 68 typically'
      }
    ],
    status: 'Parts Requested',
    linkedPRRefs: ['WL-PR-0002'],
    resolvedAt: null,
    resolutionNotes: ''
  },

  // ── IR-0003 ─ WL-HV-0009 KOBELCO SK380 ─ Battery and electrical system failure
  {
    id: 'IR-0003',
    assetId: 'WL-HV-0009',
    assetLabel: 'WL-HV-0009 — KOBELCO SK380 (High Bed Excavator)',
    location: 'Thilafushi — Base',
    reportedBy: 'Project Manager / Thilafushi Supervisor',
    reportedAt: '2026-03-15T00:00:00.000Z',
    category: 'Electrical',
    priority: 'HIGH',
    title: 'Battery failure and full electrical system rectification required',
    description: 'KOBELCO SK380 is experiencing battery failure — machine fails to start or hold charge. Full electrical system inspection needed including battery, wiring harness, terminals, and cable connections.',
    symptoms: 'Machine not starting or starting unreliably. Battery not holding charge. Suspect corroded/damaged battery terminals and wiring. Possible alternator output issue.',
    solutionNotes: 'Replace battery with OEM-spec unit. Overhaul battery wiring — replace cables, fit new clamps and lugs. Test alternator output after battery replacement. Use crocodile clips for temporary testing during diagnosis.',
    parts: [
      {
        partId: 'p-ir003-1',
        name: 'Battery 12V/100A',
        partNumber: '',
        isOEM: true,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'OEM Kobelco spec — confirm exact amp-hour, terminal position and dimensions from machine plate'
      },
      {
        partId: 'p-ir003-2',
        name: 'Battery wires / cable set',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm cable size (mm²) and length required on site'
      },
      {
        partId: 'p-ir003-3',
        name: 'Battery clamps',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 2,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm clamp type (+/-) and terminal size'
      },
      {
        partId: 'p-ir003-4',
        name: 'Cable lugs',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 6,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm lug size to match cable size'
      },
      {
        partId: 'p-ir003-5',
        name: 'Crocodile clips (set)',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'For electrical diagnosis and temporary connections during testing'
      }
    ],
    status: 'Parts Requested',
    linkedPRRefs: ['WL-PR-0003', 'WL-PR-0004', 'WL-PR-0005', 'WL-PR-0006', 'WL-PR-0007'],
    resolvedAt: null,
    resolutionNotes: ''
  },

  // ── IR-0004 ─ Excavator (unidentified) ─ Bucket play and structural wear
  {
    id: 'IR-0004',
    assetId: '',
    assetLabel: 'Unidentified Excavator — verify on site',
    location: 'Unknown — verify on site',
    reportedBy: 'Project Manager / Thilafushi Supervisor',
    reportedAt: '2026-03-15T00:00:00.000Z',
    category: 'Structural',
    priority: 'MEDIUM',
    title: 'Excavator bucket play and bush/pin wear',
    description: 'Excavator bucket has excessive play/vibration indicating worn shims and pins. Bush and pin bolt condition requires inspection. Specific machine not yet confirmed — likely one of the KOMATSU PC350 units.',
    symptoms: 'Excessive bucket movement/vibration during digging. Audible clunking from bucket linkage. Possible worn bushes at pin joints.',
    solutionNotes: 'Inspect bucket linkage pins and bushes. Replace shims to eliminate play. Replace lock nuts if worn. Confirm which specific excavator (WL-HV-0005, 0006, or 0007) before ordering to get correct pin sizes.',
    parts: [
      {
        partId: 'p-ir004-1',
        name: 'Bucket shims (set)',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 1,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm machine and shim sizes before ordering'
      },
      {
        partId: 'p-ir004-2',
        name: 'Pin bolts with lock nuts',
        partNumber: '',
        isOEM: false,
        preferredSupplier: '',
        qty: 4,
        estimatedCost: 0,
        currency: 'MVR',
        notes: 'Confirm diameter, length and thread — measure on site'
      }
    ],
    status: 'Under Review',
    linkedPRRefs: ['WL-PR-0008', 'WL-PR-0009'],
    resolvedAt: null,
    resolutionNotes: 'Asset ID unconfirmed — pending site identification of which excavator'
  },

  // ── IR-0005 ─ Fleet-wide MRO ─ Workshop maintenance tools and consumables
  {
    id: 'IR-0005',
    assetId: '',
    assetLabel: 'Fleet-wide — Workshop & Maintenance Tools',
    location: 'Thilafushi — Base',
    reportedBy: 'Project Manager / Thilafushi Supervisor',
    reportedAt: '2026-03-15T00:00:00.000Z',
    category: 'MRO',
    priority: 'MEDIUM',
    title: 'Workshop MRO tools and maintenance consumables required',
    description: 'General workshop and maintenance tools needed to support ongoing fleet rectification work across all machines. Includes lubrication equipment, welding tools, cleaning equipment, and basic hand tools. These are not tied to a single machine failure — they are essential MRO stock for the maintenance team.',
    symptoms: 'Workshop lacks essential maintenance tools to carry out rectification work on fleet. Technicians unable to complete jobs without these items.',
    solutionNotes: 'Procure all listed MRO items. Store at Thilafushi Base workshop. Welding machine and air compressor are capital items — verify budget approval. All other items are consumables.',
    parts: [
      { partId: 'p-ir005-1', name: 'Grease gun', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm manual or pneumatic — recommend manual for site use' },
      { partId: 'p-ir005-2', name: 'Oil spray gun', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'For lubrication works' },
      { partId: 'p-ir005-3', name: 'Welding machine', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm power rating (200A/250A) — for repair and fabrication' },
      { partId: 'p-ir005-4', name: 'Welding rods (box)', partNumber: '', isOEM: false, preferredSupplier: '', qty: 2, estimatedCost: 0, currency: 'MVR', notes: 'Confirm rod type/size (E6013 typical for general steel)' },
      { partId: 'p-ir005-5', name: 'Grinding wheels (box)', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm grinder disc size (4" or 4.5")' },
      { partId: 'p-ir005-6', name: 'Cup brush', partNumber: '', isOEM: false, preferredSupplier: '', qty: 2, estimatedCost: 0, currency: 'MVR', notes: 'For surface prep before welding/painting' },
      { partId: 'p-ir005-7', name: 'Air compressor', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm capacity (CFM) and power supply available on site' },
      { partId: 'p-ir005-8', name: 'Compressor hose', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm length and fitting type to match compressor' },
      { partId: 'p-ir005-9', name: 'Pressure air gun', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'For blowing down machines and cleaning' },
      { partId: 'p-ir005-10', name: 'Pressure washer', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'For machine cleaning — confirm pressure rating' },
      { partId: 'p-ir005-11', name: 'Water hose', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'To connect to pressure washer — confirm length' },
      { partId: 'p-ir005-12', name: 'Spanners 32/34/36mm (set)', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Open/ring combo — for heavy equipment fasteners' },
      { partId: 'p-ir005-13', name: 'Under coat paint', partNumber: '', isOEM: false, preferredSupplier: '', qty: 2, estimatedCost: 0, currency: 'MVR', notes: 'For repair finishing protection — confirm colour' }
    ],
    status: 'Parts Requested',
    linkedPRRefs: ['WL-PR-0010','WL-PR-0011','WL-PR-0012','WL-PR-0013','WL-PR-0014','WL-PR-0015','WL-PR-0016','WL-PR-0017','WL-PR-0018','WL-PR-0019','WL-PR-0020','WL-PR-0021','WL-PR-0022'],
    resolvedAt: null,
    resolutionNotes: ''
  },

  // ── IR-0006 ─ Site Infrastructure (NOT machine) ─ RO plant & electrical
  {
    id: 'IR-0006',
    assetId: '',
    assetLabel: 'Site Infrastructure — NOT machine-related',
    location: 'Unknown — verify which project site',
    reportedBy: 'Project Manager / Thilafushi Supervisor',
    reportedAt: '2026-03-15T00:00:00.000Z',
    category: 'Other',
    priority: 'MEDIUM',
    title: 'RO plant and site electrical infrastructure items',
    description: 'Electrical items required for RO (reverse osmosis) plant and general site electrical works. These are site utility items — NOT related to heavy machine rectification. Should be tracked separately from machine PRs.',
    symptoms: 'RO plant / site electrical system requires cabling and protection components.',
    solutionNotes: 'Confirm exact site location and specific specs for each item. Treat as a site infrastructure job, not a fleet maintenance job.',
    parts: [
      { partId: 'p-ir006-1', name: 'RO plant cable', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm cable size and length for RO plant connection' },
      { partId: 'p-ir006-2', name: '4 pole 16A circuit breaker', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'For RO electrical panel protection' },
      { partId: 'p-ir006-3', name: '4 core 4sqmm cable', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: 'Confirm length in meters' },
      { partId: 'p-ir006-4', name: 'Extension cables', partNumber: '', isOEM: false, preferredSupplier: '', qty: 2, estimatedCost: 0, currency: 'MVR', notes: 'General site operational use' }
    ],
    status: 'Under Review',
    linkedPRRefs: ['WL-PR-0023','WL-PR-0024','WL-PR-0025','WL-PR-0026'],
    resolvedAt: null,
    resolutionNotes: 'Site utility — keep separate from machine issue tracking'
  }

];

// ─────────────────────────────────────────────────────────────────────────────
// LINK PRs BACK TO ISSUE REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const prToIssue = {
  'WL-PR-0001': 'IR-0001',
  'WL-PR-0002': 'IR-0002',
  'WL-PR-0003': 'IR-0003',
  'WL-PR-0004': 'IR-0003',
  'WL-PR-0005': 'IR-0003',
  'WL-PR-0006': 'IR-0003',
  'WL-PR-0007': 'IR-0003',
  'WL-PR-0008': 'IR-0004',
  'WL-PR-0009': 'IR-0004',
  'WL-PR-0010': 'IR-0005',
  'WL-PR-0011': 'IR-0005',
  'WL-PR-0012': 'IR-0005',
  'WL-PR-0013': 'IR-0005',
  'WL-PR-0014': 'IR-0005',
  'WL-PR-0015': 'IR-0005',
  'WL-PR-0016': 'IR-0005',
  'WL-PR-0017': 'IR-0005',
  'WL-PR-0018': 'IR-0005',
  'WL-PR-0019': 'IR-0005',
  'WL-PR-0020': 'IR-0005',
  'WL-PR-0021': 'IR-0005',
  'WL-PR-0022': 'IR-0005',
  'WL-PR-0023': 'IR-0006',
  'WL-PR-0024': 'IR-0006',
  'WL-PR-0025': 'IR-0006',
  'WL-PR-0026': 'IR-0006',
};

// Tag each PR with its issue ref and update status to 'Parts Requested' for linked issues
db.procurement = db.procurement.map(pr => {
  const ref = prToIssue[pr['PR Ref']];
  if (!ref) return pr;
  return {
    ...pr,
    'Issue Ref': ref,
    'Status': 'Request Received' // keep in Draft stage — user can advance through pipeline
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ASSET KNOWN-ISSUE FIELDS (WL-HV-0009 Kobelco — now confirmed)
// ─────────────────────────────────────────────────────────────────────────────

db.assets = db.assets.map(a => {
  if (a['Asset ID'] === 'WL-HV-0009') {
    return { ...a, 'Known Issue': 'Battery failure + electrical system — IR-0003', Readiness: 'Red', Status: 'Grounded' };
  }
  return a;
});

// ─────────────────────────────────────────────────────────────────────────────
// ENSURE ALL NEW TABLES EXIST
// ─────────────────────────────────────────────────────────────────────────────

if (!db.clients)           db.clients = [];
if (!db.rentalAgreements)  db.rentalAgreements = [];

db.issueReports = issueReports;
db.meta.version = 2;
db.meta.lastSaved = new Date().toISOString();
db.meta.issuePatchApplied = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('\n✓ Patch applied:');
console.log(`  ${issueReports.length} issue reports created`);
console.log(`  ${Object.keys(prToIssue).length} PRs tagged with Issue Ref`);
console.log('  WL-HV-0009 (Kobelco SK380) updated: Readiness → Red, Status → Grounded');
console.log('\nIssue summary:');
issueReports.forEach(i => console.log(`  ${i.id} [${i.priority}] ${i.title}`));
console.log('\nDone. Restart the server if it is running.');
