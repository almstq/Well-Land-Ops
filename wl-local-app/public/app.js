const schemas = {
  dashboard: { label: "Dashboard" },
  today: { label: "Today Command" },
  assets: {
    label: "Assets",
    key: "Asset ID",
    fields: ["Asset ID","Type","Brand","Model","Site","Status","Readiness","Assigned Operator","Hour Meter","Known Issue","Last Service","Next Service","Notes"],
    columns: ["Asset ID","Type","Brand","Model","Site","Status","Readiness","Assigned Operator","Known Issue"]
  },
  locations: {
    label: "Sites / Locations",
    key: "Location ID",
    fields: ["Location ID","Location Name","Type","Island / Area","Status","Primary Contact","Phone","Notes"],
    columns: ["Location ID","Location Name","Type","Island / Area","Status","Primary Contact","Phone"]
  },
  vessels: {
    label: "Vessels",
    key: "Vessel ID",
    fields: ["Vessel ID","Name/Ref","Type","Status","Location","Drydocked?","Captain in Charge","Crew Assigned","Reg No.","Hull / IMO","Engine 1 Serial","Engine 2 Serial","Capacity/Notes","Permit No.","Permit Expiry","Insurance Expiry","Last Inspection","DryDock Start","DryDock Est. End","Known Issues / Notes"],
    columns: ["Vessel ID","Name/Ref","Type","Status","Location","Captain in Charge","Drydocked?","Permit Expiry","Insurance Expiry"]
  },
  staff: {
    label: "HR Staff",
    key: "Staff ID",
    fields: ["Staff ID","Full Name","Designation","Nationality","Category","Operator?","Status","Current Location","Assigned Asset","Permit No.","Permit Expiry","Work Permit Status","Contact No.","Notes"],
    columns: ["Staff ID","Full Name","Designation","Nationality","Category","Status","Assigned Asset","Permit Expiry"]
  },
  operators: {
    label: "Operators",
    key: "Staff ID",
    fields: ["Staff ID","Full Name","Role","Status","Current Location","Assigned Asset ID","Asset Description","Licence / Class","Can Operate?","Notes"],
    columns: ["Staff ID","Full Name","Role","Status","Current Location","Assigned Asset ID","Can Operate?","Licence / Class"]
  },
  assignments: {
    label: "Operator Assignments",
    key: "Assignment ID",
    fields: ["Assignment ID","Date","Asset ID","Asset Name","Operator ID","Operator Name","Site","Shift / Period","Status","Notes"],
    columns: ["Assignment ID","Date","Asset ID","Asset Name","Operator ID","Operator Name","Site","Status"]
  },
  recovery: {
    label: "Fleet Recovery",
    key: "Recovery ID",
    fields: ["Recovery ID","Asset / Vessel ID","Site","Machine","Issue","Current Action","Pending Requirement","Priority","Owner","Status","Downtime Start","Resolved Date","Notes"],
    columns: ["Recovery ID","Asset / Vessel ID","Site","Machine","Issue","Pending Requirement","Priority","Status","Owner"]
  },
  procurement: {
    label: "Procurement PRs",
    key: "PR Ref",
    fields: ["PR Ref","Request Date","Requested By","Request Source","Request Channel","Site / Location","Asset / Vessel ID","Item / Service Requested","Purpose / Machine Use","Specs Needed","Urgency","Status","Verification Status","RFQ Status","Quotes Received","Selected Vendor","PO No.","Payment Request Ref","Payment Status","Collection Status","Invoice Status","Delivery Status","Notes"],
    columns: ["PR Ref","Request Date","Requested By","Site / Location","Asset / Vessel ID","Item / Service Requested","Urgency","Status","RFQ Status","Selected Vendor","Payment Status","Delivery Status"]
  },
  paymentRequests: {
    label: "Antrac Payment Follow-up",
    key: "Payment Ref",
    fields: ["Payment Ref","Request Date","Sent To","PR Ref","PO No.","Supplier","Purpose","Amount","Currency","Payment Method","Status","Follow-up Date","Accounts Contact","Paid Date","Proof / Ref","SRM Notes","Blocker"],
    columns: ["Payment Ref","Request Date","Sent To","PR Ref","Supplier","Amount","Currency","Status","Follow-up Date","Paid Date","Blocker"]
  },
  suppliers: {
    label: "Suppliers / SRM",
    key: "Supplier ID",
    fields: ["Supplier ID","Supplier Name","Contact Person","Phone / WhatsApp","Email","Location","Supplies Category","Payment Terms","Credit Available?","Reliability","Typical Lead Time","Last Contact","SRM Notes"],
    columns: ["Supplier ID","Supplier Name","Contact Person","Phone / WhatsApp","Supplies Category","Payment Terms","Reliability","Typical Lead Time"]
  },
  items: {
    label: "Item Catalog",
    key: "Item Code",
    fields: ["Item Code","Item Name","Category","Standard Specs","Unit","Frequently Requested?","Preferred Supplier","Last Price","Currency","Lead Time","Min Stock","Notes"],
    columns: ["Item Code","Item Name","Category","Standard Specs","Unit","Preferred Supplier","Last Price","Lead Time"]
  },
  quotes: {
    label: "Quote Comparison",
    key: "Quote Ref",
    fields: ["Quote Ref","PR Ref","Item / Service","Supplier ID","Supplier Name","Quote Date","Qty","Unit","Unit Price","Currency","Total Amount","Delivery Cost","Lead Time","Availability","Payment Terms","Compliant?","Warranty / Notes","Quote Valid Until","Status"],
    columns: ["Quote Ref","PR Ref","Item / Service","Supplier Name","Qty","Unit Price","Currency","Total Amount","Lead Time","Payment Terms","Compliant?","Status"]
  },
  purchaseOrders: {
    label: "Purchase Orders",
    key: "PO No.",
    fields: ["PO No.","PO Date","PR Ref","Supplier","Amount","Currency","Status","Payment Ref","Expected Collection","Collected Date","Invoice No.","Notes"],
    columns: ["PO No.","PO Date","PR Ref","Supplier","Amount","Currency","Status","Payment Ref","Expected Collection","Invoice No."]
  },
  inventory: {
    label: "Inventory",
    key: "Stock ID",
    fields: ["Stock ID","Item Name","Specs","Category","Qty On Hand","Unit","Location","Source PR","PO No.","Supplier","Unit Cost","Currency","Last GRN","Status","Notes"],
    columns: ["Stock ID","Item Name","Specs","Qty On Hand","Unit","Location","Source PR","Supplier","Status"]
  },
  transfers: {
    label: "GRN / Transfers",
    key: "Doc Ref",
    fields: ["Doc Ref","Date","Type","From","To Site/Base","Item Name","Specs","Qty","Unit","Source PR","PO No.","Supplier","Received By","Issued By","GRN Status","Transfer Status","Notes"],
    columns: ["Doc Ref","Date","Type","From","To Site/Base","Item Name","Qty","Unit","Source PR","GRN Status","Transfer Status"]
  },
  rentals: {
    label: "Rentals",
    key: "Inquiry Ref",
    fields: ["Inquiry Ref","Date","Customer","Contact","Vehicle Type Requested","Duration / Dates","Site","Available?","Unavailability Reason","Quotation Sent?","Confirmed?","Quoted Amt (MVR)","Actual Amt (MVR)","Decline Reason / Notes"],
    columns: ["Inquiry Ref","Date","Customer","Vehicle Type Requested","Site","Available?","Confirmed?","Quoted Amt (MVR)"]
  },
  compliance: {
    label: "Compliance",
    key: "Ref",
    fields: ["Ref","Category","Description","Entity","Asset / Ref","Frequency","Last Paid / Filed","Amount (MVR)","Next Due Date","Responsible","Status / Notes"],
    columns: ["Ref","Category","Description","Entity","Frequency","Next Due Date","Responsible","Status / Notes"]
  },
  dailyLogs: {
    label: "Daily Logs",
    key: "Date",
    fields: ["Date","Fleet / Recovery","Procurement / RFQ","Payments / Finance","Inventory / Dispatch","Rentals","HR / Compliance","Director / Board","Tomorrow Top 3","Notes"],
    columns: ["Date","Fleet / Recovery","Procurement / RFQ","Payments / Finance","Inventory / Dispatch","Tomorrow Top 3"]
  }
};

