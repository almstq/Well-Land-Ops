const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Remove pending assets 17, 18, 19, 20
db.assets = db.assets.filter(a => !['WL-HV-0017', 'WL-HV-0018', 'WL-HV-0019', 'WL-HV-0020'].includes(a['Asset ID']));

// 2. Add new location
const locName = 'HQ, Antrac Tower Level 1';
const hqExists = db.locations.some(l => (l.Site || l['Location Name'] || l.name) === locName);
if (!hqExists) {
  db.locations.push({
    "Location ID": "LOC-" + String(db.locations.length + 1).padStart(4, '0'),
    "Site": locName,
    "Type": "Headquarters",
    "Status": "Active"
  });
}

// 3. Assign GM to HQ
const gm = db.staff.find(s => s['Staff ID'] === 'WL-EMP-0030');
if (gm) {
  gm['Current Location'] = locName;
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Database updated successfully.');
