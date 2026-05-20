import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../App';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle, Plus, X, Wrench, Zap, Droplets, Settings,
  Package, HelpCircle, CheckCircle, Edit2, Trash2,
  ShoppingCart, Star, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AiIssueAdvisor from '../components/AiIssueAdvisor';

const CATEGORIES = ['Mechanical', 'Electrical', 'Hydraulic', 'Structural', 'MRO', 'Tyres / Undercarriage', 'Other'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['Reported', 'Under Review', 'Parts Requested', 'Parts Ordered', 'Parts Received', 'Resolved', 'Closed'];
const FILTER_STATUSES = ['All', 'Open', 'Parts Requested', 'Resolved'];

const CATEGORY_ICONS = {
  Mechanical: Wrench, Electrical: Zap, Hydraulic: Droplets,
  Structural: Settings, MRO: Package, Other: HelpCircle,
  'Tyres / Undercarriage': Settings
};

function priorityBadgeClass(p) {
  return p === 'CRITICAL' ? 'badge badge-critical' :
    p === 'HIGH' ? 'badge badge-high' :
    p === 'MEDIUM' ? 'badge badge-medium' :
    'badge badge-low';
}

function statusBadgeClass(s) {
  if (['Resolved', 'Closed'].includes(s)) return 'badge badge-success';
  if (s === 'Parts Received') return 'badge badge-success';
  if (s === 'Parts Requested' || s === 'Parts Ordered') return 'badge badge-warning';
  if (s === 'Under Review') return 'badge badge-info';
  return 'badge badge-default';
}

function emptyPart() {
  return { partId: crypto.randomUUID?.() || Date.now().toString(), name: '', partNumber: '', isOEM: false, preferredSupplier: '', qty: 1, estimatedCost: 0, currency: 'MVR', notes: '', verified: false };
}

export default function IssueReports() {
  const { db, updateDb } = useAppContext();
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [parts, setParts] = useState([emptyPart()]);
  const [quickPart, setQuickPart] = useState(emptyPart());
  const [formAssetId, setFormAssetId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [linkError, setLinkError] = useState('');

  const routerLocation = useLocation();

  const issues = useMemo(() => db.issueReports || [], [db.issueReports]);
  const assets = db.assets || [];
  const suppliers = db.suppliers || [];
  const locations = db.locations || [];
  const locationOptions = Array.from(new Set([
    ...locations.map(l => l.name || l['Location Name'] || l.Location || l.Site).filter(Boolean),
    ...assets.map(a => a.Site || a['Current Location']).filter(Boolean),
    'Thilafushi - Base',
    'Muthaafushi',
    'Bodufinolhu',
    'New Shipment - Awaiting Receipt',
  ])).sort();

  const getNextId = () => {
    const nums = issues.map(x => parseInt((x.id || '').replace('IR-', '')) || 0);
    return `IR-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
  };

  const getNextPrRef = (list) => {
    const nums = list.map(x => parseInt(String(x['PR Ref'] || '').replace('WL-PR-', '')) || 0);
    return `WL-PR-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
  };

  const autoLocation = (assetId) => {
    const a = assets.find(x => x['Asset ID'] === assetId);
    return a?.Site || a?.['Current Location'] || '';
  };

  const assetLabel = (id) => {
    const a = assets.find(x => x['Asset ID'] === id);
    return a ? `${a['Asset ID']} — ${a.Brand} ${a.Model}` : id;
  };

  const buildProcurementRequest = (issue, part, ref) => ({
    'PR Ref': ref,
    'Request Date': new Date().toLocaleDateString(),
    'Request Timestamp': Date.now(),
    'Status': 'Request Received',
    'Item / Service Requested': part.name,
    'Part Number': part.partNumber || '',
    'OEM Required': part.isOEM ? 'Yes' : 'No',
    'Quantity': part.qty || 1,
    'Unit': part.unit || 'pcs',
    'Estimated Unit Price': part.estimatedCost || '',
    'Purpose / Machine Use': issue.assetLabel || issue.assetId
      ? `${issue.assetLabel || issue.assetId} - ${issue.title}`
      : `Site issue - ${issue.title}`,
    'Reason / Issue': issue.description || issue.title,
    'Site / Location': issue.location,
    'Urgency': issue.priority,
    'Requested By': issue.reportedBy,
    'Selected Vendor': part.preferredSupplier || '',
    'Request Channel': 'Issue Report',
    'Issue Ref': issue.id,
    'Issue Part ID': part.partId,
    'Issue Item Verified': part.verified ? 'Yes' : 'No',
    'Verified By': part.verifiedBy || '',
    'Verified At': part.verifiedAt || '',
    'Asset ID': issue.assetId || '',
    'Asset Label': issue.assetLabel || '',
    'Specs Needed': part.notes || issue.symptoms || issue.solutionNotes || '',
    'Notes': [
      part.notes,
      issue.symptoms ? `Symptoms: ${issue.symptoms}` : '',
      issue.solutionNotes ? `Recommended action: ${issue.solutionNotes}` : '',
    ].filter(Boolean).join('\n')
  });

  const syncIssuePartsToProcurement = (issue, procurementList) => {
    const prList = [...procurementList];
    const refs = new Set(issue.linkedPRRefs || []);
    const partsWithRefs = (issue.parts || []).map(part => {
      if (!part.verified) return part;
      const existingIndex = prList.findIndex(pr =>
        pr['Issue Ref'] === issue.id &&
        pr['Issue Part ID'] === part.partId
      );

      if (existingIndex >= 0) {
        const existing = prList[existingIndex];
        const updatedDraft = buildProcurementRequest(issue, part, existing['PR Ref']);
        const canUpdateRequest = ['Request Received', 'Specs Required'].includes(existing.Status);
        prList[existingIndex] = canUpdateRequest
          ? {
              ...existing,
              ...updatedDraft,
              'Request Date': existing['Request Date'],
              'Request Timestamp': existing['Request Timestamp'],
              'Status': existing.Status,
            }
          : {
              ...existing,
              'Reason / Issue': updatedDraft['Reason / Issue'],
              'Site / Location': updatedDraft['Site / Location'],
              'Issue Ref': issue.id,
              'Issue Part ID': part.partId,
              'Asset ID': issue.assetId || '',
              'Asset Label': issue.assetLabel || '',
            };
        refs.add(existing['PR Ref']);
        return { ...part, prRef: existing['PR Ref'] };
      }

      const ref = getNextPrRef(prList);
      prList.push(buildProcurementRequest(issue, part, ref));
      refs.add(ref);
      return { ...part, prRef: ref };
    });

    return {
      procurement: prList,
      issue: {
        ...issue,
        parts: partsWithRefs,
        linkedPRRefs: [...refs],
        status: partsWithRefs.length > 0 && !['Resolved', 'Closed'].includes(issue.status)
          ? 'Parts Requested'
          : issue.status,
      }
    };
  };

  // ── Open form ─────────────────────────────────────────────────
  const openNew = (prefilledAsset = null) => {
    setEditingIssue(null);
    setParts([emptyPart()]);
    setFormAssetId(prefilledAsset || '');
    setFormLocation('');
    setLinkError('');
    setShowForm(true);
  };

  useEffect(() => {
    if (routerLocation.state?.assetId) {
      openNew(routerLocation.state.assetId);
    }
  }, [routerLocation.state?.assetId]);

  useEffect(() => {
    if (routerLocation.state?.issueId && issues.length > 0) {
      const issue = issues.find(x => x.id === routerLocation.state.issueId);
      if (issue) {
        setSelectedIssue(issue);
        setShowForm(false);
      }
    }
  }, [routerLocation.state?.issueId, issues]);

  if (!db) return null;

  const openEdit = (issue) => {
    setEditingIssue(issue);
    setParts(issue.parts?.length ? issue.parts : [emptyPart()]);
    setFormAssetId(issue.assetId || '');
    setFormLocation(issue.location || '');
    setLinkError('');
    setShowForm(true);
  };

  // ── Save issue ────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const resolvedLocation = formLocation.trim() || (formAssetId ? autoLocation(formAssetId) : '');
    if (!formAssetId && !resolvedLocation.trim()) {
      setLinkError('An issue must be linked to a machine or a site — fill in at least one.');
      return;
    }
    setLinkError('');
    const cleanParts = parts
      .filter(p => p.name.trim())
      .map(p => ({ ...p, partId: p.partId || (crypto.randomUUID?.() || `${Date.now()}-${p.name}`) }));
    let issue = {
      ...d,
      assetId: formAssetId,
      assetLabel: formAssetId ? assetLabel(formAssetId) : '',
      location: resolvedLocation,
      parts: cleanParts,
      linkedPRRefs: editingIssue?.linkedPRRefs || [],
      reportedAt: editingIssue?.reportedAt || new Date().toISOString(),
      resolvedAt: d.status === 'Resolved' ? (editingIssue?.resolvedAt || new Date().toISOString()) : null,
    };

    const procurement = db.procurement || [];
    let updatedProcurement = procurement;
    let list = [...issues];
    if (editingIssue?.id) {
      issue.id = editingIssue.id;
    } else {
      issue.id = getNextId();
    }

    if (cleanParts.length > 0 && issue.status === 'Parts Requested') {
      const synced = syncIssuePartsToProcurement(issue, procurement);
      issue = synced.issue;
      updatedProcurement = synced.procurement;
    }

    if (editingIssue?.id) {
      list = list.map(x => x.id === editingIssue.id ? issue : x);
    } else {
      list = [...list, issue];
    }
    await updateDb({ issueReports: list, procurement: updatedProcurement });
    setShowForm(false);
    setSelectedIssue(issue);
  };

  // ── Escalate to procurement ───────────────────────────────────
  // ── Update status inline ──────────────────────────────────────
  const updateStatus = async (issue, status) => {
    let nextIssue = {
      ...issue,
      status,
      resolvedAt: ['Resolved', 'Closed'].includes(status) ? new Date().toISOString() : null
    };
    let nextProcurement = db.procurement || [];

    if (status === 'Parts Requested') {
      if (!nextIssue.parts?.some(p => p.name && p.verified)) {
        alert('Verify at least one required item before marking parts requested.');
        return;
      }
      const synced = syncIssuePartsToProcurement(nextIssue, nextProcurement);
      nextIssue = synced.issue;
      nextProcurement = synced.procurement;
    }

    const updated = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updated, procurement: nextProcurement });
    setSelectedIssue(prev => prev?.id === issue.id ? nextIssue : prev);
  };

  const addQuickPart = async (e, issue) => {
    e.preventDefault();
    if (!quickPart.name.trim()) return;

    const part = {
      ...quickPart,
      partId: quickPart.partId || (crypto.randomUUID?.() || `${Date.now()}-${quickPart.name}`),
      qty: Number(quickPart.qty) || 1,
      estimatedCost: Number(quickPart.estimatedCost) || 0,
      verified: false,
    };
    let nextIssue = {
      ...issue,
      parts: [...(issue.parts || []), part],
    };
    let nextProcurement = db.procurement || [];

    if (nextIssue.status === 'Parts Requested') {
      const synced = syncIssuePartsToProcurement(nextIssue, nextProcurement);
      nextIssue = synced.issue;
      nextProcurement = synced.procurement;
    }

    const updatedIssues = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updatedIssues, procurement: nextProcurement });
    setSelectedIssue(nextIssue);
    setQuickPart(emptyPart());
  };

  const verifyIssuePart = async (issue, partId) => {
    let nextIssue = {
      ...issue,
      parts: (issue.parts || []).map(part =>
        part.partId === partId
          ? { ...part, verified: true, verifiedBy: 'WL Ops', verifiedAt: new Date().toISOString() }
          : part
      )
    };
    let nextProcurement = db.procurement || [];
    if (nextIssue.status === 'Parts Requested') {
      const synced = syncIssuePartsToProcurement(nextIssue, nextProcurement);
      nextIssue = synced.issue;
      nextProcurement = synced.procurement;
    }
    const updatedIssues = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updatedIssues, procurement: nextProcurement });
    setSelectedIssue(nextIssue);
  };

  const convertVerifiedItemsToProcurement = async (issue) => {
    const parts = issue.parts || [];
    if (!parts.length || parts.some(part => !part.verified)) {
      alert('All requested items must be verified before conversion to procurement.');
      return;
    }
    let nextIssue = { ...issue, status: 'Parts Requested' };
    const synced = syncIssuePartsToProcurement(nextIssue, db.procurement || []);
    nextIssue = synced.issue;
    const updatedIssues = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updatedIssues, procurement: synced.procurement });
    setSelectedIssue(nextIssue);
  };

  // ── AI-recommended parts ──────────────────────────────────────
  const addAIPart = async (issue, aiPart) => {
    const part = {
      partId:           crypto.randomUUID?.() || `ai-${Date.now()}-${Math.random()}`,
      name:             aiPart.name,
      partNumber:       aiPart.partNumber || '',
      qty:              Number(aiPart.qty) || 1,
      unit:             aiPart.unit || 'pcs',
      isOEM:            aiPart.isOEM || false,
      estimatedCost:    Number(aiPart.estimatedCost) || 0,
      currency:         aiPart.currency || 'MVR',
      notes:            aiPart.reason ? `AI: ${aiPart.reason}` : '',
      verified:         false,
      aiSuggested:      true,
    };
    const nextIssue = { ...issue, parts: [...(issue.parts || []), part] };
    const updated   = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updated });
    setSelectedIssue(nextIssue);
  };

  const addAllAIParts = async (issue, aiParts) => {
    const newParts = aiParts.map(aiPart => ({
      partId:        crypto.randomUUID?.() || `ai-${Date.now()}-${Math.random()}`,
      name:          aiPart.name,
      partNumber:    aiPart.partNumber || '',
      qty:           Number(aiPart.qty) || 1,
      unit:          aiPart.unit || 'pcs',
      isOEM:         aiPart.isOEM || false,
      estimatedCost: Number(aiPart.estimatedCost) || 0,
      currency:      aiPart.currency || 'MVR',
      notes:         aiPart.reason ? `AI recommended: ${aiPart.reason}` : '',
      verified:      false,
      aiSuggested:   true,
    }));
    const nextIssue = { ...issue, parts: [...(issue.parts || []), ...newParts] };
    const updated   = issues.map(x => x.id === issue.id ? nextIssue : x);
    await updateDb({ issueReports: updated });
    setSelectedIssue(nextIssue);
  };

  // ── Filtered list ─────────────────────────────────────────────
  const filtered = issues.filter(x => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Open') return !['Resolved', 'Closed', 'Parts Requested', 'Parts Ordered'].includes(x.status);
    return x.status === filterStatus;
  }).sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  // ── Parts Editor ─────────────────────────────────────────────
  const PartRow = ({ part, idx }) => (
    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-surfaceContainer rounded-lg">
      <div className="col-span-3">
        <input
          value={part.name}
          onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
          className="input text-xs" placeholder="Part / item name *"
        />
      </div>
      <div className="col-span-2">
        <input
          value={part.partNumber}
          onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, partNumber: e.target.value } : p))}
          className="input text-xs" placeholder="Part # / OEM code"
        />
      </div>
      <div className="col-span-2">
        <select
          value={part.preferredSupplier}
          onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, preferredSupplier: e.target.value } : p))}
          className="input text-xs"
        >
          <option value="">Supplier…</option>
          {suppliers.map(s => <option key={s.id || s.name} value={s.name || s.Supplier}>{s.name || s.Supplier}</option>)}
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="col-span-1">
        <input
          type="number" min="1"
          value={part.qty}
          onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, qty: Number(e.target.value) } : p))}
          className="input text-xs" placeholder="Qty"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={part.estimatedCost}
          onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, estimatedCost: Number(e.target.value) } : p))}
          className="input text-xs" placeholder="Est. cost"
        />
      </div>
      <div className="col-span-1 flex items-center gap-1 pt-2">
        <label className={cn(
          'flex items-center gap-1 cursor-pointer px-2 py-1.5 rounded-md text-xs font-bold transition-colors',
          part.isOEM ? 'bg-oemBg text-oem' : 'bg-surfaceContainer text-textMuted hover:bg-oemBg/50'
        )}>
          <input
            type="checkbox"
            checked={part.isOEM}
            onChange={e => setParts(ps => ps.map((p, i) => i === idx ? { ...p, isOEM: e.target.checked } : p))}
            className="hidden"
          />
          <Star className="w-3 h-3" />
          OEM
        </label>
      </div>
      <div className="col-span-1 flex items-center pt-1">
        <button
          type="button"
          onClick={() => setParts(ps => ps.filter((_, i) => i !== idx))}
          className="text-textMuted hover:text-danger p-1.5 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const totalEstCost = parts.reduce((s, p) => s + (Number(p.estimatedCost) || 0) * (Number(p.qty) || 1), 0);
  const oemCount = parts.filter(p => p.isOEM).length;

  return (
    <div className="flex gap-6 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* ── LEFT: Issue List ──────────────────────────────────── */}
      <div className="w-96 shrink-0 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <h1 className="page-title text-xl">Issue Reports</h1>
            </div>
            <p className="text-xs text-textMuted">{issues.length} total · {issues.filter(x => !['Resolved', 'Closed'].includes(x.status)).length} open</p>
          </div>
          <button onClick={() => openNew()} className="btn btn-primary text-xs px-3 py-2">
            <Plus className="w-3.5 h-3.5 mr-1" /> Log Issue
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 flex-wrap">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                filterStatus === s ? 'bg-primary text-white' : 'bg-surfaceContainer text-textMuted hover:text-textMain'
              )}
            >
              {s}
              {s === 'All' && ` (${issues.length})`}
              {s === 'Open' && ` (${issues.filter(x => ['Reported', 'Under Review'].includes(x.status)).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="card text-center py-12 text-textMuted">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No issues found.</p>
            </div>
          )}
          {filtered.map(issue => {
            const CatIcon = CATEGORY_ICONS[issue.category] || HelpCircle;
            const isSelected = selectedIssue?.id === issue.id;
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedIssue(issue)}
                className={cn(
                  'card p-4 cursor-pointer transition-all hover:shadow-card',
                  isSelected ? 'border-primary shadow-card ring-1 ring-primary/30' : 'hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-4 h-4 text-textMuted shrink-0" />
                    <span className="font-mono text-[11px] text-textMuted font-semibold">{issue.id}</span>
                  </div>
                  <span className={priorityBadgeClass(issue.priority)}>{issue.priority}</span>
                </div>
                <div className="font-semibold text-sm text-textMain mb-1 line-clamp-2">{issue.title}</div>
                <div className="text-xs text-textMuted mb-2">
                  {issue.assetLabel || issue.assetId || <span className="italic">No machine — {issue.location}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className={statusBadgeClass(issue.status)}>{issue.status}</span>
                  <span className="text-[10px] text-textMuted">{issue.location}</span>
                </div>
                {issue.parts?.length > 0 && (
                  <div className="mt-2 text-[10px] text-textMuted border-t border-border/50 pt-2">
                    {issue.parts.length} part{issue.parts.length > 1 ? 's' : ''} listed
                    {issue.parts.filter(p => p.isOEM).length > 0 && (
                      <span className="ml-2 text-oem font-bold">
                        · {issue.parts.filter(p => p.isOEM).length} OEM
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Detail Panel ───────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selectedIssue && !showForm && (
          <div className="card h-full flex flex-col items-center justify-center text-textMuted gap-4">
            <AlertTriangle className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <p className="font-semibold">Select an issue to view details</p>
              <p className="text-sm mt-1">or log a new issue from the list panel</p>
            </div>
            <button onClick={() => openNew()} className="btn btn-primary mt-2">
              <Plus className="w-4 h-4 mr-2" /> Log New Issue
            </button>
          </div>
        )}

        {/* Issue Detail */}
        {selectedIssue && !showForm && (() => {
          const issue = issues.find(x => x.id === selectedIssue?.id) || selectedIssue;
          const CatIcon = CATEGORY_ICONS[issue.category] || HelpCircle;
          const canEscalate = issue.parts?.length > 0 && !['Parts Requested', 'Parts Ordered', 'Parts Received', 'Resolved', 'Closed'].includes(issue.status);
          const allItemsVerified = issue.parts?.length > 0 && issue.parts.every(p => p.verified);
          const hasUnconvertedItems = allItemsVerified && issue.parts.some(p => !p.prRef);
          return (
            <div className="card overflow-y-auto space-y-6">
              {/* Issue header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-textMuted">{issue.id}</span>
                    <span className={priorityBadgeClass(issue.priority)}>{issue.priority}</span>
                    <span className={statusBadgeClass(issue.status)}>{issue.status}</span>
                  </div>
                  <h2 className="text-xl font-bold text-textMain">{issue.title}</h2>
                  <p className="text-sm text-textMuted mt-1">
                    {issue.assetLabel || issue.assetId
                      ? <>{issue.assetLabel || issue.assetId} · {issue.location}</>
                      : <>Site issue · <span className="font-semibold text-textMain">{issue.location}</span></>
                    }
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(issue)} className="btn btn-outline text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  {canEscalate && (
                    <button
                      onClick={() => updateStatus(issue, 'Parts Requested')}
                      className="btn btn-primary text-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Mark Parts Requested
                    </button>
                  )}
                  {hasUnconvertedItems && (
                    <button
                      onClick={() => convertVerifiedItemsToProcurement(issue)}
                      className="btn btn-primary text-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Convert Verified Items to PR
                    </button>
                  )}
                </div>
              </div>

              {/* Status progression */}
              <div className="flex items-center gap-1 flex-wrap">
                {STATUSES.map((s, i) => {
                  const isActive = issue.status === s;
                  const isPast = STATUSES.indexOf(issue.status) > i;
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(issue, s)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        isActive ? 'bg-primary text-white' :
                        isPast ? 'bg-successBg text-success' :
                        'bg-surfaceContainer text-textMuted hover:bg-primaryContainer'
                      )}
                    >
                      {isPast && !isActive ? <CheckCircle className="w-3 h-3 inline mr-1" /> : null}
                      {s}
                    </button>
                  );
                })}
              </div>

              {issue.status === 'Parts Received' && (
                <div className="flex items-center justify-between gap-3 p-3 bg-successBg border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-success font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Required item(s) have been received. This issue can now be resolved or closed.
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="section-label mb-1">Reported By</div>
                    <div className="font-medium text-sm">{issue.reportedBy}</div>
                  </div>
                  <div>
                    <div className="section-label mb-1">Category</div>
                    <div className="flex items-center gap-2 text-sm">
                      <CatIcon className="w-4 h-4 text-textMuted" />
                      <span className="font-medium">{issue.category}</span>
                    </div>
                  </div>
                  <div>
                    <div className="section-label mb-1">Reported At</div>
                    <div className="text-sm text-textMuted">{issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="section-label mb-1">Description</div>
                    <div className="text-sm">{issue.description || '—'}</div>
                  </div>
                  <div>
                    <div className="section-label mb-1">Symptoms</div>
                    <div className="text-sm text-textMuted">{issue.symptoms || '—'}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label mb-2">Solution Notes</div>
                <div className="p-3 bg-surfaceContainer rounded-lg text-sm">{issue.solutionNotes || '—'}</div>
              </div>

              {/* AI Issue Advisor — key resets all state when switching issues */}
              {!['Resolved', 'Closed'].includes(issue.status) && (
                <AiIssueAdvisor
                  key={issue.id}
                  issue={issue}
                  onAddPart={(aiPart) => addAIPart(issue, aiPart)}
                  onAddAllParts={(aiParts) => addAllAIParts(issue, aiParts)}
                />
              )}

              {!['Resolved', 'Closed'].includes(issue.status) && (
                <form onSubmit={(e) => addQuickPart(e, issue)} className="p-4 border border-border rounded-xl bg-surfaceContainer/60 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="section-label">Add Rectification Item</div>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        Site supervisors can add items here. WL Ops must verify them before they become PRs.
                      </p>
                    </div>
                    <button type="submit" className="btn btn-primary text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      value={quickPart.name}
                      onChange={e => setQuickPart(p => ({ ...p, name: e.target.value }))}
                      className="input text-xs col-span-3"
                      placeholder="Part / item name *"
                    />
                    <input
                      value={quickPart.partNumber}
                      onChange={e => setQuickPart(p => ({ ...p, partNumber: e.target.value }))}
                      className="input text-xs col-span-2"
                      placeholder="Part # / OEM code"
                    />
                    <select
                      value={quickPart.preferredSupplier}
                      onChange={e => setQuickPart(p => ({ ...p, preferredSupplier: e.target.value }))}
                      className="input text-xs col-span-2"
                    >
                      <option value="">Supplier...</option>
                      {suppliers.map(s => <option key={s.id || s.name || s.Supplier} value={s.name || s.Supplier}>{s.name || s.Supplier}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={quickPart.qty}
                      onChange={e => setQuickPart(p => ({ ...p, qty: Number(e.target.value) }))}
                      className="input text-xs col-span-1"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      value={quickPart.estimatedCost}
                      onChange={e => setQuickPart(p => ({ ...p, estimatedCost: Number(e.target.value) }))}
                      className="input text-xs col-span-2"
                      placeholder="Est. cost"
                    />
                    <label className={cn(
                      'col-span-2 flex items-center justify-center gap-1 cursor-pointer px-2 rounded-md text-xs font-bold transition-colors',
                      quickPart.isOEM ? 'bg-oemBg text-oem' : 'bg-surface text-textMuted hover:bg-oemBg/50'
                    )}>
                      <input
                        type="checkbox"
                        checked={quickPart.isOEM}
                        onChange={e => setQuickPart(p => ({ ...p, isOEM: e.target.checked }))}
                        className="hidden"
                      />
                      <Star className="w-3 h-3" />
                      OEM
                    </label>
                  </div>
                </form>
              )}

              {/* Parts list */}
              {issue.parts?.length > 0 && (
                <div>
                  <div className="section-label mb-3">
                    Parts Required ({issue.parts.length})
                    {issue.parts.filter(p => p.isOEM).length > 0 && (
                      <span className="ml-2 badge badge-oem">
                        <Star className="w-3 h-3 mr-0.5" />
                        {issue.parts.filter(p => p.isOEM).length} OEM
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Part Name</th>
                          <th>Part #</th>
                          <th>Supplier</th>
                          <th>Qty</th>
                          <th>Est. Cost</th>
                          <th>Type</th>
                          <th>Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issue.parts.map((p, i) => (
                          <tr key={p.partId || i}>
                            <td className="font-semibold">
                              <div className="flex items-center gap-1.5">
                                {p.aiSuggested && (
                                  <span title="AI-recommended" className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                    <Sparkles className="w-2.5 h-2.5" />AI
                                  </span>
                                )}
                                {p.name}
                              </div>
                            </td>
                            <td className="font-mono text-xs text-textMuted">{p.partNumber || '—'}</td>
                            <td className="text-textMuted">{p.preferredSupplier || '—'}</td>
                            <td>{p.qty}</td>
                            <td>{p.currency || 'MVR'} {Number(p.estimatedCost || 0).toLocaleString()}</td>
                            <td>
                              {p.isOEM
                                ? <span className="badge badge-oem"><Star className="w-3 h-3 mr-0.5" />OEM</span>
                                : <span className="badge badge-default">Generic</span>
                              }
                            </td>
                            <td>
                              {p.verified ? (
                                <span className="badge badge-success">Verified</span>
                              ) : (
                                <button onClick={() => verifyIssuePart(issue, p.partId)} className="btn btn-outline text-xs py-1">
                                  Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-surfaceContainer font-semibold">
                          <td colSpan={4} className="text-right text-textMuted">Total Estimated:</td>
                          <td>MVR {issue.parts.reduce((s, p) => s + (Number(p.estimatedCost) || 0) * (Number(p.qty) || 1), 0).toLocaleString()}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Linked PRs */}
              {issue.linkedPRRefs?.length > 0 && (
                <div>
                  <div className="section-label mb-2">Linked Purchase Requests</div>
                  <div className="flex flex-wrap gap-2">
                    {issue.linkedPRRefs.map(ref => (
                      <span key={ref} className="badge badge-info font-mono">{ref}</span>
                    ))}
                  </div>
                </div>
              )}

              {issue.resolutionNotes && (
                <div>
                  <div className="section-label mb-2">Resolution Notes</div>
                  <div className="p-3 bg-successBg border border-success/20 rounded-lg text-sm text-success">{issue.resolutionNotes}</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── FORM MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface rounded-xl shadow-elevated w-full max-w-4xl my-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-bold text-lg text-textMain">
                  {editingIssue ? `Edit Issue ${editingIssue.id}` : 'Log New Issue Report'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Link validation error */}
                {linkError && (
                  <div className="flex items-center gap-2 p-3 bg-dangerBg border border-danger/30 rounded-lg text-sm text-danger font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {linkError}
                  </div>
                )}

                {/* Machine + location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Machine / Asset
                      <span className="ml-1 text-textMuted font-normal text-[11px]">(required if no site selected)</span>
                    </label>
                    <select
                      value={formAssetId}
                      onChange={e => {
                        setFormAssetId(e.target.value);
                        setLinkError('');
                      }}
                      className="input"
                    >
                      <option value="">— No specific machine —</option>
                      {assets.map(a => (
                        <option key={a['Asset ID']} value={a['Asset ID']}>
                          {a['Asset ID']} — {a.Brand} {a.Model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Site / Location
                      <span className="ml-1 text-textMuted font-normal text-[11px]">(required if no machine selected)</span>
                    </label>
                    <select
                      value={formLocation}
                      onChange={e => { setFormLocation(e.target.value); setLinkError(''); }}
                      className={cn('input', !formAssetId && !formLocation ? 'border-warning ring-1 ring-warning/30' : '')}
                    >
                      <option value="">Select site…</option>
                      {locationOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Reported By *</label>
                    <input required name="reportedBy" defaultValue={editingIssue?.reportedBy || ''} className="input" placeholder="Site manager name" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select name="category" defaultValue={editingIssue?.category || 'Mechanical'} className="input">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select name="priority" defaultValue={editingIssue?.priority || 'HIGH'} className="input">
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Issue Title *</label>
                  <input required name="title" defaultValue={editingIssue?.title || ''} className="input" placeholder="e.g. Battery not holding charge — Kobelco SK380" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Description</label>
                    <textarea name="description" defaultValue={editingIssue?.description || ''} className="input h-24 resize-none" placeholder="Detailed description of the issue…" />
                  </div>
                  <div>
                    <label className="label">Symptoms Observed</label>
                    <textarea name="symptoms" defaultValue={editingIssue?.symptoms || ''} className="input h-24 resize-none" placeholder="What symptoms is the machine showing?" />
                  </div>
                </div>

                <div>
                  <label className="label">Solution / Recommended Action</label>
                  <textarea name="solutionNotes" defaultValue={editingIssue?.solutionNotes || ''} className="input h-20 resize-none" placeholder="Recommended solution and steps…" />
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select name="status" defaultValue={editingIssue?.status || 'Reported'} className="input">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  {editingIssue?.status === 'Resolved' || editingIssue?.status === 'Closed' ? (
                    <div>
                      <label className="label">Resolution Notes</label>
                      <input name="resolutionNotes" defaultValue={editingIssue?.resolutionNotes || ''} className="input" />
                    </div>
                  ) : <div />}
                </div>

                {/* Parts list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="label mb-0">Parts / Materials Required</label>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        Mark OEM parts with the <span className="text-oem font-bold">★ OEM</span> toggle — OEM parts will be flagged in procurement.
                        {oemCount > 0 && <span className="text-oem font-semibold"> {oemCount} OEM</span>}
                        {parts.filter(p => p.name).length > 0 && <span className="text-textMuted"> · Est. total: MVR {totalEstCost.toLocaleString()}</span>}
                      </p>
                    </div>
                    <button type="button" onClick={() => setParts(ps => [...ps, emptyPart()])} className="btn btn-outline text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Part
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 px-3 mb-1 text-[10px] font-bold text-textMuted uppercase tracking-wide">
                    <div className="col-span-3">Part Name</div>
                    <div className="col-span-2">Part # / OEM Code</div>
                    <div className="col-span-2">Supplier</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Est. Cost (MVR)</div>
                    <div className="col-span-1">OEM</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-2">
                    {parts.map((part, idx) => <PartRow key={part.partId} part={part} idx={idx} />)}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingIssue ? 'Update Issue' : 'Log Issue Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
