import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
XLSX = WORKSPACE / "WL_Ops_Command_Center.xlsx"
DB_PATH = ROOT / "data" / "db.json"


def clean(value):
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "nat", "none"}:
        return ""
    return text


def read_table(sheet_name, header_key):
    raw = pd.read_excel(XLSX, sheet_name=sheet_name, header=None, dtype=str).fillna("")
    header_idx = None
    for idx, row in raw.iterrows():
        values = [clean(x) for x in row.tolist()]
        if header_key in values:
            header_idx = idx
            break
    if header_idx is None:
        return []

    headers = [clean(x) or f"Unnamed_{col}" for col, x in enumerate(raw.iloc[header_idx].tolist())]
    data = raw.iloc[header_idx + 1 :].copy()
    data.columns = headers
    rows = []
    for record in data.to_dict(orient="records"):
        item = {key: clean(value) for key, value in record.items() if not key.startswith("Unnamed_")}
        if any(item.values()):
            rows.append(item)
    return rows


def merge_by_key(existing, incoming, key):
    by_key = {clean(item.get(key)): dict(item) for item in existing if clean(item.get(key))}
    for item in incoming:
        item_key = clean(item.get(key))
        if not item_key:
            continue
        base = by_key.get(item_key, {})
        merged = dict(base)
        for field, value in item.items():
            if clean(value):
                merged[field] = value
            elif field not in merged:
                merged[field] = value
        by_key[item_key] = merged

    seen = set()
    merged_list = []
    for item in existing:
        item_key = clean(item.get(key))
        if item_key and item_key in by_key:
            merged_list.append(by_key[item_key])
            seen.add(item_key)
    for item_key, item in by_key.items():
        if item_key not in seen:
            merged_list.append(item)
    return merged_list


def category_for(asset):
    text = " ".join(clean(asset.get(k)) for k in ["Type", "Vehicle Type", "Brand", "Model"]).lower()
    if "excavator" in text or "pc350" in text or "sk380" in text or "sk235" in text:
        return "Excavator"
    if "dump" in text or "hauler" in text or "truck" in text:
        return "Dump Truck"
    if "crane" in text or "tadano" in text:
        return "Crane"
    if "forklift" in text:
        return "Forklift"
    if "loader" in text or "bobcat" in text:
        return "Loader / Bobcat"
    if "pickup" in text:
        return "Pickup"
    return "Other Equipment"


def readiness_from(condition, status, known_issue):
    text = f"{condition} {status} {known_issue}".lower()
    if any(word in text for word in ["grounded", "down", "failed", "critical", "not running"]):
        return "Red"
    if any(word in text for word in ["minor", "pending", "ordered", "leak", "repair", "unverified", "verify"]):
        return "Amber"
    if any(word in text for word in ["operational", "running", "standby", "active"]):
        return "Green"
    return "Unknown"


def normalize_location(raw_location, raw_status):
    text = f"{raw_location} {raw_status}"
    if re.search(r"pending delivery|ordered|en\s?route|in transit|shipment|awaiting receipt", text, re.I):
        return "New Shipment - Awaiting Receipt", "Enroute - Awaiting Receipt"
    if "muthaafushi" in text.lower():
        return "Muthaafushi", clean(raw_status) or "Active - Site"
    if "bodufinolhu" in text.lower():
        return "Bodufinolhu", clean(raw_status) or "Active - Site"
    return "Thilafushi - Base", clean(raw_status) or "Standby"


def normalize_fleet(rows):
    assets = []
    for row in rows:
        asset_id = clean(row.get("Fleet ID"))
        if not asset_id.startswith("WL-HV-"):
            continue
        site, status = normalize_location(row.get("Current Location"), row.get("Status"))
        asset = {
            "Asset ID": asset_id,
            "Type": clean(row.get("Vehicle Type")),
            "Category": category_for(row),
            "Brand": clean(row.get("Brand")),
            "Model": clean(row.get("Model")),
            "Site": site,
            "Assigned Project": clean(row.get("Assigned Project")),
            "Status": status,
            "Readiness": readiness_from(row.get("Condition"), status, row.get("Known Issue")),
            "Condition": clean(row.get("Condition")),
            "Assigned Operator": clean(row.get("Operator Assigned")),
            "Rental Eligible?": clean(row.get("Rental Eligible?")),
            "Daily Report Rcvd?": clean(row.get("Daily Report Rcvd?")),
            "Fuel %": clean(row.get("Fuel %")),
            "Open PR Ref": clean(row.get("Open PR Ref")),
            "Known Issue": clean(row.get("Known Issue")),
            "Issue History": clean(row.get("Issue History")),
            "Reg No.": clean(row.get("Reg No.")),
            "Chassis No.": clean(row.get("Chassis No.")),
            "Engine No.": clean(row.get("Engine No.")),
            "Last Service": clean(row.get("Last Maintenance")),
            "Next Service": clean(row.get("Next Maint Due")),
            "Notes": clean(row.get("Issue History")),
        }
        assets.append(asset)
    return assets


