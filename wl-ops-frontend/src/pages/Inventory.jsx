import { useEffect, useState } from 'react';
import { useAppContext } from '../App';
import { useLocation } from 'react-router-dom';
import { Package, Truck, ClipboardCheck, ArrowRight, Plus, CheckCircle, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { generatePDF } from '../lib/pdfGenerator';
import { motion } from 'framer-motion';

export default function Inventory() {
  const { db, updateDb } = useAppContext();
  const routerLocation = useLocation();
  const [activeTab, setActiveTab] = useState('Stock');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('GRN'); // GRN or Transfer

  useEffect(() => {
    if (routerLocation.state?.transferId) setActiveTab('Logistics');
  }, [routerLocation.state?.transferId]);

  if (!db) return null;

  const inventory = db.inventory || [];
  const transferNotes = db.transferNotes || [];
  const locations = db.locations || [];
  const items = db.items || [];
  const suppliers = db.suppliers || [];
  const issueReports = db.issueReports || [];
  const procurement = db.procurement || [];
  const staff = db.staff || [];
  const warehouseLocations = locations.filter(loc => (loc.Type || '').toLowerCase() !== 'headquarters');
  const totalStockQty = inventory.reduce((sum, item) => sum + (Number(item.qty ?? item.Quantity) || 0), 0);
  const inTransitCount = transferNotes.filter(n => n.status === 'In Transit').length;

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());
    
    const qty = parseInt(dataObj.qty, 10);
    const date = new Date().toLocaleDateString();
    
    let newTransferNotes = [...transferNotes];
    let newInventory = [...inventory];

    if (modalType === 'GRN') {
      const ref = `GRN-${String(transferNotes.length + 1).padStart(4, '0')}`;
      if (!dataObj.issueRef?.trim() && !dataObj.reason?.trim()) {
        alert('A stock receipt needs a reason: select/type an issue reference or enter a reason.');
        return;
      }

      const doc = {
        id: ref,
        type: 'GRN',
        date,
        item: dataObj.item,
        qty,
        source: `Supplier: ${dataObj.supplier}`,
        destination: dataObj.destination,
        status: 'Completed', // GRN implies received immediately usually
        issueRef: dataObj.issueRef,
        reason: dataObj.reason,
        notes: dataObj.notes
      };
      newTransferNotes.push(doc);

      // Add to stock
      const stockIdx = newInventory.findIndex(i => i.item === doc.item && i.location === doc.destination);
      if (stockIdx >= 0) {
        newInventory[stockIdx].qty += qty;
      } else {
        newInventory.push({
          id: `${ref}-STOCK`,
          item: doc.item,
          location: doc.destination,
          qty,
          issueRef: doc.issueRef,
          reason: doc.reason,
          sourceType: 'Manual GRN',
        });
      }
    } else {
      // Transfer Note
      const ref = `TRN-${String(transferNotes.length + 1).padStart(4, '0')}`;
      const assignedStaff = staff.find(s => s['Staff ID'] === dataObj.assignedStaffId);
      const doc = {
        id: ref,
        type: 'Transfer',
        date,
        item: dataObj.item,
        qty,
        source: dataObj.source,
        destination: dataObj.destination,
        status: 'In Transit', // Needs acknowledgment
        assignedStaffId: dataObj.assignedStaffId,
        assignedTo: assignedStaff?.['Full Name'] || '',
        reason: dataObj.reason,
        notes: dataObj.notes
      };
      
      // Deduct from source immediately
      const stockIdx = newInventory.findIndex(i => i.item === doc.item && i.location === doc.source);
      if (stockIdx >= 0 && newInventory[stockIdx].qty >= qty) {
        newInventory[stockIdx].qty -= qty;
        newTransferNotes.push(doc);
      } else {
        alert("Insufficient stock at source location!");
        return;
      }
    }

    await updateDb({ inventory: newInventory, transferNotes: newTransferNotes });
    setModalOpen(false);
  };

  const handleAcknowledge = async (doc) => {
    let newTransferNotes = transferNotes.map(n => n.id === doc.id ? { ...n, status: 'Completed' } : n);
    let newInventory = [...inventory];
    let newProcurement = [...procurement];
    let newIssues = [...issueReports];

    const stockIdx = newInventory.findIndex(i => i.item === doc.item && i.location === doc.destination);
    if (stockIdx >= 0) {
      newInventory[stockIdx].qty += doc.qty;
    } else {
      newInventory.push({
        id: `${doc.id}-STOCK`,
        item: doc.item,
        location: doc.destination,
        qty: doc.qty,
        prRef: doc.prRef || '',
        issueRef: doc.issueRef || '',
        assetId: doc.assetId || '',
        assetLabel: doc.assetLabel || '',
        assignedStaffId: doc.assignedStaffId || '',
        assignedTo: doc.assignedTo || '',
        reason: doc.reason || '',
      });
    }

    if (doc.prRef) {
      newProcurement = newProcurement.map(pr =>
        pr['PR Ref'] === doc.prRef
          ? { ...pr, Status: 'Delivered to Site', 'Delivery Status': 'Yes', 'Delivered To': doc.assignedTo || '', 'Delivered Transfer Ref': doc.id }
          : pr
      );
    }
    if (doc.issueRef) {
      newIssues = newIssues.map(issue =>
        issue.id === doc.issueRef && !['Resolved', 'Closed'].includes(issue.status)
          ? { ...issue, status: 'Parts Received' }
          : issue
      );
    }

    await updateDb({ inventory: newInventory, transferNotes: newTransferNotes, procurement: newProcurement, issueReports: newIssues });
  };

  // Group inventory by location
  const allLocationNames = Array.from(new Set([
    ...warehouseLocations.map(loc => loc.Site || loc['Location Name'] || loc.name).filter(Boolean),
    ...inventory.map(i => i.location || i.Location).filter(Boolean),
    ...transferNotes.map(t => t.destination).filter(Boolean),
  ])).sort();

  const inventoryByLocation = allLocationNames.map(locName => {
    return {
      location: locName,
      items: inventory.filter(i => (i.location || i.Location) === locName),
      inbound: transferNotes.filter(t => t.destination === locName && t.status === 'In Transit')
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">Inventory & Warehouse</h1>
          <p className="text-textMuted mt-1">Receive PR items into warehouse stock, transfer spares to sites, and track in-transit notes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setModalType('GRN'); setModalOpen(true); }} className="btn btn-outline">
            <Plus className="w-4 h-4 mr-2" />
            New GRN
          </button>
          <button onClick={() => { setModalType('Transfer'); setModalOpen(true); }} className="btn btn-primary">
            <Truck className="w-4 h-4 mr-2" />
            New Transfer
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border/50">
        <button
          onClick={() => setActiveTab('Stock')}
          className={cn("px-4 py-3 border-b-2 font-bold transition-colors", activeTab === 'Stock' ? "border-primary text-primary" : "border-transparent text-textMuted hover:text-textMain hover:bg-surfaceContainer")}
        >
          Live Stock
        </button>
        <button
          onClick={() => setActiveTab('Logistics')}
          className={cn("px-4 py-3 border-b-2 font-bold transition-colors flex items-center gap-2", activeTab === 'Logistics' ? "border-primary text-primary" : "border-transparent text-textMuted hover:text-textMain hover:bg-surfaceContainer")}
        >
          Transfer Logs
          <span className="bg-primaryContainer text-primary py-0.5 px-2 rounded-full text-xs font-bold">
            {inTransitCount}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="ops-card p-4">
          <div className="section-label">Stock Lines</div>
          <div className="text-2xl font-bold text-textMain">{inventory.length}</div>
        </div>
        <div className="ops-card p-4">
          <div className="section-label">Total Units</div>
          <div className="text-2xl font-bold text-textMain">{totalStockQty}</div>
        </div>
        <div className="ops-card p-4">
          <div className="section-label">In Transit</div>
          <div className="text-2xl font-bold text-warning">{inTransitCount}</div>
        </div>
        <div className="ops-card p-4">
          <div className="section-label">Warehouses / Sites</div>
          <div className="text-2xl font-bold text-textMain">{warehouseLocations.length}</div>
        </div>
      </div>

      {activeTab === 'Stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {inventoryByLocation.map((group, idx) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={group.location} className="bg-surface rounded-md3-lg shadow-soft border border-border/50 p-5">
              <h3 className="font-bold text-lg text-textMain mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {group.location}
              </h3>
              
              {group.items.length === 0 && group.inbound.length === 0 ? (
                <div className="text-sm text-textMuted font-medium py-4 text-center bg-surfaceContainer rounded-md3">No stock reported.</div>
              ) : (
                <div className="space-y-3">
                  {group.items.map(item => (
                    <div key={item.id} className="p-3 bg-surfaceContainer rounded-md">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-textMain text-sm">{item.item || item['Item Name']}</span>
                        <span className="font-bold text-primary bg-primaryContainer px-3 py-1 rounded-full text-sm">{item.qty ?? item.Quantity}</span>
                      </div>
                      {(item.issueRef || item.prRef || item.assignedTo || item.reason) && (
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-textMuted">
                          {item.issueRef && <span className="badge badge-info font-mono">{item.issueRef}</span>}
                          {item.prRef && <span className="badge badge-default font-mono">{item.prRef}</span>}
                          {item.assignedTo && <span className="badge badge-success">{item.assignedTo}</span>}
                          {item.reason && <span className="truncate max-w-full">Reason: {item.reason}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  {group.inbound.map(doc => (
                    <div key={doc.id} className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-textMain text-sm">{doc.item}</span>
                        <span className="font-bold text-warning bg-warning/10 px-3 py-1 rounded-full text-sm">Inbound {doc.qty}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-textMuted">
                        <span className="badge badge-warning">{doc.id}</span>
                        {doc.issueRef && <span className="badge badge-info font-mono">{doc.issueRef}</span>}
                        {doc.prRef && <span className="badge badge-default font-mono">{doc.prRef}</span>}
                        {doc.assignedTo && <span className="badge badge-success">{doc.assignedTo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'Logistics' && (
        <div className="bg-surface rounded-md3-lg shadow-soft border border-border/50 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surfaceContainer border-b border-border/50 text-xs uppercase text-textMuted tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Ref / Date</th>
                <th className="px-6 py-4">Item & Qty</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transferNotes.slice().reverse().map((doc) => (
                <tr key={doc.id} className={cn(
                  'border-b border-border/50 last:border-0 hover:bg-surfaceContainer transition-colors',
                  routerLocation.state?.transferId === doc.id ? 'bg-primaryContainer/60' : ''
                )}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-textMain">{doc.id}</div>
                    <div className="text-xs text-textMuted">{doc.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-textMain">{doc.item}</div>
                    <div className="text-xs font-bold text-primary">{doc.qty} Units</div>
                    {(doc.issueRef || doc.prRef || doc.assignedTo) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {doc.issueRef && <span className="badge badge-info font-mono text-[10px]">{doc.issueRef}</span>}
                        {doc.prRef && <span className="badge badge-default font-mono text-[10px]">{doc.prRef}</span>}
                        {doc.assignedTo && <span className="badge badge-success text-[10px]">{doc.assignedTo}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-textMuted">
                      <span className="truncate max-w-[100px]">{doc.source}</span>
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate max-w-[100px] font-bold text-textMain">{doc.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", doc.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    {doc.status === 'In Transit' && (
                      <button onClick={() => handleAcknowledge(doc)} className="btn btn-primary text-xs h-8 px-3">
                        <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                      </button>
                    )}
                    <button onClick={() => generatePDF('Transfer Note', {
                      'PR Ref': doc.id,
                      'Site / Location': doc.destination,
                      'Requested By': doc.source,
                      'Item / Service Requested': doc.item,
                      'Purpose / Machine Use': doc.notes || 'Inventory Transfer',
                      'Specs Needed': `Qty: ${doc.qty}`,
                      'Urgency': 'Normal'
                    })} className="btn btn-outline text-xs h-8 px-3">
                      <Download className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {transferNotes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-textMuted font-medium">No logistics records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface rounded-md3-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surfaceContainer">
              <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
                {modalType === 'GRN' ? <ClipboardCheck className="w-5 h-5 text-primary" /> : <Truck className="w-5 h-5 text-primary" />}
                Log New {modalType === 'GRN' ? 'Goods Receipt (GRN)' : 'Transfer Note'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveDoc} className="p-6 space-y-4">
              {modalType === 'GRN' && (
                <>
                  <div>
                    <label className="label">Supplier Name</label>
                    <select name="supplier" required className="input bg-surfaceContainer">
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => <option key={s.id || s.name || s.Supplier} value={s.name || s.Supplier}>{s.name || s.Supplier}</option>)}
                      <option value="External / Ad-hoc">External / Ad-hoc</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Reason / Issue Link *</label>
                    <select name="issueRef" className="input bg-surfaceContainer">
                      <option value="">Select linked issue...</option>
                      {issueReports.map(issue => (
                        <option key={issue.id} value={issue.id}>{issue.id} - {issue.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Reason if no issue exists</label>
                    <input name="reason" className="input bg-surfaceContainer" placeholder="Why is this stock being received?" />
                  </div>
                </>
              )}
              
              {modalType === 'Transfer' && (
                <>
                  <div>
                    <label className="label">Source Location</label>
                    <select name="source" required className="input bg-surfaceContainer">
                      <option value="">Select Origin...</option>
                      {warehouseLocations.map(l => {
                        const name = l.Site || l['Location Name'] || l.name;
                        return <option key={name} value={name}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="label">Assign Receiver</label>
                    <select name="assignedStaffId" className="input bg-surfaceContainer">
                      <option value="">Select staff receiver...</option>
                      {staff.filter(s => s['Full Name']).map(s => (
                        <option key={s['Staff ID']} value={s['Staff ID']}>{s['Full Name']} - {s.Designation || s['Staff ID']}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label">Item</label>
                  <select name="item" required className="input bg-surfaceContainer">
                    <option value="">Select Item...</option>
                    {items.map(i => {
                      const name = i.name || i.Item || i['Item Name'];
                      return <option key={name} value={name}>{name}</option>;
                    })}
                    <option value="Misc Spares">Misc Spares</option>
                    <option value="Safety Gear (PPE)">Safety Gear (PPE)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" name="qty" min="1" required className="input bg-surfaceContainer" />
                </div>
              </div>

              <div>
                <label className="label">Destination Location</label>
                <select name="destination" required className="input bg-surfaceContainer">
                  <option value="">Select Destination...</option>
                  {warehouseLocations.map(l => {
                    const name = l.Site || l['Location Name'] || l.name;
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="label">Logistics Notes</label>
                <input type="text" name="notes" placeholder="Vehicle number, driver name, or remarks..." className="input bg-surfaceContainer" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">Generate {modalType === 'GRN' ? 'GRN' : 'Transfer Note'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
