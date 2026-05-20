const express = require('express');
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();
router.use(verifyToken);

const KNOWN_TABLES = new Set([
  'assets', 'locations', 'vessels', 'staff', 'operators', 'assignments',
  'recovery', 'procurement', 'paymentRequests', 'suppliers', 'items',
  'quotes', 'purchaseOrders', 'inventory', 'transfers', 'rentals',
  'compliance', 'dailyLogs', 'clients', 'rentalAgreements', 'issueReports',
  'supplierCatalog', 'transferNotes', 'calls', 'janakaDailyLogs', 'documentVault',
]);

// GET /api/db — full database snapshot
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT table_name, data FROM app_data ORDER BY table_name');
    const db = {};
    for (const row of rows) {
      db[row.table_name] = row.data;
    }
    res.json(db);
  } catch (err) {
    console.error('GET /api/db error:', err.message);
    res.status(500).json({ error: 'Database read failed' });
  }
});

// POST /api/db — full database write (use sparingly)
router.post('/', async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(incoming)) {
      if (key === 'meta') continue;
      if (!Array.isArray(value)) continue;
      if (!KNOWN_TABLES.has(key)) continue;

      await client.query(`
        INSERT INTO app_data (table_name, data, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (table_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [key, JSON.stringify(value)]);
    }
    await client.query('COMMIT');
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/db error:', err.message);
    res.status(500).json({ error: 'Database write failed' });
  } finally {
    client.release();
  }
});

// GET /api/db/:table
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  if (!KNOWN_TABLES.has(table)) {
    return res.status(404).json({ error: 'Unknown table' });
  }
  try {
    const { rows } = await pool.query('SELECT data FROM app_data WHERE table_name = $1', [table]);
    res.json(rows[0]?.data ?? []);
  } catch (err) {
    res.status(500).json({ error: 'Database read failed' });
  }
});

// POST /api/db/:table — per-table update (preferred over full write)
router.post('/:table', async (req, res) => {
  const { table } = req.params;
  if (!KNOWN_TABLES.has(table)) {
    return res.status(400).json({ error: 'Unknown table' });
  }
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Body must be an array' });
  }
  try {
    await pool.query(`
      INSERT INTO app_data (table_name, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (table_name)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `, [table, JSON.stringify(data)]);
    res.json({ ok: true, table, count: data.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error(`POST /api/db/${table} error:`, err.message);
    res.status(500).json({ error: 'Table write failed' });
  }
});

// POST /api/backup — manual backup to JSON file
router.post('/backup', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT table_name, data FROM app_data');
    const db = {};
    for (const row of rows) db[row.table_name] = row.data;

    const backupDir = path.join(__dirname, '../backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(backupDir, `backup-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf8');
    res.json({ ok: true, file: path.basename(file) });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// GET /api/export
router.get('/export', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT table_name, data FROM app_data');
    const db = {};
    for (const row of rows) db[row.table_name] = row.data;
    res.setHeader('Content-Disposition', `attachment; filename="wl-ops-export-${Date.now()}.json"`);
    res.json(db);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