def apply_document_vault_to_assets(assets, vault_rows):
    by_id = {item.get("Asset ID"): item for item in assets}
    docs = []
    for row in vault_rows:
        fleet_id = clean(row.get("Fleet ID"))
        if fleet_id.startswith("WL-HV-"):
            doc = {
                "id": fleet_id,
                "entityType": "Asset",
                "entityId": fleet_id,
                "vehicleType": clean(row.get("Vehicle Type")),
                "brandModel": clean(row.get("Brand / Model")),
                "registrationNo": clean(row.get("Registration No.")),
                "chassisNo": clean(row.get("Chassis No.")),
                "engineNo": clean(row.get("Engine No.")),
                "insurancePolicyNo": clean(row.get("Insurance Policy No.")),
                "insuranceExpiry": clean(row.get("Insurance Expiry")),
                "registrationExpiry": clean(row.get("Reg Expiry")),
                "ownerManual": clean(row.get("Owner Manual?")),
                "serviceRecords": clean(row.get("Service Records?")),
                "operatorCertRequired": clean(row.get("Operator Cert Required?")),
                "lastServiceDate": clean(row.get("Last Service Date")),
                "notes": clean(row.get("Document Location / Notes")),
            }
            docs.append(doc)
            asset = by_id.get(fleet_id)
            if asset:
                if doc["registrationNo"]:
                    asset["Reg No."] = doc["registrationNo"]
                if doc["chassisNo"]:
                    asset["Chassis No."] = doc["chassisNo"]
                if doc["engineNo"]:
                    asset["Engine No."] = doc["engineNo"]
                asset["Document Status / Notes"] = doc["notes"]
        elif clean(row.get("Vessel ID")).startswith("WL-MV-"):
            docs.append({
                "id": clean(row.get("Vessel ID")),
                "entityType": "Vessel",
                "entityId": clean(row.get("Vessel ID")),
                "name": clean(row.get("Name")),
                "type": clean(row.get("Type")),
                "registrationNo": clean(row.get("Reg No.")),
                "hullImo": clean(row.get("Hull/IMO")),
                "surveyCertNo": clean(row.get("Survey Cert No.")),
                "surveyExpiry": clean(row.get("Survey Expiry")),
                "permitNo": clean(row.get("Permit No. (MNDF/MPA)")),
                "permitExpiry": clean(row.get("Permit Expiry")),
                "insuranceNo": clean(row.get("Insurance No.")),
                "insuranceExpiry": clean(row.get("Insurance Expiry")),
                "captainCertNo": clean(row.get("Captain Cert No.")),
                "lastSurveyDate": clean(row.get("Last Survey Date")),
                "notes": clean(row.get("Document Status / Notes")),
            })
    return docs


def normalize_vessels(rows):
    vessels = []
    next_num = 1
    for row in rows:
        if not clean(row.get("Name/Ref")):
            continue
        vessel_id = clean(row.get("Vessel ID"))
        if not vessel_id:
            vessel_id = f"WL-MV-X{next_num:03d}"
            next_num += 1
        item = dict(row)
        item["Vessel ID"] = vessel_id
        vessels.append(item)
    return vessels


def normalize_prs(rows):
    prs = []
    for row in rows:
        ref = clean(row.get("PR Ref"))
        if not ref.startswith("WL-PR-"):
            continue
        prs.append({
            "PR Ref": ref,
            "Request Date": clean(row.get("Date")),
            "Requested By": clean(row.get("Raised By")),
            "Request Source": clean(row.get("Business Unit")),
            "Site / Location": clean(row.get("Site / Location")),
            "Asset ID": clean(row.get("Vehicle / Asset Ref")),
            "Item / Service Requested": clean(row.get("Item(s) Summary")),
            "Purpose / Machine Use": clean(row.get("Item(s) Summary")),
            "Urgency": clean(row.get("Urgency")),
            "Quotes Received": clean(row.get("# Quotes")),
            "PO No.": clean(row.get("PO No.")),
            "FC Approved?": clean(row.get("FC Approved?")),
            "Selected Vendor": clean(row.get("Vendor")),
            "Date Ordered": clean(row.get("Date Ordered")),
            "Dispatch Status": clean(row.get("Dispatched?")),
            "Delivery Status": clean(row.get("Delivered?")),
            "Status": clean(row.get("Status / Notes")) or "Request Received",
            "Notes": clean(row.get("Status / Notes")),
        })
    return prs


def meaningful_call(row):
    return any(clean(row.get(k)) for k in ["Date", "Time", "Caller", "Company", "Call Type", "Request / Details", "Action"])


