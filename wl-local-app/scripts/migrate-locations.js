const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8").replace(/^\uFEFF/, ""));
const locations = Array.isArray(db.locations) ? db.locations : [];
const seen = new Map(
  locations.map(row => [
    String(row["Location Name"] || row["Location ID"] || "").trim().toLowerCase(),
    row
  ])
);

function clean(value) {
  return String(value || "")
    .replace(/\uFFFD/g, "")
    .replace(/â€”/g, "-")
    .replace(/â€“/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function typeFor(name, source) {
  const lower = name.toLowerCase();
  if (lower.includes("thilafushi")) return "Base";
  if (lower.includes("muthaafushi") || lower.includes("bodufinolhu")) return "Project Site";
  if (lower.includes("transit")) return "Transit";
  if (lower.includes("unknown")) return "Unverified";
  if (source === "suppliers") return "Supplier Location";
  return "Operating Location";
}

function nextLocationId() {
  return `LOC-${String(locations.length + 1).padStart(4, "0")}`;
}

function addLocation(value, source, notes = "") {
  const name = clean(value);
  if (!name) return;
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  const row = {
    "Location ID": nextLocationId(),
    "Location Name": name,
    Type: typeFor(name, source),
    "Island / Area": name,
    Status: key === "unknown" ? "Needs Verification" : "Active",
    "Primary Contact": "",
    Phone: "",
    Notes: notes || `Imported from ${source}`
  };
  locations.push(row);
  seen.set(key, row);
}

addLocation("Thilafushi Base", "seed", "Main maintenance, dispatch, fabrication and support base");
addLocation("Muthaafushi", "seed", "Current fleet recovery/project site");
addLocation("Bodufinolhu", "seed", "Current fleet recovery/project site");
addLocation("Unknown", "seed", "Temporary holding value until location is verified");
addLocation("In Transit", "seed", "Movement between supplier/base/site");

for (const row of db.assets || []) addLocation(row.Site, "assets");
for (const row of db.staff || []) addLocation(row["Current Location"], "staff");
for (const row of db.operators || []) addLocation(row["Current Location"], "operators");
for (const row of db.vessels || []) addLocation(row.Location, "vessels");
for (const row of db.procurement || []) addLocation(row["Site / Location"] || row.Site, "procurement");
for (const row of db.inventory || []) addLocation(row.Location, "inventory");
for (const row of db.transfers || []) {
  addLocation(row.From, "transfers");
  addLocation(row["To Site/Base"], "transfers");
}
for (const row of db.suppliers || []) addLocation(row.Location, "suppliers");
for (const row of db.rentals || []) addLocation(row.Site, "rentals");
for (const row of db.recovery || []) addLocation(row.Site, "recovery");

db.locations = locations;
db.meta = {
  ...(db.meta || {}),
  lastLocationsMigration: new Date().toISOString()
};

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

console.log(JSON.stringify({
  locations: locations.length,
  assets: (db.assets || []).length,
  vessels: (db.vessels || []).length,
  staff: (db.staff || []).length
}, null, 2));
