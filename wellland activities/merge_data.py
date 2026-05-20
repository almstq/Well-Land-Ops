import json
import os
import re

DB_PATH = r"C:\Users\Ali Musthaq\Downloads\WL OPS - for antigravity\wl-local-app\data\db.json"
FRONTEND_DB_PATH = r"C:\Users\Ali Musthaq\Downloads\WL OPS - for antigravity\wl-ops-frontend\src\data\initialDb.json"
FRONTEND_SERVER_DB_PATH = r"C:\Users\Ali Musthaq\Downloads\WL OPS - for antigravity\wl-ops-frontend\data\db.json"

def get_next_id(prefix, existing_ids):
    max_num = 0
    pattern = re.compile(rf"{prefix}-(\d+)")
    for eid in existing_ids:
        match = pattern.match(str(eid))
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"{prefix}-{str(max_num + 1).rjust(4, '0')}"

def merge_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return
        
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)
        
    # Ensure all tables exist
    db.setdefault("suppliers", [])
    db.setdefault("inventory", [])
    db.setdefault("issueReports", [])
    
    # Load extracted data
    extracted_suppliers = []
    extracted_issues = []
    extracted_inventory = []
    
    if os.path.exists("extracted_suppliers.json"):
        with open("extracted_suppliers.json", "r") as f:
            extracted_suppliers = json.load(f)
    if os.path.exists("extracted_issues.json"):
        with open("extracted_issues.json", "r") as f:
            extracted_issues = json.load(f)
    if os.path.exists("extracted_inventory.json"):
        with open("extracted_inventory.json", "r") as f:
            extracted_inventory = json.load(f)

    # 1. Merge Suppliers
    existing_supplier_names = {s.get("name", "").lower().strip(): s for s in db["suppliers"]}
    supplier_ids = [s.get("id") for s in db["suppliers"] if s.get("id")]
    
    suppliers_added = 0
    for es in extracted_suppliers:
        s_name = es.get("Supplier") or es.get("name")
        if not s_name:
            continue
        key = s_name.lower().strip()
        if key in existing_supplier_names:
            # Update existing with extra info if missing
            exist = existing_supplier_names[key]
            if not exist.get("Contact") and es.get("Contact"):
                exist["Contact"] = es["Contact"]
            if not exist.get("Remarks") and es.get("Remarks"):
                exist["Remarks"] = es["Remarks"]
        else:
            # Create new
            next_num = 1
            if supplier_ids:
                nums = [int(sid.replace("SUP-", "")) for sid in supplier_ids if sid.startswith("SUP-")]
                if nums:
                    next_num = max(nums) + 1
            new_id = f"SUP-{str(next_num).rjust(4, '0')}"
            supplier_ids.append(new_id)
            
            new_sup = {
                "id": new_id,
                "name": s_name,
                "Supplier": s_name,
                "Category": es.get("Category", "MRO / General"),
                "Contact": es.get("Contact", ""),
                "Remarks": es.get("Remarks", "Extracted from history documents")
            }
            db["suppliers"].append(new_sup)
            existing_supplier_names[key] = new_sup
            suppliers_added += 1

    # 2. Merge Inventory
    existing_inv = {(i.get("Item Name", "").lower().strip(), i.get("Part Number", "").lower().strip()): i for i in db["inventory"]}
    inv_ids = [i.get("id") for i in db["inventory"] if i.get("id")]
    
    inventory_added = 0
    for ei in extracted_inventory:
        item_name = ei.get("Item Name") or ei.get("name")
        if not item_name:
            continue
        part_num = ei.get("Part Number") or ""
        key = (item_name.lower().strip(), part_num.lower().strip())
        
        if key in existing_inv:
            # Update quantity / price
            exist = existing_inv[key]
            exist["Quantity"] = exist.get("Quantity", 0) + int(ei.get("Quantity", 1))
            if ei.get("Unit Price"):
                exist["Unit Price"] = float(ei["Unit Price"])
        else:
            next_num = 1
            if inv_ids:
                nums = [int(iid.replace("INV-", "")) for iid in inv_ids if iid.startswith("INV-")]
                if nums:
                    next_num = max(nums) + 1
            new_id = f"INV-{str(next_num).rjust(4, '0')}"
            inv_ids.append(new_id)
            
            new_item = {
                "id": new_id,
                "Item Name": item_name,
                "Part Number": part_num,
                "Category": ei.get("Category", "MRO / General"),
                "Supplier": ei.get("Supplier", ""),
                "Unit Price": float(ei.get("Unit Price", 0) or 0),
                "Quantity": int(ei.get("Quantity", 1) or 1),
                "Location": ei.get("Location", "Thilafushi Base Store")
            }
            db["inventory"].append(new_item)
            existing_inv[key] = new_item
            inventory_added += 1

    # 3. Merge Issues
    existing_issues = {i.get("title", "").lower().strip(): i for i in db["issueReports"]}
    issue_ids = [i.get("id") for i in db["issueReports"] if i.get("id")]
    
    issues_added = 0
    for eir in extracted_issues:
        title = eir.get("title")
        if not title:
            continue
        key = title.lower().strip()
        
        if key in existing_issues:
            # If issue exists, we just append parts if they are new
            exist = existing_issues[key]
            exist_parts = {p.get("name", "").lower().strip() for p in exist.get("parts", [])}
            for p in eir.get("parts", []):
                p_name = p.get("name")
                if p_name and p_name.lower().strip() not in exist_parts:
                    p["partId"] = f"part-{len(exist.get('parts', [])) + 1}"
                    exist.setdefault("parts", []).append(p)
        else:
            next_num = 1
            if issue_ids:
                nums = [int(iid.replace("IR-", "")) for iid in issue_ids if iid.startswith("IR-")]
                if nums:
                    next_num = max(nums) + 1
            new_id = f"IR-{str(next_num).rjust(4, '0')}"
            issue_ids.append(new_id)
            
            # Map parts
            parts_list = []
            for idx, p in enumerate(eir.get("parts", [])):
                parts_list.append({
                    "partId": f"part-{idx+1}",
                    "name": p.get("name", ""),
                    "partNumber": p.get("partNumber", ""),
                    "isOEM": p.get("isOEM", False),
                    "preferredSupplier": p.get("preferredSupplier", ""),
                    "qty": int(p.get("qty", 1) or 1),
                    "estimatedCost": float(p.get("estimatedCost", 0) or 0),
                    "currency": "MVR",
                    "notes": "Extracted from history",
                    "verified": True
                })
                
            new_issue = {
                "id": new_id,
                "title": title,
                "description": eir.get("description", ""),
                "category": eir.get("category", "Mechanical"),
                "priority": eir.get("priority", "HIGH"),
                "status": eir.get("status", "Reported"),
                "assetId": eir.get("assetId", ""),
                "assetLabel": eir.get("assetLabel", ""),
                "location": eir.get("location", "Thilafushi - Base"),
                "reportedBy": eir.get("reportedBy", "Janaka"),
                "reportedAt": eir.get("reportedAt") or "2026-05-20T12:00:00Z",
                "parts": parts_list
            }
            db["issueReports"].append(new_issue)
            existing_issues[key] = new_issue
            issues_added += 1

    # Save to local db
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)
    print(f"Successfully saved updated database to {DB_PATH}")
    
    # Save to frontend db seed
    with open(FRONTEND_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)
    print(f"Successfully saved updated database to {FRONTEND_DB_PATH}")

    # Save to frontend server db
    if os.path.exists(os.path.dirname(FRONTEND_SERVER_DB_PATH)):
        with open(FRONTEND_SERVER_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2)
        print(f"Successfully saved updated database to {FRONTEND_SERVER_DB_PATH}")
    
    print("\nSummary of modifications:")
    print(f"- Suppliers added: {suppliers_added}")
    print(f"- Inventory items added: {inventory_added}")
    print(f"- Issue reports added: {issues_added}")

if __name__ == "__main__":
    merge_data()