def main():
    db = json.loads(DB_PATH.read_text(encoding="utf-8"))

    fleet = normalize_fleet(read_table("🚛 Fleet Status", "Fleet ID"))
    db["assets"] = merge_by_key(db.get("assets", []), fleet, "Asset ID")

    document_rows = read_table("📂 Document Vault", "Fleet ID") + read_table("📂 Document Vault", "Vessel ID")
    db["documentVault"] = apply_document_vault_to_assets(db["assets"], document_rows)

    db["vessels"] = merge_by_key(db.get("vessels", []), normalize_vessels(read_table("⚓ Marine Vessels", "Vessel ID")), "Vessel ID")
    db["staff"] = merge_by_key(db.get("staff", []), read_table("👥 Staff Register", "Staff ID"), "Staff ID")

    operators = []
    for row in read_table("🔧 Operators", "Staff ID"):
        if clean(row.get("Staff ID")):
            item = dict(row)
            item["Role"] = item.get("Operator Role", item.get("Role", ""))
            item["Licence / Class"] = item.get("Licence No. / Class", "")
            item["Can Operate?"] = "Yes"
            operators.append(item)
    db["operators"] = merge_by_key(db.get("operators", []), operators, "Staff ID")

    db["procurement"] = merge_by_key(db.get("procurement", []), normalize_prs(read_table("📦 PR Log", "PR Ref")), "PR Ref")
    db["compliance"] = merge_by_key(db.get("compliance", []), read_table("📅 Compliance", "Ref"), "Ref")
    db["calls"] = [row for row in read_table("📞 Call Log", "#") if meaningful_call(row)]
    db["dailyLogs"] = read_table("📅 Daily Log", "Date")
    db["janakaDailyLogs"] = read_table("📋 Janaka Daily Log", "Date")

    db["locations"] = [
        {
            "Location ID": "LOC-0001",
            "Location Name": "Thilafushi - Base",
            "Type": "Base",
            "Island / Area": "Thilafushi",
            "Status": "Active",
            "Primary Contact": "",
            "Phone": "",
            "Notes": "Main maintenance, dispatch, fabrication, rental readiness and support base.",
        },
        {
            "Location ID": "LOC-0002",
            "Location Name": "Muthaafushi",
            "Type": "Project Site",
            "Island / Area": "Muthaafushi",
            "Status": "Active",
            "Primary Contact": "",
            "Phone": "",
            "Notes": "Active project deployment site.",
        },
        {
            "Location ID": "LOC-0003",
            "Location Name": "Bodufinolhu",
            "Type": "Project Site",
            "Island / Area": "Bodufinolhu",
            "Status": "Active",
            "Primary Contact": "",
            "Phone": "",
            "Notes": "Active project deployment site.",
        },
        {
            "Location ID": "LOC-SHIP-001",
            "Location Name": "New Shipment - Awaiting Receipt",
            "Type": "Transit",
            "Island / Area": "Marine Logistics",
            "Status": "Awaiting Receipt",
            "Primary Contact": "",
            "Phone": "",
            "Notes": "Temporary holding node for enroute machines awaiting receipt.",
        },
        {
            "Location ID": "LOC-HQ-001",
            "Location Name": "HQ, Antrac Tower Level 1",
            "Type": "Headquarters",
            "Island / Area": "Male",
            "Status": "Active",
            "Primary Contact": "",
            "Phone": "",
            "Notes": "Accounts, administration and supplier coordination.",
        },
    ]

    db.setdefault("meta", {})
    db["meta"]["lastXlsxResourceMerge"] = datetime.utcnow().isoformat() + "Z"
    db["meta"]["xlsxSource"] = str(XLSX.name)

    DB_PATH.write_text(json.dumps(db, indent=2, ensure_ascii=False), encoding="utf-8")

    summary = {
        "assets": len(db.get("assets", [])),
        "vessels": len(db.get("vessels", [])),
        "staff": len(db.get("staff", [])),
        "operators": len(db.get("operators", [])),
        "procurement": len(db.get("procurement", [])),
        "compliance": len(db.get("compliance", [])),
        "calls": len(db.get("calls", [])),
        "dailyLogs": len(db.get("dailyLogs", [])),
        "janakaDailyLogs": len(db.get("janakaDailyLogs", [])),
        "documentVault": len(db.get("documentVault", [])),
        "assetCategories": {},
        "assetLocations": {},
    }
    for asset in db.get("assets", []):
        summary["assetCategories"][asset.get("Category", "Uncategorized")] = summary["assetCategories"].get(asset.get("Category", "Uncategorized"), 0) + 1
        summary["assetLocations"][asset.get("Site", "Unknown")] = summary["assetLocations"].get(asset.get("Site", "Unknown"), 0) + 1
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
