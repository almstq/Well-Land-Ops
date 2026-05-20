const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appRoot = __dirname;
const sourcePortal = path.join(appRoot, "..", "WL_Ops_Portal.html");
const dbPath = path.join(appRoot, "data", "db.json");
const html = fs.readFileSync(sourcePortal, "utf8");

const seedMatch = html.match(/const SEED = (\{[\s\S]*?\});\s*\/\/ ============= RECOVERY REPORT DATA/);
if (!seedMatch) throw new Error("Could not find SEED in WL_Ops_Portal.html");
const seed = JSON.parse(seedMatch[1]);

const reportMatch = html.match(/const REPORT_DATA = [\s\S]*?REPORT_DATA\.materials = PROCUREMENT_SEED;/);
if (!reportMatch) throw new Error("Could not find report/procurement seed in WL_Ops_Portal.html");
const sandbox = {};
vm.runInNewContext(`${reportMatch[0]}\nthis.OUT = { REPORT_DATA, PROCUREMENT_SEED };`, sandbox);
const report = sandbox.OUT.REPORT_DATA;

function clean(value) {
  return String(value ?? "")
    .replace(/â€”/g, "-")
    .replace(/âœ“/g, "Yes")
    .replace(/âœ—/g, "No")
    .replace(/âš /g, "Verify")
    .trim();
}

function vehicleName(row) {
  return [row.Brand, row.Model].map(clean).filter(Boolean).join(" ");
}

const assets = (seed.fleet || []).map(row => ({
  "Asset ID": clean(row["Fleet ID"]),
  "Type": clean(row["Vehicle Type"]),
  "Brand": clean(row.Brand),
  "Model": clean(row.Model),
  "Site": clean(row["Current Location"]),
  "Status": clean(row.Status),
  "Readiness": clean(row.Condition) === "Good" ? "Green" : clean(row.Condition) === "Issue" ? "Red" : "Unknown",
  "Assigned Operator": clean(row["Operator Assigned"]),
  "Hour Meter": clean(row["Engine Hours"]),
  "Known Issue": clean(row["Known Issue"]),
  "Last Service": clean(row["Last Maintenance"]),
  "Next Service": clean(row["Next Maint Due"]),
  "Notes": ""
}));

const staff = (seed.staff || []).map(row => ({
  "Staff ID": clean(row["Staff ID"]),
  "Full Name": clean(row["Full Name"]),
  "Designation": clean(row.Designation),
  "Nationality": clean(row.Nationality),
  "Category": clean(row.Category),
  "Operator?": clean(row["Operator?"]),
  "Status": clean(row.Status),
  "Current Location": clean(row["Current Location"]),
  "Assigned Asset": clean(row["Assigned Asset/Vessel"]),
  "Permit No.": clean(row["Permit No."]),
  "Permit Expiry": clean(row["Permit Expiry"]),
  "Work Permit Status": clean(row["Work Permit Status"]),
  "Contact No.": clean(row["Contact No."]),
  "Notes": clean(row.Notes)
}));

const operators = (seed.operators || []).map(row => ({
  "Staff ID": clean(row["Staff ID"]),
  "Full Name": clean(row["Full Name"]),
  "Role": clean(row["Operator Role"]),
  "Status": clean(row.Status),
  "Current Location": clean(row["Current Location"]),
  "Assigned Asset ID": clean(row["Assigned Asset ID"]),
  "Asset Description": clean(row["Asset Description"]),
  "Licence / Class": clean(row["Licence No. / Class"]),
  "Can Operate?": clean(row["Licence No. / Class"]).toLowerCase().includes("cannot") ? "No" : "Yes",
  "Notes": clean(row.Notes)
}));

const assignments = operators
  .filter(row => row["Assigned Asset ID"])
  .map((row, index) => ({
    "Assignment ID": `ASN-${String(index + 1).padStart(4, "0")}`,
    "Date": "",
    "Asset ID": row["Assigned Asset ID"],
    "Asset Name": row["Asset Description"],
    "Operator ID": row["Staff ID"],
    "Operator Name": row["Full Name"],
    "Site": row["Current Location"],
    "Shift / Period": "",
    "Status": row.Status,
    "Notes": row.Notes
  }));