const nav = ["dashboard","today","assets","vessels","locations","staff","operators","assignments","recovery","procurement","paymentRequests","suppliers","items","quotes","purchaseOrders","inventory","transfers","rentals","compliance","dailyLogs"];
const prefixes = { assets:"WL-HV", vessels:"WL-MV", locations:"LOC", assignments:"ASN", recovery:"RC", procurement:"WL-PR", paymentRequests:"PAY", suppliers:"SUP", items:"ITM", quotes:"QT", purchaseOrders:"PO", inventory:"STK", transfers:"DOC", rentals:"WL-RI" };
const selectOptions = {
  Status: ["Open","Request Received","Specs Required","Verified","RFQ Sent","Quotes Received","Approval Pending","PO Created","Payment Requested","Payment Done","Items Collected","Invoice Collected","Delivered to Site","Closed","Rejected","Active","Standby","Grounded","Available","In Transit"],
  Readiness: ["Green","Amber","Red","Unknown"],
  Urgency: ["CRITICAL","URGENT","ROUTINE","High","Medium","Low"],
  "Payment Status": ["Not Requested","Sent to Antrac Accounts","Followed Up","Approved","Paid","Proof Received","Blocked","Closed"],
  "Credit Available?": ["No","Yes","Case by case"],
  Reliability: ["Preferred","Good","Average","Use only if urgent","Do not use"],
  "Compliant?": ["Yes","No","Partial","Pending Check"],
  "Can Operate?": ["Yes","No","Permit/Licence Pending"],
  "GRN Status": ["Pending","Received - Qty OK","Received - Short","Received - Damaged","Invoice Pending","Closed"],
  "Transfer Status": ["Pending Dispatch","In Transit","Delivered","Received by Site","Closed"]
};

let db = null;
let active = localStorage.getItem("wl_local_active") || "dashboard";
let editing = null;
let query = "";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);

async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function load() {
  db = await api("/api/db");
  normalizeRelationships();
  render();
}

