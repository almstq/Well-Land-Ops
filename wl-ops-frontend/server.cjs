const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = path.join(root, "data");
const backupDir = path.join(root, "backups");
const dbPath = path.join(dataDir, "db.json");
const publicDir = path.join(root, "dist");
const port = Number(process.env.PORT || 8788);

const emptyDb = {
  meta: {
    app: "Well Land Local Ops (React)",
    version: 2,
    storage: "JSON file database",
    lastSaved: null
  },
  assets: [],
  locations: [],
  vessels: [],
  staff: [],
  operators: [],
  assignments: [],
  recovery: [],
  procurement: [],
  paymentRequests: [],
  suppliers: [],
  items: [],
  quotes: [],
  purchaseOrders: [],
  inventory: [],
  transfers: [],
  rentals: [],
  compliance: [],
  calls: [],
  dailyLogs: [],
  janakaDailyLogs: [],
  documentVault: [],
  clients: [],
  rentalAgreements: [],
  issueReports: [],
  supplierCatalog: [],
  transferNotes: []
};

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function normalizeDb(db) {
  const next = { ...emptyDb, ...(db || {}) };
  for (const key of Object.keys(emptyDb)) {
    if (Array.isArray(emptyDb[key]) && !Array.isArray(next[key])) next[key] = [];
  }
  next.meta = { ...emptyDb.meta, ...(next.meta || {}) };
  return next;
}

function readDb() {
  return normalizeDb(readJson(dbPath, emptyDb));
}

function writeDb(db) {
  const next = normalizeDb(db);
  next.meta.lastSaved = new Date().toISOString();
  fs.writeFileSync(dbPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function backupDb(reason = "manual") {
  const db = readDb();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(backupDir, `db-${stamp}-${reason}.json`);
  fs.writeFileSync(file, JSON.stringify(db, null, 2), "utf8");
  return path.basename(file);
}

if (!fs.existsSync(dbPath)) {
  writeDb(emptyDb);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 20_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.normalize(path.join(publicDir, pathname));
  if (!file.startsWith(publicDir)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    // If we're using HashRouter this isn't strictly necessary for client routing
    // but good practice.
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  const ext = path.extname(file).toLowerCase();
  send(res, 200, fs.readFileSync(file), mime[ext] || "application/octet-stream");
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);

    // CORS for dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === "/api/db" && req.method === "GET") {
      return send(res, 200, JSON.stringify(readDb()));
    }

    if (url.pathname === "/api/db" && req.method === "POST") {
      const incoming = JSON.parse(await readBody(req));
      backupDb("autosave-before-write");
      return send(res, 200, JSON.stringify(writeDb(incoming)));
    }

    if (url.pathname === "/api/backup" && req.method === "POST") {
      const file = backupDb("manual");
      return send(res, 200, JSON.stringify({ ok: true, file }));
    }

    if (url.pathname === "/api/export" && req.method === "GET") {
      return send(res, 200, JSON.stringify(readDb(), null, 2));
    }

    const tableMatch = url.pathname.match(/^\/api\/db\/([a-zA-Z]+)$/);
    if (tableMatch && req.method === "GET") {
      const db = readDb();
      const table = tableMatch[1];
      if (!(table in db)) return send(res, 404, JSON.stringify({ error: "Unknown table" }));
      return send(res, 200, JSON.stringify(db[table]));
    }

    if (tableMatch && req.method === "POST") {
      const table = tableMatch[1];
      const body = JSON.parse(await readBody(req));
      const db = readDb();
      if (!(table in emptyDb)) return send(res, 400, JSON.stringify({ error: "Unknown table" }));
      backupDb(`autosave-before-table-${table}`);
      db[table] = Array.isArray(body) ? body : db[table];
      return send(res, 200, JSON.stringify(writeDb(db)));
    }

    if (url.pathname === "/api/stats" && req.method === "GET") {
      const db = readDb();
      const activeRentals = (db.rentalAgreements || []).filter(r => r.status === "Active");
      const dailyRevenue = activeRentals.reduce((s, r) => s + (Number(r.dailyRate) || 0), 0);
      const issueReportsOpen = (db.issueReports || []).filter(i => !["Resolved", "Closed"].includes(i.status)).length;
      const recoveryOpen = (db.recovery || []).filter(i => !["Resolved", "Closed", "Completed"].includes(i.Status)).length;
      const openIssues = issueReportsOpen || recoveryOpen;
      const criticalPRs = (db.procurement || []).filter(p => p.Urgency === "CRITICAL" && p.Status !== "Delivered to Site").length;
      return send(res, 200, JSON.stringify({ activeRentals: activeRentals.length, dailyRevenue, openIssues, criticalPRs }));
    }

    return serveStatic(req, res);
  } catch (err) {
    send(res, 500, JSON.stringify({ error: err.message }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Well Land Ops (React Edition) running at http://127.0.0.1:${port}`);
  console.log(`Database linked to: ${dbPath}`);
});
