const fs = require('fs');
const path = require('path');

const DB_PATHS = [
  path.join(__dirname, '../data/db.json'),
  path.join(__dirname, '../../wl-ops-frontend/src/data/initialDb.json'),
  path.join(__dirname, '../../wl-ops-frontend/data/db.json')
];

function normalizeEmail(contact) {
  if (!contact) return '';
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const match = contact.match(emailRegex);
  return match ? match[1] : '';
}

function normalizePhone(contact) {
  if (!contact) return '';
  // Simple phone number finder
  const phoneRegex = /(\+?[0-9]{7,15})/;
  const match = contact.match(phoneRegex);
  return match ? match[1] : '';
}

function normalizeDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`Skipping non-existent database path: ${dbPath}`);
    return;
  }

  console.log(`Normalizing database at: ${dbPath}`);
  const rawData = fs.readFileSync(dbPath, 'utf8');
  let db;
  try {
    db = JSON.parse(rawData);
  } catch (err) {
    console.error(`Failed to parse JSON for ${dbPath}:`, err.message);
    return;
  }

  // 1. Normalize Suppliers
  if (db.suppliers && Array.isArray(db.suppliers)) {
    console.log(`- Found ${db.suppliers.length} suppliers. Normalizing...`);
    db.suppliers = db.suppliers.map(s => {
      const name = s.name || s.Supplier || 'Unnamed Supplier';
      const category = s.category || s.Category || 'General Supply';
      const status = s.status || s.Status || 'Approved';
      const rating = s.rating !== undefined ? s.rating : 4;
      const contactRaw = s.Contact || s.contact || '';
      
      let contactEmail = s.contactEmail || '';
      let contactPhone = s.contactPhone || '';
      let contactName = s.contactName || '';

      if (contactRaw) {
        contactEmail = contactEmail || normalizeEmail(contactRaw);
        contactPhone = contactPhone || normalizePhone(contactRaw);
        contactName = contactName || contactRaw.split(',')[0].trim();
      }

      return {
        ...s,
        id: s.id || `SUP-${Math.random().toString(36).substr(2, 9)}`,
        name,
        Supplier: name,
        category,
        Category: category,
        status,
        Status: status,
        rating,
        contactName: contactName || name,
        contactEmail,
        contactPhone,
        remarks: s.remarks || s.Remarks || '',
        Remarks: s.remarks || s.Remarks || '',
        paymentTerms: s.paymentTerms || s['Credit Terms'] || 'Cash / Advance',
        'Credit Terms': s.paymentTerms || s['Credit Terms'] || 'Cash / Advance',
        leadTime: s.leadTime || '3-5 days',
      };
    });
  }

  // 2. Normalize Inventory
  if (db.inventory && Array.isArray(db.inventory)) {
    console.log(`- Found ${db.inventory.length} inventory stock lines. Normalizing...`);
    db.inventory = db.inventory.map(item => {
      const itemName = item.item || item['Item Name'] || item.itemName || 'Unknown Item';
      const qty = item.qty !== undefined ? item.qty : (item.Quantity !== undefined ? item.Quantity : 1);
      const location = item.location || item.Location || 'Thilafushi - Base';
      
      let normalizedLoc = location;
      if (location === 'Thilafushi Base Store' || location === 'Thilafushi / Tug-01 / Male') {
        normalizedLoc = 'Thilafushi - Base';
      } else if (location === 'Bodufinolhu / Muthaafushi / Male') {
        normalizedLoc = 'Bodufinolhu';
      }

      return {
        ...item,
        id: item.id || `INV-${Math.random().toString(36).substr(2, 9)}`,
        item: itemName,
        'Item Name': itemName,
        qty: Number(qty) || 0,
        Quantity: Number(qty) || 0,
        location: normalizedLoc,
        Location: normalizedLoc,
        Category: item.Category || item.category || 'MRO / General',
        category: item.Category || item.category || 'MRO / General',
        Supplier: item.Supplier || item.supplier || 'Well Land Investment Pvt Ltd',
        supplier: item.Supplier || item.supplier || 'Well Land Investment Pvt Ltd',
        'Unit Price': Number(item['Unit Price'] || item.unitPrice || 0),
        unitPrice: Number(item['Unit Price'] || item.unitPrice || 0),
      };
    });
  }

  // 3. Normalize Master Items Catalog
  if (db.items && Array.isArray(db.items)) {
    console.log(`- Found ${db.items.length} master catalog items. Normalizing...`);
    db.items = db.items.map(item => {
      const name = item.Item || item['Item Name'] || item.name || 'Unknown Item';
      const category = item.Category || item.category || 'MRO / General';
      const supplier = item['Preferred Supplier'] || item.supplier || item.preferredSupplier || '';

      return {
        ...item,
        'Item Name': name,
        name,
        Category: category,
        category,
        'Preferred Supplier': supplier,
        preferredSupplier: supplier,
        'Item Code': item['Item Code'] || item.itemCode || `ITM-${Math.random().toString(36).substr(2, 9)}`,
      };
    });
  }

  // 4. Normalize Issue Reports
  if (db.issueReports && Array.isArray(db.issueReports)) {
    console.log(`- Found ${db.issueReports.length} issue reports. Normalizing...`);
    db.issueReports = db.issueReports.map(issue => {
      const location = issue.location || issue.Location || 'Thilafushi - Base';
      let normalizedLoc = location;
      if (location === 'Thilafushi Base Store') {
        normalizedLoc = 'Thilafushi - Base';
      }

      const parts = issue.parts && Array.isArray(issue.parts) ? issue.parts.map(p => {
        const pName = p.name || p['Item Name'] || 'Unknown Part';
        const pQty = p.qty !== undefined ? p.qty : (p.Quantity !== undefined ? p.Quantity : 1);
        const pSupplier = p.preferredSupplier || p.Supplier || p.supplier || '';

        return {
          ...p,
          name: pName,
          'Item Name': pName,
          qty: Number(pQty) || 1,
          Quantity: Number(pQty) || 1,
          preferredSupplier: pSupplier,
          supplier: pSupplier,
          preferredSupplierName: pSupplier,
        };
      }) : [];

      return {
        ...issue,
        location: normalizedLoc,
        parts
      };
    });
  }

  // Add schema version marker
  db.meta = db.meta || {};
  db.meta.version = 3;
  db.meta.isNormalized_v3 = true;
  db.meta.lastNormalizedAt = new Date().toISOString();

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Successfully normalized database at: ${dbPath}\n`);
}

function run() {
  for (const dbPath of DB_PATHS) {
    normalizeDatabase(dbPath);
  }
}

run();
