/**
 * Seeds data/users.json from staff in data/db.json.
 * Run once: node db/seedUsers.js
 * Safe to re-run — skips existing usernames.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const store  = require('./jsonStore');

const SALT_ROUNDS = 12;

function mapRole(designation) {
  const d = (designation || '').toLowerCase();
  if (d.includes('hod') || d.includes('head'))       return 'HOD';
  if (d.includes('supervisor'))                        return 'Site Supervisor';
  if (d.includes('procurement'))                       return 'Procurement';
  if (d.includes('account') || d.includes('finance')) return 'Accounts';
  if (d.includes('store') || d.includes('warehouse')) return 'Store';
  if (d.includes('fleet') || d.includes('driver') || d.includes('operator')) return 'Fleet';
  if (d.includes('marine') || d.includes('vessel') || d.includes('captain')) return 'Marine';
  if (d.includes('compliance') || d.includes('safety') || d.includes('hse')) return 'Compliance';
  return 'Staff';
}

async function seed() {
  // HOD admin account
  const existing = store.findUserByUsername('admin');
  if (!existing) {
    const hash = await bcrypt.hash('wlops2025', SALT_ROUNDS);
    store.createUser({
      staff_id:      'HOD',
      username:      'admin',
      password_hash: hash,
      name:          'Mushthaq (HOD)',
      designation:   'Head of Department',
      role:          'HOD',
      is_active:     true,
    });
    console.log('✓ Admin account: admin / wlops2025');
  } else {
    console.log('  Admin account already exists — skipped.');
  }

  // Staff accounts from db.json
  const staff = store.getTable('staff');
  let created = 0;
  for (const s of staff) {
    const staffId = s['Staff ID'];
    const name    = s['Full Name'];
    if (!staffId || !name) continue;

    const username = staffId.toLowerCase().replace(/\s+/g, '.');
    if (store.findUserByUsername(username)) continue;   // already exists

    const hash = await bcrypt.hash(staffId.toLowerCase(), SALT_ROUNDS);
    const designation = s.Designation || s.Category || '';
    store.createUser({
      staff_id:      staffId,
      username,
      password_hash: hash,
      name,
      designation,
      role:          mapRole(designation),
      is_active:     true,
    });
    created++;
  }

  console.log(`✓ ${created} staff accounts created (default password = staff ID lowercase).`);
  console.log('\nIMPORTANT: Have all users change passwords on first login!');
}

seed().catch(err => { console.error(err.message); process.exit(1); });
