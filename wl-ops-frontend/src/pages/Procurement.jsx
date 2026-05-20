import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../App';
import { useLocation } from 'react-router-dom';
import {
  FileText, Mail, FileCheck, DollarSign, Package, Truck,
  ArrowRight, Download, CheckCircle, Plus, Star, Link as LinkIcon,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { generatePDF } from '../lib/pdfGenerator';

const DEFAULT_GST_RATE = 8;

const STAGES = [
  { id: 'Draft', label: 'Draft & Specs', icon: FileText },
  { id: 'Approval', label: 'Ops Approval', icon: CheckCircle },
  { id: 'RFQ', label: 'RFQ & Quotes', icon: Mail },
  { id: 'Quote', label: 'Compare Quotes', icon: FileCheck },
  { id: 'PO', label: 'PO Raised', icon: FileCheck },
  { id: 'Accounts', label: 'Antrac Accounts', icon: DollarSign },
  { id: 'HQ', label: 'HQ Stores', icon: Package },
  { id: 'Dispatch', label: 'Dispatch', icon: Truck },
];

const STAGE_MAPPING = {
  Draft: ['Request Received', 'Specs Required'],
  Approval: ['Approval Pending', 'Approved for RFQ'],
  RFQ: ['Verified', 'RFQ Sent', 'Partial Quotes'],
  Quote: ['Quotes Received', 'Quotes Complete'],
  PO: ['PO Created'],
  Accounts: ['Sent to Antrac Accounts', 'Payment Requested', 'Finance Released', 'Payment Done'],
  HQ: ['Delivered to HQ Inventory'],
  Dispatch: ['Handed to Logistics', 'Delivered to Site'],
};

function getWorkflowStage(pr) {
  const status = String(pr.Status || '').toLowerCase();
  const delivery = String(pr['Delivery Status'] || pr['Delivered?'] || '').toLowerCase();
  const hasPo = Boolean(pr['PO No.']);
  const quotes = Number(pr['Quotes Received'] || pr['# Quotes'] || 0);

  if (status === 'delivered to site') return 'Dispatch';
  if (status === 'delivered to hq inventory') return 'HQ';
  if (delivery.includes('yes') || delivery.includes('partial')) return status.includes('hq') ? 'HQ' : 'Dispatch';
  if (status.includes('finance released') || status.includes('payment done') || status.includes('sent to antrac') || status.includes('payment requested')) return 'Accounts';
  if (status.includes('po created') || hasPo) return 'PO';
  if (status.includes('quote') || quotes > 0) return 'Quote';
  if (status.includes('verified') || status.includes('rfq')) return 'RFQ';
  if (status.includes('approval pending') || status.includes('approved for rfq')) return 'Approval';
  return 'Draft';
}

function getIssueStatusFromProcurement(issue, procurement) {
  if (['Resolved', 'Closed'].includes(issue.status)) return issue.status;
  const refs = new Set(issue.linkedPRRefs || []);
  const linked = procurement.filter(pr =>
    pr['Issue Ref'] === issue.id ||
    (refs.size > 0 && refs.has(pr['PR Ref']))
  );

  if (linked.length === 0) return issue.status;

  const statuses = linked.map(pr => String(pr.Status || '').toLowerCase());
  const isReceivedStatus = (status) =>
    status === 'delivered to site' ||
    status === 'delivered to hq inventory' ||
    status === 'received' ||
    status === 'parts received';
  const allReceived = statuses.every(status =>
    isReceivedStatus(status)
  );
  if (allReceived) return 'Parts Received';

  const anyOrdered = linked.some(pr => {
    const status = String(pr.Status || '').toLowerCase();
    return status.includes('po created') ||
      status.includes('payment') ||
      status.includes('paid') ||
      status.includes('ready for collection') ||
      status.includes('collected') ||
      status.includes('logistics');
  });
  if (anyOrdered) return 'Parts Ordered';

  return linked.some(pr => pr.Status) ? 'Parts Requested' : issue.status;
}

export default function Procurement() {
  const { db, updateDb } = useAppContext();
  const routerLocation = useLocation();
  const [activeStage, setActiveStage] = useState('Draft');
  const [isModalOpen, setModalOpen] = useState(false);
  const [quoteModalPR, setQuoteModalPR] = useState(null);
  const [quoteException, setQuoteException] = useState('');
  const [specsModalPR, setSpecsModalPR] = useState(null);
  const [dispatchModalPR, setDispatchModalPR] = useState(null);

  const procurement = useMemo(() => db?.procurement || [], [db?.procurement]);
  const quotes = db?.quotes || [];
  const paymentRequests = db?.paymentRequests || [];
  const issueReports = db?.issueReports || [];
  const staff = db?.staff || [];
  const locations = db?.locations || [];
  const locationOptions = Array.from(new Set([
    ...locations.map(l => l.name || l['Location Name'] || l.Location || l.Site).filter(Boolean),
    ...(db?.assets || []).map(a => a.Site || a['Current Location']).filter(Boolean),
    'Thilafushi - Base',
    'Muthaafushi',
    'Bodufinolhu',
    'New Shipment - Awaiting Receipt',
  ])).sort();

  const syncIssueReportsFromProcurement = (nextProcurement) =>
    issueReports.map(issue => ({
      ...issue,
      status: getIssueStatusFromProcurement(issue, nextProcurement),
    }));

  const getItemsForStage = (stageId) =>
    procurement.filter(p => getWorkflowStage(p) === stageId || (STAGE_MAPPING[stageId] || []).includes(p.Status));

  const currentItems = getItemsForStage(activeStage);

  useEffect(() => {
    if (!routerLocation.state?.prRef || procurement.length === 0) return;
    const pr = procurement.find(p => p['PR Ref'] === routerLocation.state.prRef);
    if (pr) setActiveStage(getWorkflowStage(pr));
  }, [routerLocation.state?.prRef, procurement]);

  if (!db) return null;

  const handleSavePR = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const newPR = {
      'PR Ref': `WL-PR-${String(procurement.length + 1).padStart(4, '0')}`,
      'Request Date': new Date().toLocaleDateString(),
      'Request Timestamp': Date.now(),
      'Status': 'Request Received',
      ...d,
    };
    const updatedProcurement = [...procurement, newPR];
    await updateDb({ procurement: updatedProcurement, issueReports: syncIssueReportsFromProcurement(updatedProcurement) });
    setModalOpen(false);
  };

  const moveItem = async (pr, newStatus) => {
    const isDispatching = ['Handed to Logistics', 'Delivered to Site', 'Delivered to HQ Inventory'].includes(newStatus);
    const updated = procurement.map(p => {
      if (p['PR Ref'] !== pr['PR Ref']) return p;
      const next = { ...p, Status: newStatus };
      if (isDispatching && !p['Dispatch Timestamp']) {
        next['Dispatch Timestamp'] = Date.now();
        if (p['Request Timestamp']) {
          next['Turnaround Hours'] = ((Date.now() - p['Request Timestamp']) / 3600000).toFixed(1);
        }
      }
      return next;
    });
    await updateDb({ procurement: updated, issueReports: syncIssueReportsFromProcurement(updated) });
  };

  const issueGRNToHQ = async (pr, nextPaymentRequests = paymentRequests) => {
    const inventory = db.inventory || [];
    const transferNotes = db.transferNotes || [];
    const hqName = 'Thilafushi - Base';
    const ref = `GRN-${String(transferNotes.length + 1).padStart(4, '0')}`;
    const qty = Number(pr.Quantity || pr.qty || 1) || 1;
    const newNote = {
      id: ref, type: 'GRN',
      date: new Date().toLocaleDateString(),
      item: pr['Item / Service Requested'],
      qty, source: pr['Selected Vendor'] || 'Procurement Pipeline',
      destination: hqName, status: 'Completed',
      prRef: pr['PR Ref'],
      issueRef: pr['Issue Ref'] || '',
      assetId: pr['Asset ID'] || '',
      assetLabel: pr['Asset Label'] || '',
      reason: pr['Reason / Issue'] || '',
      notes: `Linked PR: ${pr['PR Ref']}${pr['Issue Ref'] ? ` | Issue: ${pr['Issue Ref']}` : ''}`
    };
    let newInventory = [...inventory];
    const idx = newInventory.findIndex(i => i.item === newNote.item && i.location === hqName);
    if (idx >= 0) {
      newInventory[idx].qty += qty;
      newInventory[idx] = {
        ...newInventory[idx],
        lastPrRef: pr['PR Ref'],
        issueRef: pr['Issue Ref'] || newInventory[idx].issueRef || '',
        assetId: pr['Asset ID'] || newInventory[idx].assetId || '',
        reason: pr['Reason / Issue'] || newInventory[idx].reason || '',
      };
    } else {
      newInventory.push({
        id: `${ref}-STOCK`,
        item: newNote.item,
        location: hqName,
        qty,
        prRef: pr['PR Ref'],
        issueRef: pr['Issue Ref'] || '',
        assetId: pr['Asset ID'] || '',
        assetLabel: pr['Asset Label'] || '',
        reason: pr['Reason / Issue'] || '',
        sourceType: 'Procurement',
      });
    }
    const updatedProcurement = procurement.map(p =>
      p['PR Ref'] === pr['PR Ref']
        ? { ...p, Status: 'Delivered to HQ Inventory', 'Delivery Status': 'Yes', 'GRN Ref': ref }
        : p
    );
    await updateDb({
      inventory: newInventory,
      transferNotes: [...transferNotes, newNote],
      procurement: updatedProcurement,
      paymentRequests: nextPaymentRequests,
      issueReports: syncIssueReportsFromProcurement(updatedProcurement)
    });
  };

  const dispatchToStaff = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const pr = dispatchModalPR;
    const qty = Number(d.qty || pr.Quantity || 1) || 1;
    const itemName = pr['Item / Service Requested'];
    const source = 'Thilafushi - Base';
    const transferNotes = db.transferNotes || [];
    const inventory = db.inventory || [];
    const staffMember = staff.find(s => s['Staff ID'] === d.assignedStaffId);
    const assigneeName = staffMember?.['Full Name'] || d.assignedStaffId;
    const destination = d.destination || pr['Site / Location'] || 'Unassigned Site';
    const ref = `TRN-${String(transferNotes.length + 1).padStart(4, '0')}`;

    const stockIdx = inventory.findIndex(i => i.item === itemName && i.location === source);
    if (stockIdx < 0 || (Number(inventory[stockIdx].qty) || 0) < qty) {
      alert('Insufficient received stock at Thilafushi - Base for this dispatch.');
      return;
    }

    const updatedInventory = [...inventory];
    updatedInventory[stockIdx] = {
      ...updatedInventory[stockIdx],
      qty: (Number(updatedInventory[stockIdx].qty) || 0) - qty,
    };

    const newTransfer = {
      id: ref,
      type: 'Transfer',
      date: new Date().toLocaleDateString(),
      item: itemName,
      qty,
      source,
      destination,
      status: 'In Transit',
      assignedStaffId: d.assignedStaffId,
      assignedTo: assigneeName,
      requestedBy: pr['Requested By'] || '',
      prRef: pr['PR Ref'],
      issueRef: pr['Issue Ref'] || '',
      assetId: pr['Asset ID'] || '',
      assetLabel: pr['Asset Label'] || '',
      reason: pr['Reason / Issue'] || '',
      notes: d.notes || `Dispatch for ${pr['PR Ref']}${pr['Issue Ref'] ? ` / ${pr['Issue Ref']}` : ''}`,
    };

    const updatedProcurement = procurement.map(p =>
      p['PR Ref'] === pr['PR Ref']
        ? {
            ...p,
            Status: 'Handed to Logistics',
            'Dispatch Status': 'Yes',
            'Dispatch Ref': ref,
            'Assigned Staff ID': d.assignedStaffId,
            'Assigned To': assigneeName,
            'Original Requester': pr['Requested By'] || '',
            'Dispatch Destination': destination,
          }
        : p
    );

    await updateDb({
      inventory: updatedInventory,
      transferNotes: [...transferNotes, newTransfer],
      procurement: updatedProcurement,
      issueReports: syncIssueReportsFromProcurement(updatedProcurement),
    });
    setDispatchModalPR(null);
  };

  const raisePaymentRequest = async (pr) => {
    const amount = prompt(`Enter amount for ${pr['PR Ref']}:`);
    if (!amount) return;
    const newPR = {
      id: `PAY-${String(paymentRequests.length + 1).padStart(4, '0')}`,
      prRef: pr['PR Ref'],
      vendor: pr['Selected Vendor'] || '',
      amount: Number(amount),
      currency: 'MVR',
      status: 'Pending',
      department: 'Antrac Accounts',
      issueRef: pr['Issue Ref'] || '',
      reason: pr['Reason / Issue'] || '',
      raisedAt: new Date().toISOString(),
    };
    const updatedProcurement = procurement.map(p =>
      p['PR Ref'] === pr['PR Ref']
        ? { ...p, Status: 'Sent to Antrac Accounts', 'Accounts Sent At': new Date().toISOString(), 'Accounts Request Ref': newPR.id }
        : p
    );
    await updateDb({
      paymentRequests: [...paymentRequests, newPR],
      procurement: updatedProcurement,
      issueReports: syncIssueReportsFromProcurement(updatedProcurement)
    });
  };

  const addQuote = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const basePrice = Number(d.price || 0);
    const gstRate = Number(d.gstRate || DEFAULT_GST_RATE);
    const gstAmount = Number(((basePrice * gstRate) / 100).toFixed(2));
    const newQuote = {
      id: `QT-${Date.now()}`,
      prRef: quoteModalPR['PR Ref'],
      supplier: d.supplier,
      contact: d.contact,
      quoteRef: d.quoteRef,
      quoteDate: d.quoteDate || new Date().toISOString().slice(0, 10),
      partNumber: d.partNumber || quoteModalPR['Part Number'] || '',
      price: basePrice,
      currency: d.currency || 'MVR',
      gstRate,
      gstAmount,
      totalWithGst: Number((basePrice + gstAmount).toFixed(2)),
      leadTime: d.leadTime,
      warranty: d.warranty,
      availability: d.availability,
      isOEM: d.isOEM === 'Yes',
      source: d.source,
      externalQuoteText: d.externalQuoteText,
      notes: d.notes,
      addedAt: new Date().toISOString(),
    };
    const updatedQuotes = [...quotes, newQuote];
    const updatedProcurement = procurement.map(p =>
      p['PR Ref'] === quoteModalPR['PR Ref']
        ? { ...p, 'Quotes Received': updatedQuotes.filter(q => q.prRef === quoteModalPR['PR Ref']).length, Status: 'Quotes Received' }
        : p
    );
    await updateDb({ quotes: updatedQuotes, procurement: updatedProcurement, issueReports: syncIssueReportsFromProcurement(updatedProcurement) });
  };

  const selectQuote = async (pr, quote) => {
    const linkedQuotes = quotes.filter(q => q.prRef === pr['PR Ref']);
    if (linkedQuotes.length < 3 && !quoteException) {
      alert('Standard practice requires 3 quotes. Select a single/limited quote justification before creating PO.');
      return;
    }
    const updated = procurement.map(p =>
      p['PR Ref'] === pr['PR Ref']
        ? {
            ...p,
            'Selected Vendor': quote.supplier,
            'Selected Price': quote.price,
            'Selected GST Rate': quote.gstRate ?? DEFAULT_GST_RATE,
            'Selected GST Amount': quote.gstAmount || 0,
            'Selected Total With GST': quote.totalWithGst || quote.price,
            'Selected Quote Ref': quote.quoteRef || quote.id,
            'Quote Count': linkedQuotes.length,
            'Quote Compliance': linkedQuotes.length >= 3 ? '3 Quotes Compared' : 'Exception Approved',
            'Quote Exception Reason': linkedQuotes.length >= 3 ? '' : quoteException,
            'Status': 'PO Created'
          }
        : p
    );
    await updateDb({ procurement: updated, issueReports: syncIssueReportsFromProcurement(updated) });
    setQuoteException('');
    setQuoteModalPR(null);
  };

  const releaseFinanceToHQ = async (pr) => {
    const updatedPayments = paymentRequests.map(pay =>
      pay.prRef === pr['PR Ref']
        ? { ...pay, status: 'Released', releasedAt: new Date().toISOString() }
        : pay
    );
    await issueGRNToHQ({ ...pr, Status: 'Finance Released' }, updatedPayments);
  };

  const prQuotes = quoteModalPR
    ? quotes.filter(q => q.prRef === quoteModalPR['PR Ref'])
    : [];

  const confirmSpecs = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const updated = procurement.map(p =>
      p['PR Ref'] === specsModalPR['PR Ref']
        ? {
            ...p,
            'Item / Service Requested': d['Confirmed Item'],
            'Part Number': d['Part Number'],
            'OEM Required': d['OEM Required'],
            'Exact Specification': d['Exact Specification'],
            'Quantity': d['Quantity'],
            'Unit': d['Unit'],
            'Selected Vendor': d['Preferred Supplier'],
            'Estimated Unit Price': d['Estimated Unit Price'],
            'Lead Time': d['Lead Time'],
            'Specs Notes': d['Specs Notes'],
            'Specs Confirmed By': d['Confirmed By'],
            'Specs Confirmed At': new Date().toISOString(),
            'Status': 'Approval Pending',
          }
        : p
    );
    await updateDb({ procurement: updated, issueReports: syncIssueReportsFromProcurement(updated) });
    setSpecsModalPR(null);
  };

  const specsComplete = (pr) =>
    pr['Exact Specification'] && pr['Quantity'] && pr['Selected Vendor'] && pr['Estimated Unit Price'];

  const urgencyBadge = (u) => u === 'CRITICAL' ? 'badge-critical' : u === 'HIGH' ? 'badge-high' : u === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Procurement Workflow</h1>
          <p className="text-sm text-textMuted mt-0.5">From issue-linked request to delivery - track every stage.</p>
        </div>
        <div className="flex gap-2 items-center">
          {paymentRequests.filter(p => p.status === 'Pending').length > 0 && (
            <span className="badge badge-warning text-xs">
              {paymentRequests.filter(p => p.status === 'Pending').length} payment{paymentRequests.filter(p => p.status === 'Pending').length > 1 ? 's' : ''} pending
            </span>
          )}
          <button onClick={() => setModalOpen(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Log PR
          </button>
        </div>
      </div>

      {/* Stage Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {STAGES.map(stage => {
          const count = getItemsForStage(stage.id).length;
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                isActive
                  ? 'bg-primaryContainer border-primary/40 shadow-sm'
                  : 'bg-surface border-border hover:bg-surfaceContainer'
              )}
            >
              <stage.icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-textMuted')} />
              <span className={cn('text-[11px] font-semibold text-center leading-tight', isActive ? 'text-primary' : 'text-textMuted')}>
                {stage.label}
              </span>
              <span className={cn('text-lg font-bold leading-none', isActive ? 'text-primary' : 'text-textMuted')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="flex-1 card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surfaceContainer">
          <h2 className="font-bold text-textMain">
            {STAGES.find(s => s.id === activeStage)?.label} Queue
            <span className="ml-2 text-textMuted font-normal text-sm">({currentItems.length})</span>
          </h2>
          {activeStage === 'RFQ' && (
            <button className="btn btn-outline text-xs">Consolidate RFQ</button>
          )}
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {currentItems.length === 0 && (
            <div className="flex flex-col items-center py-16 text-textMuted gap-3">
              <Package className="w-12 h-12 opacity-20" />
              <p className="font-medium">No items in this stage.</p>
            </div>
          )}

          {currentItems.map((pr, i) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              key={pr['PR Ref']}
              className={cn(
                'flex items-start justify-between gap-4 p-5 border rounded-xl hover:shadow-card transition-all bg-surface group',
                routerLocation.state?.prRef === pr['PR Ref'] ? 'border-primary ring-2 ring-primary/20' : 'border-border/60'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-textMuted bg-surfaceContainer px-2 py-0.5 rounded">
                    {pr['PR Ref']}
                  </span>
                  <span className={cn('badge', urgencyBadge(pr.Urgency))}>{pr.Urgency}</span>
                  {pr['OEM Required'] === 'Yes' && (
                    <span className="badge badge-oem">
                      <Star className="w-3 h-3 mr-0.5" /> OEM
                    </span>
                  )}
                  {pr['Issue Ref'] && (
                    <span className="badge badge-info text-[10px] font-mono">
                      <LinkIcon className="w-3 h-3 mr-0.5" /> {pr['Issue Ref']}
                    </span>
                  )}
                </div>

                <p className="font-bold text-textMain text-sm mb-0.5">{pr['Item / Service Requested']}</p>
                {pr['Part Number'] && (
                  <p className="text-xs text-textMuted font-mono">Part # {pr['Part Number']}</p>
                )}
                <p className="text-xs text-textMuted mt-0.5">{pr['Purpose / Machine Use']} · {pr['Site / Location']}</p>
                {pr['Reason / Issue'] && (
                  <p className="text-xs text-textMuted mt-1">
                    Reason: <span className="font-medium text-textMain">{pr['Reason / Issue']}</span>
                  </p>
                )}
                {pr['Exact Specification'] && (
                  <p className="text-xs text-textMain bg-surfaceContainer rounded px-2 py-1 mt-1.5 leading-relaxed">{pr['Exact Specification']}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                  {pr['Quantity'] && <span className="text-textMuted">Qty: <span className="font-semibold text-textMain">{pr['Quantity']} {pr['Unit']}</span></span>}
                  {pr['Estimated Unit Price'] && <span className="text-textMuted">Est. price: <span className="font-semibold text-textMain">MVR {Number(pr['Estimated Unit Price']).toLocaleString()}</span></span>}
                  {pr['Selected Vendor'] && <span className="text-success font-medium">Supplier: {pr['Selected Vendor']}</span>}
                  {pr['Lead Time'] && <span className="text-textMuted">Lead time: {pr['Lead Time']}</span>}
                </div>
              </div>

              {/* Stage actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {activeStage === 'Draft' && (
                  <>
                    <button onClick={() => generatePDF('Purchase Request', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> PR PDF
                    </button>
                    <button
                      onClick={() => setSpecsModalPR(pr)}
                      className={cn(
                        'btn text-xs py-1.5',
                        specsComplete(pr) ? 'btn-outline text-success border-success/40' : 'btn-primary'
                      )}
                    >
                      {specsComplete(pr) ? <><CheckCircle className="w-3 h-3 mr-1" /> Specs Confirmed</> : <>Confirm Specs <ArrowRight className="w-3 h-3 ml-1" /></>}
                    </button>
                  </>
                )}
                {activeStage === 'Approval' && (
                  <>
                    <button onClick={() => generatePDF('Purchase Request', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> Review PR
                    </button>
                    <button onClick={() => moveItem(pr, 'Verified')} className="btn btn-primary text-xs py-1.5">
                      Approve for RFQ <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </>
                )}
                {activeStage === 'RFQ' && (
                  <>
                    <button onClick={() => generatePDF('RFQ', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> RFQ PDF
                    </button>
                    <button onClick={() => moveItem(pr, 'Quotes Received')} className="btn btn-primary text-xs py-1.5">
                      Mark Quoted <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </>
                )}
                {activeStage === 'Quote' && (
                  <>
                    <button onClick={() => setQuoteModalPR(pr)} className="btn btn-outline text-xs py-1.5">
                      View Quotes
                    </button>
                    <button onClick={() => moveItem(pr, 'PO Created')} className="btn btn-primary text-xs py-1.5">
                      Create PO <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </>
                )}
                {activeStage === 'PO' && (
                  <>
                    <button onClick={() => generatePDF('Purchase Order', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> PO PDF
                    </button>
                    <button onClick={() => raisePaymentRequest(pr)} className="btn btn-outline text-xs py-1.5">
                      Send to Antrac Accounts
                    </button>
                  </>
                )}
                {activeStage === 'Accounts' && (
                  <>
                    <button onClick={() => generatePDF('Purchase Order', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> Accounts Pack
                    </button>
                    <button onClick={() => releaseFinanceToHQ(pr)} className="btn btn-primary text-xs py-1.5">
                      Finance Released <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </>
                )}
                {activeStage === 'HQ' && (
                  <>
                    <button onClick={() => generatePDF('GRN', pr)} className="btn btn-outline text-xs py-1.5">
                      <Download className="w-3 h-3 mr-1" /> GRN PDF
                    </button>
                    <button onClick={() => setDispatchModalPR(pr)} className="btn btn-primary text-xs py-1.5">
                      Assign & Dispatch <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </>
                )}
                {activeStage === 'Dispatch' && (
                  <>
                    {pr.Status === 'Delivered to HQ Inventory' && (
                      <button onClick={() => setDispatchModalPR(pr)} className="btn btn-primary text-xs py-1.5">
                        Assign & Dispatch <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    )}
                    {pr.Status === 'Handed to Logistics' && (
                      <>
                        <button onClick={() => generatePDF('Transfer Note', {
                          'PR Ref': pr['Dispatch Ref'] || pr['PR Ref'],
                          'Site / Location': pr['Dispatch Destination'] || pr['Site / Location'],
                          'Requested By': pr['Original Requester'] || pr['Requested By'],
                          'Item / Service Requested': pr['Item / Service Requested'],
                          'Purpose / Machine Use': `Handover to ${pr['Assigned To'] || 'site receiver'} for ${pr['Reason / Issue'] || pr['Purpose / Machine Use']}`,
                          'Specs Needed': `Qty: ${pr.Quantity || 1} | Linked PR: ${pr['PR Ref']} | Issue: ${pr['Issue Ref'] || 'Manual'}`,
                          'Urgency': pr.Urgency || 'Normal'
                        })} className="btn btn-outline text-xs py-1.5">
                          <Download className="w-3 h-3 mr-1" /> Transfer Note
                        </button>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-warning">
                          <Truck className="w-4 h-4" /> With {pr['Assigned To'] || 'Logistics'}
                        </span>
                      </>
                    )}
                    {pr.Status === 'Delivered to Site' && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                        <CheckCircle className="w-4 h-4" /> Delivered
                      </span>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* New PR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base text-primary">Log New Purchase Request</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePR} className="p-5 overflow-y-auto grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Item / Service Requested *</label>
                <input required name="Item / Service Requested" className="input" placeholder="e.g. Battery 12V/100A for Kobelco" />
              </div>
              <div>
                <label className="label">Part Number</label>
                <input name="Part Number" className="input" placeholder="OEM part # if known" />
              </div>
              <div>
                <label className="label">OEM Required?</label>
                <select name="OEM Required" className="input">
                  <option value="">Not specified</option>
                  <option value="Yes">Yes — OEM only</option>
                  <option value="No">No — Generic acceptable</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Purpose / Machine Use *</label>
                <input required name="Purpose / Machine Use" className="input" placeholder="e.g. Kobelco SK380 battery rectification" />
              </div>
              <div>
                <label className="label">Requested By *</label>
                <input required name="Requested By" className="input" placeholder="Name or title" />
              </div>
              <div>
                <label className="label">Site / Location</label>
                <select name="Site / Location" className="input">
                  {(db.locations || [{ Site: 'Muthaafushi' }, { Site: 'Bodufinolhu' }, { Site: 'Thilafushi - Base' }, { Site: 'New Shipment - Awaiting Receipt' }]).map(l => {
                    const n = l.name || l['Location Name'] || l.Site;
                    return <option key={n}>{n}</option>;
                  })}
                  <option>Unknown</option>
                </select>
              </div>
              <div>
                <label className="label">Urgency</label>
                <select name="Urgency" className="input">
                  <option>HIGH</option><option>CRITICAL</option><option>MEDIUM</option><option>LOW</option>
                </select>
              </div>
              <div>
                <label className="label">Request Channel</label>
                <select name="Request Channel" className="input">
                  <option>Phone/Text</option><option>Email</option><option>Paper PR</option><option>Issue Report</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Issue Report Ref (if linked)</label>
                <input name="Issue Ref" className="input" placeholder="IR-XXXX" />
              </div>
              <div className="col-span-2">
                <label className="label">Specs / Notes</label>
                <textarea name="Specs Needed" className="input h-20 resize-none" />
              </div>
              <div className="col-span-2 pt-3 flex justify-end gap-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Drafts</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── CONFIRM SPECS MODAL ─────────────────────────────────────── */}
      {specsModalPR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-textMuted bg-surfaceContainer px-2 py-0.5 rounded">{specsModalPR['PR Ref']}</span>
                    {specsModalPR['Issue Ref'] && (
                      <span className="badge badge-info text-[10px] font-mono"><LinkIcon className="w-3 h-3 mr-0.5" />{specsModalPR['Issue Ref']}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-textMain">Confirm Purchase Specifications</h3>
                  <p className="text-xs text-textMuted mt-0.5">
                    Fill in exact specs to enable purchasing. Fields marked <span className="text-danger font-bold">*</span> are mandatory before this PR can advance.
                  </p>
                </div>
                <button onClick={() => setSpecsModalPR(null)} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer ml-4">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={confirmSpecs} className="overflow-y-auto flex-1">
              <div className="p-5 space-y-5">

                {/* Original request — read only context */}
                <div className="p-3 bg-surfaceContainer rounded-lg border border-border/60 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Original Request</div>
                  <div><span className="text-textMuted">Item: </span><span className="font-semibold">{specsModalPR['Item / Service Requested']}</span></div>
                  <div><span className="text-textMuted">Purpose: </span><span className="font-medium">{specsModalPR['Purpose / Machine Use']}</span></div>
                  {specsModalPR['Specs Needed'] && <div><span className="text-textMuted">Notes from site: </span><span className="italic">{specsModalPR['Specs Needed']}</span></div>}
                </div>

                {/* Section 1: What exactly to buy */}
                <div>
                  <h4 className="section-label mb-3">What to Buy</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Confirmed Item Name <span className="text-danger">*</span></label>
                      <input
                        required
                        name="Confirmed Item"
                        defaultValue={specsModalPR['Item / Service Requested']}
                        className="input"
                        placeholder="Exact name of what to purchase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">
                          Part Number / OEM Code
                          {specsModalPR['OEM Required'] === 'Yes' && <span className="text-danger"> *</span>}
                        </label>
                        <input
                          name="Part Number"
                          required={specsModalPR['OEM Required'] === 'Yes'}
                          defaultValue={specsModalPR['Part Number'] || ''}
                          className={cn('input', specsModalPR['OEM Required'] === 'Yes' && 'border-oem/60 focus:ring-oem/30')}
                          placeholder={specsModalPR['OEM Required'] === 'Yes' ? 'OEM part # required' : 'Part # if known'}
                        />
                        {specsModalPR['OEM Required'] === 'Yes' && (
                          <p className="text-[10px] text-oem font-semibold mt-1">★ OEM — part number required to ensure correct item</p>
                        )}
                      </div>
                      <div>
                        <label className="label">OEM Required? <span className="text-danger">*</span></label>
                        <select name="OEM Required" defaultValue={specsModalPR['OEM Required'] || ''} required className="input">
                          <option value="">Confirm…</option>
                          <option value="Yes">Yes — OEM only</option>
                          <option value="No">No — Generic acceptable</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Exact Specification <span className="text-danger">*</span></label>
                      <textarea
                        required
                        name="Exact Specification"
                        defaultValue={specsModalPR['Exact Specification'] || specsModalPR['Specs Needed'] || ''}
                        className="input h-20 resize-none"
                        placeholder="Full technical spec — dimensions, grade, rating, voltage, pressure, model compatibility, etc. Be specific enough that anyone can purchase without asking again."
                      />
                      <p className="text-[10px] text-textMuted mt-1">Must be specific enough to enable purchase without further clarification.</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Quantity */}
                <div>
                  <h4 className="section-label mb-3">Quantity</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Quantity <span className="text-danger">*</span></label>
                      <input
                        required
                        type="number"
                        min="1"
                        name="Quantity"
                        defaultValue={specsModalPR['Quantity'] || 1}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Unit of Measure <span className="text-danger">*</span></label>
                      <select required name="Unit" defaultValue={specsModalPR['Unit'] || 'pcs'} className="input">
                        <option value="pcs">pcs — pieces</option>
                        <option value="set">set</option>
                        <option value="m">m — metres</option>
                        <option value="kg">kg — kilograms</option>
                        <option value="L">L — litres</option>
                        <option value="box">box</option>
                        <option value="roll">roll</option>
                        <option value="pair">pair</option>
                        <option value="unit">unit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Supplier & Price */}
                <div>
                  <h4 className="section-label mb-3">Supplier & Budget</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Preferred Supplier <span className="text-danger">*</span></label>
                      <select required name="Preferred Supplier" defaultValue={specsModalPR['Selected Vendor'] || ''} className="input">
                        <option value="">Select supplier…</option>
                        {(db.suppliers || []).map(s => (
                          <option key={s.id || s.name} value={s.name || s.Supplier}>{s.name || s.Supplier}</option>
                        ))}
                        <option value="To be sourced via RFQ">To be sourced via RFQ</option>
                        <option value="Other">Other</option>
                      </select>
                      {(db.suppliers || []).length === 0 && (
                        <p className="text-[10px] text-textMuted mt-1">No suppliers in master data — type name or add via Master Data</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Estimated Unit Price (MVR) <span className="text-danger">*</span></label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        name="Estimated Unit Price"
                        defaultValue={specsModalPR['Estimated Unit Price'] || ''}
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="label">Expected Lead Time</label>
                    <select name="Lead Time" defaultValue={specsModalPR['Lead Time'] || ''} className="input">
                      <option value="">Not specified</option>
                      <option>Same day</option>
                      <option>1–2 days</option>
                      <option>3–5 days</option>
                      <option>1 week</option>
                      <option>2 weeks</option>
                      <option>3–4 weeks</option>
                      <option>6+ weeks (import)</option>
                    </select>
                  </div>
                </div>

                {/* Section 4: Sign-off */}
                <div>
                  <h4 className="section-label mb-3">Sign-off</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Specs Confirmed By <span className="text-danger">*</span></label>
                      <input
                        required
                        name="Confirmed By"
                        defaultValue={specsModalPR['Specs Confirmed By'] || ''}
                        className="input"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="label">Additional Notes</label>
                      <input
                        name="Specs Notes"
                        defaultValue={specsModalPR['Specs Notes'] || ''}
                        className="input"
                        placeholder="Any caveats or sourcing notes"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="px-5 py-4 border-t border-border bg-surfaceContainer flex items-center justify-between gap-3">
                <p className="text-xs text-textMuted">
                  Confirming specs locks this PR and advances it to <span className="font-semibold text-primary">Ops Approval</span> before RFQ.
                </p>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setSpecsModalPR(null)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    Confirm & Send for Approval <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {dispatchModalPR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-lg w-full overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-textMain">Assign Dispatch</h3>
                <p className="text-xs text-textMuted mt-1">
                  {dispatchModalPR['PR Ref']} - {dispatchModalPR['Item / Service Requested']}
                </p>
              </div>
              <button onClick={() => setDispatchModalPR(null)} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={dispatchToStaff} className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-surfaceContainer text-xs space-y-1">
                <div><span className="text-textMuted">Issue reason: </span><span className="font-medium">{dispatchModalPR['Reason / Issue'] || dispatchModalPR['Purpose / Machine Use']}</span></div>
                <div><span className="text-textMuted">Linked issue: </span><span className="font-mono">{dispatchModalPR['Issue Ref'] || 'Manual PR'}</span></div>
                <div><span className="text-textMuted">Original requester: </span><span className="font-medium">{dispatchModalPR['Requested By'] || 'Not recorded'}</span></div>
              </div>
              <div>
                <label className="label">Assign to Site Manager / Receiver *</label>
                <select required name="assignedStaffId" className="input">
                  <option value="">Select from staff register...</option>
                  {staff.filter(s => s['Full Name']).map(s => (
                    <option key={s['Staff ID']} value={s['Staff ID']}>
                      {s['Full Name']} - {s.Designation || s.Category || s['Staff ID']}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Destination Site *</label>
                  <select required name="destination" defaultValue={dispatchModalPR['Site / Location'] || ''} className="input">
                    <option value="">Select destination...</option>
                    {locationOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity *</label>
                  <input required type="number" min="1" name="qty" defaultValue={dispatchModalPR.Quantity || 1} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Dispatch Notes</label>
                <input name="notes" className="input" placeholder="Boat, vehicle, handover notes..." />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button type="button" onClick={() => setDispatchModalPR(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Transfer Note</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quote Comparison Modal */}
      {quoteModalPR && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-5xl w-full overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Quote Comparison</h3>
                <p className="text-xs text-textMuted">{quoteModalPR['PR Ref']} · {quoteModalPR['Item / Service Requested']}</p>
              </div>
              <button onClick={() => { setQuoteModalPR(null); setQuoteException(''); }} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-5">
              <form onSubmit={addQuote} className="p-4 rounded-xl border border-border bg-surfaceContainer/60 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-textMain">Add Supplier Quote</h4>
                    <p className="text-[11px] text-textMuted">Capture received quote data or paste external quote text for traceability.</p>
                  </div>
                  <button type="submit" className="btn btn-primary text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Quote
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <input required name="supplier" className="input text-xs col-span-2" placeholder="Supplier name *" />
                  <input name="contact" className="input text-xs" placeholder="Contact" />
                  <input name="quoteRef" className="input text-xs" placeholder="Quote / invoice ref" />
                  <input type="date" name="quoteDate" className="input text-xs" />
                  <select name="source" className="input text-xs">
                    <option>Email / WhatsApp quote</option>
                    <option>Supplier invoice</option>
                    <option>Phone confirmation</option>
                    <option>Portal/manual entry</option>
                  </select>
                  <input name="partNumber" className="input text-xs" placeholder="Part # / OEM code" />
                  <input required type="number" min="0" step="0.01" name="price" className="input text-xs" placeholder="Unit price *" />
                  <select name="currency" className="input text-xs">
                    <option>MVR</option><option>USD</option><option>AED</option>
                  </select>
                  <input type="number" min="0" step="0.01" name="gstRate" defaultValue={DEFAULT_GST_RATE} className="input text-xs" placeholder="GST %" />
                  <input name="leadTime" className="input text-xs" placeholder="Lead time" />
                  <input name="warranty" className="input text-xs" placeholder="Warranty" />
                  <select name="availability" className="input text-xs">
                    <option>Available now</option>
                    <option>Available on order</option>
                    <option>Import required</option>
                    <option>Limited stock</option>
                  </select>
                  <select name="isOEM" className="input text-xs">
                    <option>No</option><option>Yes</option>
                  </select>
                  <textarea name="externalQuoteText" className="input text-xs col-span-3 h-16 resize-none" placeholder="Paste external quote / invoice text here..." />
                  <textarea name="notes" className="input text-xs col-span-3 h-16 resize-none" placeholder="Comparison notes, delivery terms, payment terms..." />
                </div>
              </form>

              <div className={cn(
                'p-3 rounded-lg border text-xs',
                prQuotes.length >= 3 ? 'bg-successBg border-success/20 text-success' : 'bg-warning/10 border-warning/30 text-warning'
              )}>
                {prQuotes.length >= 3
                  ? `Standard comparison ready: ${prQuotes.length} quotes captured.`
                  : `Only ${prQuotes.length} quote${prQuotes.length === 1 ? '' : 's'} captured. Standard practice requires at least 3 quotes before PO.`
                }
              </div>
              {prQuotes.length === 0 ? (
                <div className="text-center py-8 text-textMuted">
                  <p className="font-medium">No quotes logged yet.</p>
                  <p className="text-xs mt-1">Quotes can be added via Master Data → Quotes</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Quote Ref</th>
                      <th>Part #</th>
                      <th>Base Price</th>
                      <th>GST</th>
                      <th>Total</th>
                      <th>Lead Time</th>
                      <th>Availability</th>
                      <th>OEM?</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prQuotes.map((q, i) => (
                      <tr key={i}>
                        <td className="font-semibold">{q.supplier}</td>
                        <td className="font-mono text-xs">{q.quoteRef || q.id || '—'}</td>
                        <td className="font-mono text-xs">{q.partNumber || '—'}</td>
                        <td className="font-bold text-success">{q.currency || 'MVR'} {Number(q.price || 0).toLocaleString()}</td>
                        <td className="text-textMuted">{q.currency || 'MVR'} {Number(q.gstAmount || ((Number(q.price || 0) * DEFAULT_GST_RATE) / 100)).toLocaleString()} ({q.gstRate ?? DEFAULT_GST_RATE}%)</td>
                        <td className="font-bold text-textMain">{q.currency || 'MVR'} {Number(q.totalWithGst || (Number(q.price || 0) * 1.08)).toLocaleString()}</td>
                        <td className="text-textMuted">{q.leadTime || '—'}</td>
                        <td className="text-textMuted">{q.availability || '—'}</td>
                        <td>
                          {q.isOEM
                            ? <span className="badge badge-oem"><Star className="w-3 h-3 mr-0.5" />OEM</span>
                            : <span className="badge badge-default">Generic</span>
                          }
                        </td>
                        <td>
                          <button
                            onClick={() => selectQuote(quoteModalPR, q)}
                            className="btn btn-primary text-xs py-1"
                          >
                            Select & Create PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {prQuotes.length > 0 && prQuotes.length < 3 && (
                <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 space-y-2">
                  <label className="label text-warning">Limited Quote Justification *</label>
                  <select value={quoteException} onChange={e => setQuoteException(e.target.value)} className="input bg-surface">
                    <option value="">Select reason before creating PO...</option>
                    <option value="Only one known supplier available for this exact item">Only one known supplier available for this exact item</option>
                    <option value="Critical urgency - fastest reliable quote selected">Critical urgency - fastest reliable quote selected</option>
                    <option value="Urgency - cheapest reliable available quote selected">Urgency - cheapest reliable available quote selected</option>
                    <option value="OEM/specialist part - alternate quotes not practical">OEM/specialist part - alternate quotes not practical</option>
                  </select>
                  <p className="text-[11px] text-textMuted">This records a procurement exception. It is allowed, but marked as not standard practice.</p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={() => { setQuoteModalPR(null); setQuoteException(''); }} className="btn btn-ghost">Close</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
