const express = require('express');
const store = require('../db/jsonStore');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

const KNOWN_TABLES = new Set([
  'assets', 'locations', 'vessels', 'staff', 'operators', 'assignments',
  'recovery', 'procurement', 'paymentRequests', 'suppliers', 'items',
  'quotes', 'purchaseOrders', 'inventory', 'transfers', 'rentals',
  'compliance', 'dailyLogs', 'clients', 'rentalAgreements', 'issueReports',
  'supplierCatalog', 'transferNotes', 'calls', 'janakaDailyLogs', 'documentVault',
]);

// GET /api/db — full snapshot
router.get('/', (req, res) => {
  try {
    const rows = store.getAllTables();
    const db = {};
    for (const row of rows) db[row.table_name] = row.data;
    res.json(db);
  } catch (err) {
    console.error('GET /api/db:', err.message);
    res.status(500).json({ error: 'Database read failed' });
  }
});

// POST /api/db — full write
router.post('/', (req, res) => {
  try {
    store.setAll(req.body || {});
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('POST /api/db:', err.message);
    res.status(500).json({ error: 'Database write failed' });
  }
});

// GET /api/db/export  (must be before /:table)
router.get('/export', (req, res) => {
  try {
    const db = store.snapshot();
    res.setHeader('Content-Disposition', `attachment; filename="wl-ops-export-${Date.now()}.json"`);
    res.json(db);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// POST /api/db/backup  (must be before /:table)
router.post('/backup', (req, res) => {
  try {
    const file = store.manualBackup();
    res.json({ ok: true, file });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// GET /api/db/:table
router.get('/:table', (req, res) => {
  const { table } = req.params;
  if (!KNOWN_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' });
  try {
    res.json(store.getTable(table));
  } catch (err) {
    res.status(500).json({ error: 'Read failed' });
  }
});

// POST /api/db/:table
router.post('/:table', (req, res) => {
  const { table } = req.params;
  if (!KNOWN_TABLES.has(table)) return res.status(400).json({ error: 'Unknown table' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array' });
  try {
    store.setTable(table, req.body);
    res.json({ ok: true, table, count: req.body.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error(`POST /api/db/${table}:`, err.message);
    res.status(500).json({ error: 'Write failed' });
  }
});

module.exports = router;
