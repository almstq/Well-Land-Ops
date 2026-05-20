/**
 * Seeds app_users from existing staff records in PostgreSQL.
 * Default password for each staff member = their Staff ID (lowercase).
 * HOD admin account: username=admin, password=wlops2025
 *
 * Run after migrate.js: node db/seedUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();
  try {
    // Get existing staff from migrated data
    const { rows } = await client.query(`
      SELECT data FROM app_data WHERE table_name = 'staff'
    `);
    const staff = rows[0]?.data || [];

    await client.query('BEGIN');

    // HOD admin account
    const adminHash = await bcrypt.hash('wlops2025', SALT_ROUNDS);
    await client.query(`
      INSERT INTO app_users (staff_id, username, password_hash, name, designation, role)
      VALUES ('HOD', 'admin', $1, 'Mushthaq (HOD)', 'Head of Department', 'HOD')
      ON CONFLICT (username) DO NOTHING
    `, [adminHash]);
    console.log('✓ Admin account: admin / wlops2025');

    // Staff accounts
    let created = 0;
    for (const s of staff) {
      const staffId = s['Staff ID'];
      const name = s['Full Name'];
      if (!staffId || !name) continue;

      const username = staffId.toLowerCase().replace(/\s+/g, '.');
      const defaultPw = staffId.toLowerCase();
      const hash = await bcrypt.hash(defaultPw, SALT_ROUNDS);

      const designation = s.Designation || s.Category || '';
      const role = mapRole(designation);

      await client.query(`
        INSERT INTO app_users (staff_id, username, password_hash, name, designation, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (username) DO NOTHING
      `, [staffId, username, hash, name, designation, role]);
      created++;
    }

    await client.query('COMMIT');
    console.log(`✓ ${created} staff accounts created (default password = staff ID lowercase).`);
    console.log('\nIMPORTANT: Have all users change their passwords on first login!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

function mapRole(designation) {
  const d = (designation || '').toLowerCase();
  if (d.includes('hod') || d.includes('head')) return 'HOD';
  if (d.includes('supervisor')) return 'Site Supervisor';
  if (d.includes('procurement')) return 'Procurement';
  if (d.includes('account') || d.includes('finance')) return 'Accounts';
  if (d.includes('store') || d.includes('warehouse')) return 'Store';
  if (d.includes('fleet') || d.includes('driver') || d.includes('operator')) return 'Fleet';
  if (d.includes('marine') || d.includes('vessel') || d.includes('captain')) return 'Marine';
  if (d.includes('compliance') || d.includes('safety') || d.includes('hse')) return 'Compliance';
  return 'Staff';
}

seed().catch(() => process.exit(1));