function normalizeRelationships() {
  if (!Array.isArray(db.locations)) db.locations = [];
  for (const row of db.recovery || []) {
    if (!row["Asset / Vessel ID"] && row["Asset ID"]) row["Asset / Vessel ID"] = row["Asset ID"];
  }
  for (const row of db.procurement || []) {
    if (!row["Asset / Vessel ID"] && row["Asset ID"]) row["Asset / Vessel ID"] = row["Asset ID"];
  }
  for (const row of db.staff || []) {
    if (!row["Assigned Asset"] && row["Assigned Asset/Vessel"]) row["Assigned Asset"] = row["Assigned Asset/Vessel"];
  }
  for (const row of db.assets || []) {
    const match = String(row["Assigned Operator"] || "").match(/(WL-EMP-\d+)/);
    if (match) row["Assigned Operator"] = match[1];
  }
}

async function save() {
  db = await api("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(db)
  });
  toast("Saved to data/db.json");
}

async function backup() {
  const result = await api("/api/backup", { method: "POST" });
  toast(`Backup created: ${result.file}`);
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function render() {
  renderNav();
  $("title").textContent = schemas[active].label;
  $("subtitle").textContent = subtitle(active);
  $("topActions").innerHTML = topActions(active);
  if (active === "dashboard") return renderDashboard();
  if (active === "today") return renderToday();
  renderTable(active);
}

function renderNav() {
  $("nav").innerHTML = nav.map(id => `<button class="${id === active ? "active" : ""}" onclick="setActive('${id}')">${esc(schemas[id].label)}${Array.isArray(db[id]) ? ` (${db[id].length})` : ""}</button>`).join("");
}

function setActive(id) {
  active = id;
  query = "";
  localStorage.setItem("wl_local_active", id);
  render();
}

function subtitle(id) {
  const text = {
    dashboard: "Live local overview from JSON database.",
    today: "Time-blocked one-person operating rhythm.",
    locations: "Master list for sites, bases, islands, suppliers yards and operating locations.",
    vessels: "Marine assets with location, captain, crew and compliance visibility.",
    procurement: "Convert phone/text requests into RFQ, quotes, PO, payment, collection and delivery.",
    paymentRequests: "Finance executive view: payment requests sent to Antrac Accounts and SRM follow-up.",
    quotes: "Compare suppliers and choose the lowest compliant quote unless lead time/payment/reliability says otherwise.",
    inventory: "Stock after payment, collection and GRN.",
    transfers: "GRN, dispatch and transfers to sites or Thilafushi base.",
    assignments: "Match operators to actual fleet assets."
  };
  return text[id] || "Editable records saved locally.";
}

function topActions(id) {
  if (["dashboard","today"].includes(id)) return "";
  return `<button onclick="openForm('${id}')">Add ${esc(schemas[id].key)}</button><button class="ghost" onclick="exportCsv('${id}')">Export CSV</button>`;
}

function renderDashboard() {
  const assets = db.assets || [];
  const vessels = db.vessels || [];
  const procurementOpen = (db.procurement || []).filter(x => !["Closed","Rejected","Delivered to Site"].includes(x.Status || "")).length;
  const paymentOpen = (db.paymentRequests || []).filter(x => !["Paid","Closed"].includes(x.Status || "")).length;
  const recoveryHigh = (db.recovery || []).filter(x => ["High","CRITICAL"].includes(x.Priority || "") && !["Closed","Completed","Operational"].includes(x.Status || "")).length;
  const unassignedAssets = assets.filter(a => !(a["Assigned Operator"] || "")).length;
  const assignedAssets = assets.length - unassignedAssets;
  const redAssets = assets.filter(a => String(a.Readiness || "").toLowerCase() === "red").length;
  const amberOrUnknown = assets.filter(a => ["amber","unknown",""].includes(String(a.Readiness || "").toLowerCase())).length;
  const pendingTransfers = (db.transfers || []).filter(t => !["Closed","Received by Site"].includes(t["Transfer Status"] || "")).length;
  $("content").innerHTML = `
    <div class="dashboard-actions">
      <button onclick="openForm('assets')">Add Asset</button>
      <button class="ghost" onclick="openForm('assignments')">Assign Operator</button>
      <button class="ghost" onclick="openForm('recovery')">Log Recovery Issue</button>
      <button class="ghost" onclick="openForm('procurement')">Create Phone/Text PR</button>
    </div>
    <div class="kpis">
      ${kpi("Fleet Assets", assets.length, `${assignedAssets} assigned / ${unassignedAssets} open`, unassignedAssets ? "warn" : "good")}
      ${kpi("Red Assets", redAssets, "not rentable until cleared", redAssets ? "bad" : "good")}
      ${kpi("Amber / Unknown", amberOrUnknown, "needs verification", amberOrUnknown ? "warn" : "good")}
      ${kpi("Vessels", vessels.length, "marine assets", "")}
      ${kpi("Locations", db.locations.length, "sites and bases", "")}
      ${kpi("Recovery High", recoveryHigh, "machine blockers", recoveryHigh ? "bad" : "good")}
      ${kpi("Procurement Open", procurementOpen, "phone/text PR pipeline", procurementOpen ? "warn" : "good")}
      ${kpi("Payment Follow-up", paymentOpen, "Antrac Accounts", paymentOpen ? "bad" : "good")}
      ${kpi("GRN / Transfers", pendingTransfers, "pending dispatch", pendingTransfers ? "warn" : "good")}
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>Asset Readiness by Site</h3>
        ${assetSiteSummary()}
      </div>
      <div class="panel">
        <h3>Readiness Mix</h3>
        ${readinessBars()}
      </div>
    </div>
    <div class="panel">
      <h3>Assets Needing Attention</h3>
      ${assetAttentionTable()}
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>Operator Assignment Gaps</h3>
        ${operatorGapTable()}
      </div>
      <div class="panel">
        <h3>Location Picture</h3>
        ${locationOverview()}
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>Open Asset-Linked PRs</h3>
        ${assetLinkedPrs()}
      </div>
      <div class="panel">
        <h3>Priority Work</h3>
        <div class="list">
          ${priorityList().join("") || `<p class="note">No urgent blockers recorded.</p>`}
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>Quote Recommendation</h3>
      ${quoteRecommendations()}
    </div>
  `;
}

function kpi(label, value, detail, tone) {
  return `<div class="kpi"><span>${esc(label)}</span><strong class="${tone || ""}">${esc(value)}</strong><small>${esc(detail)}</small></div>`;
}

function isOpenStatus(value) {
  return !["Closed","Rejected","Delivered to Site","Completed","Operational","Paid"].includes(value || "");
}

function assetLabel(asset) {
  return `${asset["Asset ID"] || ""} ${asset.Brand || ""} ${asset.Model || ""}`.replace(/\s+/g, " ").trim();
}

function operatorLabel(id) {
  if (!id) return "";
  const person = [...(db.operators || []), ...(db.staff || [])].find(row => row["Staff ID"] === id);
  return person ? `${person["Full Name"] || id} (${id})` : id;
}

function linkedCount(section, assetId) {
  if (!assetId) return 0;
  return (db[section] || []).filter(row => isOpenStatus(row.Status || row["Payment Status"] || row["Transfer Status"]) && (
    row["Asset / Vessel ID"] === assetId ||
    row["Asset ID"] === assetId ||
    row["Assigned Asset ID"] === assetId ||
    row["Asset / Ref"] === assetId
  )).length;
}

function dashboardTable(headers, rows, empty = "No records to show.") {
  if (!rows.length) return `<p class="note">${esc(empty)}</p>`;
  return `
    <div class="table-wrap compact">
      <table>
        <thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function assetSiteSummary() {
  const map = new Map();
  for (const asset of db.assets || []) {
    const site = asset.Site || "Unassigned";
    if (!map.has(site)) map.set(site, { total: 0, green: 0, amber: 0, red: 0, unknown: 0, recovery: 0, prs: 0 });
    const row = map.get(site);
    row.total += 1;
    const readiness = String(asset.Readiness || "Unknown").toLowerCase();
    if (readiness === "green") row.green += 1;
    else if (readiness === "amber") row.amber += 1;
    else if (readiness === "red") row.red += 1;
    else row.unknown += 1;
    row.recovery += linkedCount("recovery", asset["Asset ID"]);
    row.prs += linkedCount("procurement", asset["Asset ID"]);
  }
  const rows = [...map.entries()]
    .sort((a, b) => b[1].red - a[1].red || b[1].unknown - a[1].unknown || a[0].localeCompare(b[0]))
    .map(([site, row]) => [
      esc(site),
      esc(row.total),
      `<span class="chip good">${esc(row.green)}</span>`,
      `<span class="chip warn">${esc(row.amber)}</span>`,
      `<span class="chip bad">${esc(row.red)}</span>`,
      esc(row.unknown),
      row.recovery ? `<span class="chip bad">${esc(row.recovery)}</span>` : "0",
      row.prs ? `<span class="chip warn">${esc(row.prs)}</span>` : "0"
    ]);
  return dashboardTable(["Site","Assets","Green","Amber","Red","Unknown","Recovery","PRs"], rows);
}

function readinessBars() {
  const total = Math.max((db.assets || []).length, 1);
  const counts = ["Green","Amber","Red","Unknown"].map(label => ({
    label,
    count: (db.assets || []).filter(asset => String(asset.Readiness || "Unknown").toLowerCase() === label.toLowerCase()).length
  }));
  return `<div class="bar-list">${counts.map(row => {
    const pct = Math.round((row.count / total) * 100);
    const tone = row.label === "Green" ? "good" : row.label === "Red" ? "bad" : "warn";
    return `<div class="bar-row"><div><strong>${esc(row.label)}</strong><span class="note">${esc(row.count)} assets</span></div><div class="bar"><span class="${tone}" style="width:${pct}%"></span></div><strong>${pct}%</strong></div>`;
  }).join("")}</div>`;
}

function assetAttentionTable() {
  const rows = (db.assets || [])
    .filter(asset => {
      const issue = String(asset["Known Issue"] || "").trim();
      const readiness = String(asset.Readiness || "").toLowerCase();
      return readiness !== "green" || (issue && issue !== "-");
    })
    .slice(0, 12)
    .map(asset => {
      const recovery = linkedCount("recovery", asset["Asset ID"]);
      const prs = linkedCount("procurement", asset["Asset ID"]);
      return [
        esc(assetLabel(asset)),
        esc(asset.Site || ""),
        renderCell("Readiness", asset.Readiness || "Unknown"),
        esc(operatorLabel(asset["Assigned Operator"]) || "Not assigned"),
        esc(asset["Known Issue"] || ""),
        `${recovery ? `<span class="chip bad">${recovery} recovery</span>` : ""} ${prs ? `<span class="chip warn">${prs} PR</span>` : ""}` || `<span class="note">No linked work</span>`
      ];
    });
  return dashboardTable(["Asset","Site","Readiness","Operator","Known Issue","Linked Work"], rows, "No asset issues recorded.");
}

function operatorGapTable() {
  const rows = (db.assets || [])
    .filter(asset => !(asset["Assigned Operator"] || ""))
    .slice(0, 10)
    .map(asset => [
      esc(assetLabel(asset)),
      esc(asset.Site || ""),
      renderCell("Readiness", asset.Readiness || "Unknown"),
      `<button class="ghost" onclick="openAssignmentForAsset(${(db.assets || []).indexOf(asset)})">Assign</button>`
    ]);
  return dashboardTable(["Asset","Site","Readiness","Action"], rows, "All listed assets have assigned operators.");
}

function locationOverview() {
  const names = new Set((db.locations || []).map(row => row["Location Name"]).filter(Boolean));
  for (const asset of db.assets || []) if (asset.Site) names.add(asset.Site);
  for (const staff of db.staff || []) if (staff["Current Location"]) names.add(staff["Current Location"]);
  const rows = [...names].sort().slice(0, 12).map(name => {
    const assets = (db.assets || []).filter(asset => asset.Site === name).length;
    const vessels = (db.vessels || []).filter(vessel => vessel.Location === name).length;
    const staff = (db.staff || []).filter(person => person["Current Location"] === name).length;
    const prs = (db.procurement || []).filter(pr => isOpenStatus(pr.Status) && (pr["Site / Location"] === name || pr.Site === name)).length;
    return [esc(name), esc(assets), esc(vessels), esc(staff), prs ? `<span class="chip warn">${esc(prs)}</span>` : "0"];
  });
  return dashboardTable(["Location","Assets","Vessels","Staff","Open PRs"], rows);
}

function assetLinkedPrs() {
  const rows = (db.procurement || [])
    .filter(pr => isOpenStatus(pr.Status) && (pr["Asset / Vessel ID"] || pr["Asset ID"]))
    .slice(0, 10)
    .map(pr => [
      esc(pr["PR Ref"] || ""),
      esc(pr["Asset / Vessel ID"] || pr["Asset ID"] || ""),
      esc(pr["Item / Service Requested"] || ""),
      esc(pr["Site / Location"] || pr.Site || ""),
      renderCell("Urgency", pr.Urgency || ""),
      renderCell("Status", pr.Status || "")
    ]);
  return dashboardTable(["PR","Asset / Vessel","Requested Item","Site","Urgency","Status"], rows, "No open PRs are linked to assets yet.");
}

function priorityList() {
  const items = [];
  db.recovery.filter(x => x.Priority === "High").slice(0, 4).forEach(x => items.push(block(`${x["Recovery ID"] || ""} ${x.Machine || ""}`, x["Pending Requirement"] || x.Issue || "", "bad")));
  db.paymentRequests.filter(x => !["Paid","Closed"].includes(x.Status || "")).slice(0, 4).forEach(x => items.push(block(`${x["Payment Ref"] || ""} ${x.Supplier || ""}`, `${x.Amount || ""} ${x.Currency || ""} - ${x.Status || ""}`, "warn")));
  db.procurement.filter(x => ["Specs Required","Request Received"].includes(x.Status || "")).slice(0, 4).forEach(x => items.push(block(`${x["PR Ref"] || ""} ${x["Item / Service Requested"] || ""}`, "Verify specs and send RFQ", "warn")));
  return items;
}

function block(title, detail, tone = "") {
  return `<div class="block"><strong>${esc(title)}</strong><span class="note">${esc(detail)}</span></div>`;
}

function quoteRecommendations() {
  const grouped = {};
  db.quotes.forEach(q => {
    const ref = q["PR Ref"] || "No PR";
    grouped[ref] = grouped[ref] || [];
    grouped[ref].push(q);
  });
  const rows = Object.entries(grouped).map(([ref, quotes]) => {
    const valid = quotes.filter(q => Number(q["Total Amount"]) > 0 && (q["Compliant?"] || "") !== "No" && !["Rejected","Expired"].includes(q.Status || ""))
      .sort((a,b) => Number(a["Total Amount"]) - Number(b["Total Amount"]));
    if (!valid.length) return `<li>${esc(ref)}: no compliant priced quote yet</li>`;
    const best = valid[0];
    return `<li>${esc(ref)}: recommend <strong>${esc(best["Supplier Name"] || best["Supplier ID"])}</strong> at ${esc(best.Currency)} ${esc(best["Total Amount"])}. Check ${esc(best["Lead Time"] || "lead time")} and ${esc(best["Payment Terms"] || "payment terms")}.</li>`;
  });
  return `<ul>${rows.join("") || "<li>No quotes entered yet.</li>"}</ul>`;
}

function renderToday() {
  const schedule = [
    ["06:45-07:15","Command scan","Read site messages, payment queue, machine blockers and compliance alerts."],
    ["07:15-07:45","Plan the day","Choose one fleet, procurement, finance and system-building outcome."],
    ["08:00-08:30","Site report calls","Collect machine status, operator attendance, new requests, photos/specs."],
    ["08:30-09:15","Fleet recovery triage","Update recovery and asset readiness."],
    ["09:15-10:45","Procurement intake + RFQ","Convert phone/text requests into PRs, verify specs, send RFQs."],
    ["10:45-11:30","Antrac Accounts follow-up","Send and chase payment requests, protect supplier relationships."],
    ["11:30-12:15","Supplier decision","Compare quotes and choose vendor."],
    ["13:15-14:45","Collection, GRN, transfer","Collect paid items/invoices, create stock, dispatch to site/base."],
    ["14:45-15:30","Rental/customer window","Availability checks, quotation and mobilisation follow-up."],
    ["15:30-16:15","Compliance + HR","Work permits, operator assignments, insurance, registration."],
    ["16:15-17:00","Horizon 1 build block","SOPs, KPI register, asset readiness checklist, board dashboard."],
    ["17:00-17:45","Daily close","Log outcomes, blockers, director decisions and tomorrow top 3."]
  ];
  $("content").innerHTML = `
    <div class="banner">You are GM, procurement assistant, finance follow-up, dispatch controller and reporting layer. This day is designed to stop the urgent work from eating the foundation work.</div>
    <div class="grid2">
      <div class="panel"><h3>Live Burden</h3><div class="kpis">
        ${kpi("Procurement", db.procurement.filter(x => !["Closed","Rejected"].includes(x.Status || "")).length, "open")}
        ${kpi("Payments", db.paymentRequests.filter(x => !["Paid","Closed"].includes(x.Status || "")).length, "follow-up")}
        ${kpi("Recovery", db.recovery.filter(x => x.Priority === "High").length, "high")}
        ${kpi("Transfers", db.transfers.filter(x => !["Closed","Received by Site"].includes(x["Transfer Status"] || "")).length, "pending")}
      </div></div>
      <div class="panel"><h3>Quick Add</h3><div class="actions">
        <button onclick="openForm('procurement')">Phone/Text PR</button>
        <button class="ghost" onclick="openForm('paymentRequests')">Payment Request</button>
        <button class="ghost" onclick="openForm('quotes')">Quote</button>
        <button class="ghost" onclick="openForm('transfers')">GRN/Transfer</button>
        <button class="ghost" onclick="openForm('dailyLogs')">Daily Log</button>
      </div></div>
    </div>
    <div class="panel"><h3>Daily Schedule</h3>${schedule.map(row => `<div class="schedule-row"><div class="time">${row[0]}</div><div><strong>${row[1]}</strong><div class="note">${row[2]}</div></div><button class="ghost" onclick="openForm('dailyLogs')">Log</button></div>`).join("")}</div>
  `;
}

function renderTable(id) {
  const schema = schemas[id];
  const rows = (db[id] || []).filter(row => !query || Object.values(row).some(v => String(v || "").toLowerCase().includes(query.toLowerCase())));
  $("content").innerHTML = `
    ${sectionBanner(id)}
    <div class="tools">
      <input class="search" placeholder="Search ${esc(schema.label)}" value="${esc(query)}" oninput="query=this.value;renderTable('${id}')">
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>${schema.columns.map(c => `<th>${esc(c)}</th>`).join("")}<th>Actions</th></tr></thead>
        <tbody>${rows.map((row, idx) => `<tr>${schema.columns.map(c => `<td>${renderCell(c, row[c])}</td>`).join("")}<td>${rowActions(id, row, idx)}</td></tr>`).join("") || `<tr><td colspan="${schema.columns.length + 1}" class="note">No records yet.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function sectionBanner(id) {
  if (id === "paymentRequests") return `<div class="banner bad">This is your SRM protection board: every no-credit supplier payment request sent to Antrac Accounts should be logged, followed up, paid, then linked back to PR/PO and item collection.</div>`;
  if (id === "procurement") return `<div class="banner">Phone/text/site requests become verified PRs, then RFQ, quotes, PO, Antrac payment request, collection, invoice and delivery.</div>`;
  if (id === "assignments") return `<div class="banner">Use this to assign operators to actual assets. Keep permit/licence issues visible before assigning a person to a machine.</div>`;
  if (id === "inventory") return `<div class="banner">When items are paid and collected, receive them here. Then create GRN/Transfer to send to site or base.</div>`;
  return "";
}

function renderCell(col, value) {
  const text = String(value ?? "");
  if (!text) return `<span class="note">-</span>`;
  const lower = text.toLowerCase();
  if (["Status","Readiness","Urgency","Payment Status","Transfer Status","GRN Status","Compliant?"].includes(col)) {
    const tone = lower.includes("critical") || lower.includes("red") || lower.includes("blocked") || lower.includes("required") ? "bad" : lower.includes("pending") || lower.includes("amber") || lower.includes("requested") ? "warn" : lower.includes("paid") || lower.includes("closed") || lower.includes("green") || lower.includes("yes") ? "good" : "";
    return `<span class="chip ${tone}">${esc(text)}</span>`;
  }
  return esc(text);
}

function rowActions(id, row, idx) {
  const actions = [];
  if (id === "procurement") actions.push(`<button class="ghost" onclick="createPaymentFromPR(${idx})">Pay Req</button>`, `<button class="ghost" onclick="createStockFromPR(${idx})">Stock</button>`);
  if (id === "assets") actions.push(`<button class="ghost" onclick="openAssignmentForAsset(${idx})">Assign</button>`);
  if (id === "inventory") actions.push(`<button class="ghost" onclick="createTransferFromStock(${idx})">Dispatch</button>`);
  actions.push(`<button class="ghost" onclick="openForm('${id}',${idx})">Edit</button>`, `<button class="danger" onclick="deleteRow('${id}',${idx})">Del</button>`);
  return `<div class="actions">${actions.join("")}</div>`;
}

function assetOptions(includeVessels = false) {
  const assets = (db.assets || []).map(asset => {
    const label = `${asset["Asset ID"]} - ${asset.Brand || ""} ${asset.Model || ""} (${asset.Site || "No site"})`.replace(/\s+/g, " ").trim();
    return { value: asset["Asset ID"], label };
  });
  const vessels = includeVessels ? (db.vessels || []).map(vessel => {
    const id = vessel["Vessel ID"] || vessel["Name/Ref"];
    const label = `${id} - ${vessel["Name/Ref"] || ""} (${vessel.Status || "No status"})`.replace(/\s+/g, " ").trim();
    return { value: id, label };
  }) : [];
  return [...assets, ...vessels].filter(option => option.value);
}

function operatorOptions() {
  const fromOperators = (db.operators || []).map(operator => ({
    value: operator["Staff ID"],
    label: `${operator["Staff ID"]} - ${operator["Full Name"]} (${operator.Role || operator["Operator Role"] || "Operator"})`
  }));
  const known = new Set(fromOperators.map(option => option.value));
  const fromStaff = (db.staff || [])
    .filter(staff => String(staff["Operator?"] || "").toLowerCase() === "yes" && !known.has(staff["Staff ID"]))
    .map(staff => ({
      value: staff["Staff ID"],
      label: `${staff["Staff ID"]} - ${staff["Full Name"]} (${staff.Designation || "Operator"})`
    }));
  return [...fromOperators, ...fromStaff].filter(option => option.value);
}

function supplierOptions() {
  return (db.suppliers || []).map(supplier => ({
    value: supplier["Supplier Name"] || supplier["Supplier ID"],
    label: `${supplier["Supplier ID"] || ""} - ${supplier["Supplier Name"] || ""}`.replace(/^- /, "")
  })).filter(option => option.value);
}

function locationOptions() {
  return (db.locations || []).map(location => ({
    value: location["Location Name"] || location["Location ID"],
    label: `${location["Location Name"] || location["Location ID"]} (${location.Type || "Location"})`
  })).filter(option => option.value);
}

function prOptions() {
  return (db.procurement || []).map(pr => ({
    value: pr["PR Ref"],
    label: `${pr["PR Ref"]} - ${pr["Item / Service Requested"] || ""}`.trim()
  })).filter(option => option.value);
}

function optionsForField(section, field) {
  if (["Site","Current Location","Site / Location","Location","From","To Site/Base"].includes(field)) return locationOptions();
  if (["Asset ID", "Assigned Asset ID"].includes(field)) return assetOptions(false);
  if (field === "Assigned Asset") return assetOptions(true);
  if (field === "Asset / Vessel ID" || field === "Asset / Ref") return assetOptions(true);
  if (field === "Assigned Operator") return operatorOptions();
  if (field === "Operator ID") return operatorOptions();
  if (["Selected Vendor", "Supplier", "Preferred Supplier", "Supplier Name"].includes(field)) return supplierOptions();
  if (["PR Ref", "Source PR"].includes(field)) return prOptions();
  return null;
}

function optionLabel(options, value) {
  const found = (options || []).find(option => option.value === value);
  return found ? found.label : value;
}

function nextId(id) {
  const key = schemas[id].key;
  const pre = prefixes[id] || "WL";
  let max = 0;
  (db[id] || []).forEach(row => {
    const match = String(row[key] || "").match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `${pre}-${String(max + 1).padStart(4, "0")}`;
}

function openForm(id, idx = null, preset = {}) {
  const schema = schemas[id];
  const row = idx === null ? { [schema.key]: nextId(id), ...preset } : { ...(db[id][idx] || {}) };
  editing = { id, idx };
  $("modalTitle").textContent = `${idx === null ? "New" : "Edit"} ${schema.label}`;
  $("formGrid").innerHTML = schema.fields.map(field => {
    const value = row[field] ?? "";
    const full = /notes|purpose|spec|warranty|srm|blocker|issue|action/i.test(field);
    const dynamicOptions = optionsForField(id, field);
    const options = dynamicOptions || (selectOptions[field] || null);
    const input = options
      ? `<select name="${esc(field)}"><option></option>${options.map(o => {
          const option = typeof o === "string" ? { value: o, label: o } : o;
          return `<option value="${esc(option.value)}" ${option.value === value || option.label === value ? "selected" : ""}>${esc(option.label)}</option>`;
        }).join("")}</select>`
      : full ? `<textarea name="${esc(field)}">${esc(value)}</textarea>`
      : `<input name="${esc(field)}" value="${esc(value)}">`;
    return `<label class="${full ? "full" : ""}">${esc(field)}${input}</label>`;
  }).join("");
  $("modal").classList.add("open");
}

function closeModal() {
  $("modal").classList.remove("open");
  editing = null;
}

function saveForm() {
  const { id, idx } = editing;
  const schema = schemas[id];
  const row = {};
  document.querySelectorAll("#formGrid [name]").forEach(el => row[el.name] = el.value.trim());
  if (!row[schema.key]) row[schema.key] = nextId(id);
  enrichLinkedFields(id, row);
  if (idx === null) db[id].push(row);
  else db[id][idx] = row;
  applyRelationshipSideEffects(id, row);
  closeModal();
  render();
}

function enrichLinkedFields(id, row) {
  if (id === "assignments") {
    const asset = (db.assets || []).find(item => item["Asset ID"] === row["Asset ID"]);
    const operator = [...(db.operators || []), ...(db.staff || [])].find(item => item["Staff ID"] === row["Operator ID"]);
    if (asset) {
      row["Asset Name"] = row["Asset Name"] || `${asset.Brand || ""} ${asset.Model || ""}`.trim();
      row.Site = row.Site || asset.Site || "";
    }
    if (operator) row["Operator Name"] = row["Operator Name"] || operator["Full Name"] || "";
  }
}

function applyRelationshipSideEffects(id, row) {
  if (id === "assignments" && row["Asset ID"] && row["Operator ID"]) {
    const asset = (db.assets || []).find(item => item["Asset ID"] === row["Asset ID"]);
    const operator = [...(db.operators || []), ...(db.staff || [])].find(item => item["Staff ID"] === row["Operator ID"]);
    if (asset && operator) asset["Assigned Operator"] = operator["Staff ID"];
    const opRow = (db.operators || []).find(item => item["Staff ID"] === row["Operator ID"]);
    if (opRow) {
      opRow["Assigned Asset ID"] = row["Asset ID"];
      opRow["Asset Description"] = row["Asset Name"] || "";
      opRow["Current Location"] = row.Site || opRow["Current Location"] || "";
    }
  }
}

function deleteRow(id, idx) {
  if (!confirm("Delete this row?")) return;
  db[id].splice(idx, 1);
  render();
}

function createPaymentFromPR(idx) {
  const pr = db.procurement[idx];
  openForm("paymentRequests", null, {
    "Request Date": today(),
    "Sent To": "Antrac Accounts",
    "PR Ref": pr["PR Ref"] || "",
    "PO No.": pr["PO No."] || "",
    "Supplier": pr["Selected Vendor"] || "",
    "Purpose": pr["Item / Service Requested"] || "",
    "Currency": "MVR",
    "Status": "Sent to Antrac Accounts",
    "Follow-up Date": today(),
    "SRM Notes": "No-credit supplier: follow payment to protect supplier relationship."
  });
}

function createStockFromPR(idx) {
  const pr = db.procurement[idx];
  openForm("inventory", null, {
    "Item Name": pr["Item / Service Requested"] || "",
    "Specs": pr["Specs Needed"] || "",
    "Location": "Thilafushi Base",
    "Source PR": pr["PR Ref"] || "",
    "PO No.": pr["PO No."] || "",
    "Supplier": pr["Selected Vendor"] || "",
    "Last GRN": today(),
    "Status": "Available"
  });
}

function openAssignmentForAsset(idx) {
  const asset = db.assets[idx];
  openForm("assignments", null, {
    "Date": today(),
    "Asset ID": asset["Asset ID"] || "",
    "Asset Name": `${asset.Brand || ""} ${asset.Model || ""}`.trim(),
    "Site": asset.Site || "",
    "Operator ID": "",
    "Status": "Active"
  });
}

function createTransferFromStock(idx) {
  const stock = db.inventory[idx];
  openForm("transfers", null, {
    "Date": today(),
    "Type": "Transfer - Base to Site",
    "From": stock.Location || "Thilafushi Base",
    "Item Name": stock["Item Name"] || "",
    "Specs": stock.Specs || "",
    "Unit": stock.Unit || "",
    "Source PR": stock["Source PR"] || "",
    "PO No.": stock["PO No."] || "",
    "Supplier": stock.Supplier || "",
    "Issued By": "Ali Mushthaq",
    "GRN Status": "Closed",
    "Transfer Status": "Pending Dispatch"
  });
}

function exportCsv(id) {
  const schema = schemas[id];
  const rows = db[id] || [];
  const csv = [schema.fields.join(",")].concat(rows.map(row => schema.fields.map(field => csvCell(row[field])).join(","))).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${id}-${today()}.csv`;
  a.click();
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

$("saveBtn").onclick = save;
$("backupBtn").onclick = backup;
$("cancelBtn").onclick = closeModal;
$("modalSaveBtn").onclick = saveForm;
$("modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

load().catch(err => {
  $("content").innerHTML = `<div class="banner bad">${esc(err.message)}</div>`;
});
