/**
 * Run with: node db/schema.js
 * Creates all tables if they don't exist.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('./pool');

const TABLES = [
  'assets', 'locations', 'vessels', 'staff', 'operators', 'assignments',
  'recovery', 'procurement', 'paymentRequests', 'suppliers', 'items',
  'quotes', 'purchaseOrders', 'inventory', 'transfers', 'rentals',
  'compliance', 'dailyLogs', 'clients', 'rentalAgreements', 'issueReports',
  'supplierCatalog', 'transferNotes', 'calls', 'janakaDailyLogs', 'documentVault',
];

async function createSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // App data tables — each row holds one named table's JSONB array
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        table_name  VARCHAR(100) PRIMARY KEY,
        data        JSONB        NOT NULL DEFAULT '[]',
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // Seed empty rows for every known table
    for (const t of TABLES) {
      await client.query(`
        INSERT INTO app_data (table_name, data)
        VALUES ($1, '[]')
        ON CONFLICT (table_name) DO NOTHING
      `, [t]);
    }

    // Users / authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id            SERIAL       PRIMARY KEY,
        staff_id      VARCHAR(100) UNIQUE,
        username      VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name          VARCHAR(255) NOT NULL,
        designation   VARCHAR(255),
        role          VARCHAR(100) NOT NULL DEFAULT 'Staff',
        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        last_login    TIMESTAMPTZ
      )
    `);

    // Refresh tokens (optional — for token rotation)
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         SERIAL      PRIMARY KEY,
        user_id    INTEGER     NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✓ Schema created/verified successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Schema creation failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createSchema().catch(() => process.exit(1));
