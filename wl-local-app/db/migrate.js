/**
 * Migrate existing db.json → PostgreSQL app_data table.
 * Run once: node db/migrate.js
 * Safe to re-run — uses UPSERT.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const dbPath = path.join(__dirname, '../data/db.json');

async function migrate() {
  if (!fs.existsSync(dbPath)) {
    console.log('No db.json found — nothing to migrate.');
    return;
  }

  const raw = fs.readFileSync(dbPath, 'utf8').replace(/^﻿/, '');
  const db = JSON.parse(raw);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let migrated = 0;
    for (const [key, value] of Object.entries(db)) {
      if (key === 'meta') continue;
      if (!Array.isArray(value)) continue;

      await client.query(`
        INSERT INTO app_data (table_name, data, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (table_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [key, JSON.stringify(value)]);

      console.log(`  ✓ ${key} — ${value.length} records`);
      migrated++;
    }

    await client.query('COMMIT');
    console.log(`\nMigration complete: ${migrated} tables transferred.`);

    // Keep db.json as backup
    const backupPath = path.join(__dirname, '../data/db-pre-migration.json');
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Backup saved → ${backupPath}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