const recovery = (report.recovery || []).map(row => ({
  "Recovery ID": clean(row.ID),
  "Asset ID": clean(row["Asset Ref"]),
  "Site": clean(row.Site),
  "Machine": clean(row.Machine),
  "Issue": clean(row.Issue),
  "Current Action": clean(row["Current Action"]),
  "Pending Requirement": clean(row["Pending Requirement"]),
  "Priority": clean(row.Priority),
  "Owner": clean(row.Owner),
  "Status": clean(row.Status),
  "Downtime Start": "",
  "Resolved Date": "",
  "Notes": ""
}));

const procurementFromOldPrs = (seed.prs || []).map(row => ({
  "PR Ref": clean(row["PR Ref"]),
  "Request Date": clean(row.Date),
  "Requested By": clean(row["Raised By"]),
  "Request Source": "Site phone/text",
  "Request Channel": "Phone/Text",
  "Site / Location": clean(row["Site / Location"]),
  "Asset ID": clean(row["Vehicle / Asset Ref"]),
  "Item / Service Requested": clean(row["Item(s) Summary"]),
  "Purpose / Machine Use": "Machine rectification",
  "Specs Needed": clean(row["Status / Notes"]),
  "Urgency": clean(row.Urgency),
  "Status": "Request Received",
  "Verification Status": "Pending Check",
  "RFQ Status": "Not Sent",
  "Quotes Received": clean(row["# Quotes"]),
  "Selected Vendor": clean(row.Vendor),
  "PO No.": clean(row["PO No."]),
  "Payment Request Ref": "",
  "Payment Status": clean(row["FC Approved?"]) === "Yes" ? "Approved" : "Not Requested",
  "Collection Status": clean(row["Dispatched?"]),
  "Invoice Status": "",
  "Delivery Status": clean(row["Delivered?"]),
  "Notes": clean(row["Status / Notes"])
}));

const existingPrRefs = new Set(procurementFromOldPrs.map(row => row["PR Ref"]));
const procurementFromItems = (report.materials || [])
  .filter(row => !existingPrRefs.has(clean(row["PR Ref"])))
  .map(row => ({
    ...row,
    "Asset ID": clean(row["Asset / Project Ref"]),
    "Payment Request Ref": ""
  }));

const procurement = [...procurementFromOldPrs, ...procurementFromItems];

const items = procurementFromItems.map((row, index) => ({
  "Item Code": `ITM-${String(index + 1).padStart(4, "0")}`,
  "Item Name": clean(row["Item / Service Requested"]),
  "Category": "",
  "Standard Specs": clean(row["Specs Needed"]),
  "Unit": "",
  "Frequently Requested?": "Yes",
  "Preferred Supplier": "",
  "Last Price": "",
  "Currency": "MVR",
  "Lead Time": "",
  "Min Stock": "",
  "Notes": clean(row["Purpose / Machine Use"])
}));

const vessels = (seed.vessels || []).map(row => ({ ...row }));
const compliance = (seed.compliance || []).map(row => ({ ...row }));
const rentals = (seed.rentals || []).map(row => ({ ...row }));
const calls = (seed.calls || []).map(row => ({ ...row }));
const dailyLogs = (seed.daily || []).map(row => ({ ...row }));

const db = {
  meta: {
    app: "Well Land Local Ops",
    version: 1,
    storage: "JSON file database",
    migratedFrom: "WL_Ops_Portal.html",
    migratedAt: new Date().toISOString(),
    lastSaved: new Date().toISOString()
  },
  assets,
  vessels,
  staff,
  operators,
  assignments,
  recovery,
  procurement,
  paymentRequests: [],
  suppliers: [],
  items,
  quotes: [],
  purchaseOrders: [],
  inventory: [],
  transfers: [],
  rentals,
  compliance,
  calls,
  dailyLogs
};

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log(`Migrated ${assets.length} assets, ${staff.length} staff, ${procurement.length} procurement rows to ${dbPath}`);
