import { useEffect, useState } from 'react';
import { Star, Plus, Building2, FileText, TrendingUp, Edit2, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../App';
import { cn } from '../lib/utils';
import { exportToExcel } from '../lib/excelExport';

const CLIENT_CATEGORIES = ['Government / SOE', 'Private', 'Group Company', 'NGO', 'Other'];
const AGREEMENT_STATUSES = ['Active', 'Draft', 'Ended', 'Suspended'];
const BILLING_CYCLES = ['Monthly', 'Weekly', 'Daily', 'Project-based'];

function statusBadge(status) {
  const map = {
    Active: 'badge badge-success',
    Draft: 'badge badge-default',
    Ended: 'badge bg-slate-200 text-slate-600',
    Suspended: 'badge badge-warning',
  };
  return map[status] || 'badge badge-default';
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-elevation-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="md3-icon-btn">✕</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default function CRM() {
  const { db, updateTable } = useAppContext();
  const [activeTab, setActiveTab] = useState('agreements');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null);

  if (!db) return null;

  const clients = db.clients || [];
  const agreements = db.rentalAgreements || [];
  const assets = db.assets || [];
  const vessels = db.vessels || [];

  // ── Stats ────────────────────────────────────────────────────────────────
  const activeAgreements = agreements.filter(a => a.status === 'Active');
  const dailyRevenue = activeAgreements.reduce((s, a) => s + (Number(a.dailyRate) || 0), 0);
  const monthlyRevenue = dailyRevenue * 30;
  const deployedAssets = new Set(activeAgreements.flatMap(a => [...(a.assetIds || []), ...(a.vesselIds || [])])).size;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clientName = (id) => clients.find(c => c.id === id)?.company || id || '—';
  const assetLabel = (id) => {
    const a = assets.find(x => x['Asset ID'] === id);
    return a ? `${a['Asset ID']} – ${a.Brand || ''} ${a.Model || ''}`.trim() : id;
  };
  const vesselLabel = (id) => {
    const v = vessels.find(x => x['Vessel ID'] === id);
    return v ? (v['Vessel ID'] + (v['Name/Ref'] ? ` – ${v['Name/Ref']}` : '')) : id;
  };

  const getNextId = (prefix, list) => {
    const nums = list.map(x => parseInt((x.id || '').replace(prefix, '') || 0)).filter(Boolean);
    return `${prefix}${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredAgreements = agreements.filter(a => {
    const term = search.toLowerCase();
    const matchSearch = !search
      || clientName(a.clientId).toLowerCase().includes(term)
      || assetLabel(a.assetId).toLowerCase().includes(term)
      || (a.projectName || '').toLowerCase().includes(term)
      || (a.id || '').toLowerCase().includes(term);
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredClients = clients.filter(c =>
    !search
    || (c.company || '').toLowerCase().includes(search.toLowerCase())
    || (c.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Save helpers ──────────────────────────────────────────────────────────
  const saveClient = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let list = [...clients];
    if (modal.data?.id) {
      list = list.map(c => c.id === modal.data.id ? { ...c, ...d } : c);
      toast.success('Client updated');
    } else {
      list.push({ id: getNextId('CLT', clients), createdAt: new Date().toISOString(), ...d });
      toast.success('Client added');
    }
    await updateTable('clients', list);
    setModal(null);
  };

  const saveAgreement = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.dailyRate = Number(d.dailyRate) || 0;
    d.assetIds = d.assetIds ? d.assetIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    d.vesselIds = d.vesselIds ? d.vesselIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    let list = [...agreements];
    if (modal.data?.id) {
      list = list.map(a => a.id === modal.data.id ? { ...a, ...d } : a);
      toast.success('Agreement updated');
    } else {
      list.push({ id: getNextId('RA', agreements), createdAt: new Date().toISOString(), ...d });
      toast.success('Agreement created');
    }
    await updateTable('rentalAgreements', list);
    setModal(null);
  };

  const tabs = [
    { id: 'agreements', label: 'Rental Agreements', icon: FileText, count: agreements.length },
    { id: 'clients',    label: 'Clients',            icon: Building2, count: clients.length },
    { id: 'revenue',    label: 'Revenue Overview',   icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-primary" />
            <h1 className="page-title">CRM & Rentals</h1>
          </div>
          <p className="text-body-sm text-on-surface-variant">Manage clients, rental agreements, and revenue tracking.</p>
        </div>
        <button
          onClick={() => exportToExcel(agreements, 'Agreements', 'wl-rental-agreements')}
          className="btn-outline text-sm"
        >
          Export Excel
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Agreements', value: activeAgreements.length, icon: FileText, color: 'text-primary bg-primary-container' },
          { label: 'Daily Revenue', value: `MVR ${dailyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-success bg-success-container' },
          { label: 'Monthly Projected', value: `MVR ${monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-secondary bg-secondary-container' },
          { label: 'Deployed Assets', value: deployedAssets, icon: Star, color: 'text-warning bg-warning-container' },
        ].map(k => (
          <div key={k.label} className="card flex items-center gap-4 p-5">
            <div className={cn('ops-icon', k.color)}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-body-xs text-on-surface-variant">{k.label}</div>
              <div className="text-title-md font-bold text-on-surface">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearch(''); setFilterStatus('All'); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-label-lg font-medium border-b-2 -mb-px transition-colors',
              activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── AGREEMENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'agreements' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agreements…" className="input pl-9" />
            </div>
            <div className="flex gap-1">
              {['All', ...AGREEMENT_STATUSES].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filterStatus === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  )}>{s}</button>
              ))}
            </div>
            <button onClick={() => setModal({ type: 'agreement', data: {} })} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Agreement
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Client</th><th>Asset / Vessel</th><th>Project</th>
                  <th>Period</th><th>Daily Rate</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-on-surface-variant">No agreements found.</td></tr>
                )}
                {filteredAgreements.map(a => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs text-on-surface-variant">{a.id}</td>
                    <td className="font-semibold">{clientName(a.clientId)}</td>
                    <td className="text-xs">
                      <div>{(a.assetIds?.length ? a.assetIds.map(assetLabel).join(', ') : '') || '—'}</div>
                      {a.vesselIds?.length > 0 && <div className="text-on-surface-variant">Vessels: {a.vesselIds.map(vesselLabel).join(', ')}</div>}
                    </td>
                    <td>{a.projectName || '—'}</td>
                    <td className="text-xs">
                      <div>{a.startDate || '—'}</div>
                      <div className="text-on-surface-variant">{a.endDate || 'Open'}</div>
                    </td>
                    <td className="font-semibold text-success">{a.currency || 'MVR'} {Number(a.dailyRate || 0).toLocaleString()}</td>
                    <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                    <td>
                      <button onClick={() => setModal({ type: 'agreement', data: a })} className="md3-icon-btn w-8 h-8">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CLIENTS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" className="input pl-9" />
            </div>
            <button onClick={() => setModal({ type: 'client', data: {} })} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.length === 0 && (
              <div className="col-span-3 text-center py-12 text-on-surface-variant">No clients yet. Add your first client.</div>
            )}
            {filteredClients.map(c => {
              const clientAgreements = agreements.filter(a => a.clientId === c.id);
              const activeCount = clientAgreements.filter(a => a.status === 'Active').length;
              return (
                <div key={c.id} className="card hover:shadow-elevation-2 transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary-container flex items-center justify-center font-bold text-secondary text-sm">
                      {(c.company || '?').charAt(0).toUpperCase()}
                    </div>
                    <button onClick={() => setModal({ type: 'client', data: c })} className="md3-icon-btn w-8 h-8">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-bold text-on-surface">{c.company || '—'}</div>
                  <div className="text-body-xs text-on-surface-variant mb-3">{c.category}</div>
                  <div className="text-body-sm text-on-surface-variant">{c.contactName || '—'}</div>
                  {c.contactPhone && <div className="text-body-xs text-on-surface-variant">📞 {c.contactPhone}</div>}
                  <div className="mt-3 pt-3 border-t border-outline-variant flex items-center gap-2">
                    <span className="badge badge-info">{clientAgreements.length} agreement{clientAgreements.length !== 1 ? 's' : ''}</span>
                    {activeCount > 0 && <span className="badge badge-success">{activeCount} active</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REVENUE TAB ────────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-primary text-on-primary border-0 col-span-1">
              <div className="text-body-sm opacity-80 mb-1">Daily Revenue (Active)</div>
              <div className="text-headline-md font-bold">MVR {dailyRevenue.toLocaleString()}</div>
              <div className="text-body-sm opacity-70 mt-1">{activeAgreements.length} active agreements</div>
            </div>
            <div className="card">
              <div className="text-body-xs text-on-surface-variant mb-1">Projected Monthly</div>
              <div className="text-title-lg font-bold text-on-surface">MVR {monthlyRevenue.toLocaleString()}</div>
              <div className="text-body-xs text-on-surface-variant mt-1">Based on current active rates × 30</div>
            </div>
            <div className="card">
              <div className="text-body-xs text-on-surface-variant mb-1">Total Portfolio</div>
              <div className="text-title-lg font-bold text-on-surface">{agreements.length} agreements</div>
              <div className="text-body-xs text-on-surface-variant mt-1">{agreements.filter(a=>a.status==='Draft').length} draft · {agreements.filter(a=>a.status==='Ended').length} ended</div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h3 className="text-title-sm font-bold text-on-surface">Active Agreements Breakdown</h3>
            </div>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Client</th><th>Asset</th><th>Project</th><th>Daily Rate</th><th>Monthly Value</th><th>Billing</th></tr></thead>
              <tbody>
                {activeAgreements.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant">No active agreements.</td></tr>
                )}
                {activeAgreements.map(a => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.id}</td>
                    <td className="font-semibold">{clientName(a.clientId)}</td>
                    <td className="text-xs">{(a.assetIds || []).map(assetLabel).join(', ') || '—'}</td>
                    <td>{a.projectName || '—'}</td>
                    <td className="text-success font-semibold">{a.currency || 'MVR'} {Number(a.dailyRate || 0).toLocaleString()}</td>
                    <td className="font-semibold">{a.currency || 'MVR'} {(Number(a.dailyRate || 0) * 30).toLocaleString()}</td>
                    <td>{a.billingCycle || '—'}</td>
                  </tr>
                ))}
                {activeAgreements.length > 0 && (
                  <tr className="bg-surface-container font-bold">
                    <td colSpan={4} className="text-right text-on-surface-variant">Total Daily</td>
                    <td className="text-success">MVR {dailyRevenue.toLocaleString()}</td>
                    <td className="text-success">MVR {monthlyRevenue.toLocaleString()}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CLIENT MODAL ────────────────────────────────────────────────── */}
      {modal?.type === 'client' && (
        <Modal title={modal.data?.id ? 'Edit Client' : 'Add Client'} onClose={() => setModal(null)}>
          <form onSubmit={saveClient} className="space-y-4">
            <div><label className="label">Company / Organisation Name</label>
              <input required name="company" defaultValue={modal.data?.company} className="input" placeholder="e.g. Maldives Road Corp" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Category</label>
                <select name="category" defaultValue={modal.data?.category || ''} className="input">
                  <option value="">Select…</option>
                  {CLIENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select name="status" defaultValue={modal.data?.status || 'Active'} className="input">
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            <div><label className="label">Contact Name</label>
              <input name="contactName" defaultValue={modal.data?.contactName} className="input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Contact Phone</label>
                <input name="contactPhone" defaultValue={modal.data?.contactPhone} className="input" placeholder="+960" /></div>
              <div><label className="label">Contact Email</label>
                <input name="contactEmail" type="email" defaultValue={modal.data?.contactEmail} className="input" /></div>
            </div>
            <div><label className="label">Notes</label>
              <textarea name="notes" defaultValue={modal.data?.notes} className="input h-20 resize-none" /></div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save Client</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── AGREEMENT MODAL ─────────────────────────────────────────────── */}
      {modal?.type === 'agreement' && (
        <Modal title={modal.data?.id ? 'Edit Rental Agreement' : 'New Rental Agreement'} onClose={() => setModal(null)}>
          <form onSubmit={saveAgreement} className="space-y-4">
            <div><label className="label">Client</label>
              <select required name="clientId" defaultValue={modal.data?.clientId || ''} className="input">
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
              {clients.length === 0 && <p className="text-body-xs text-warning mt-1">No clients yet — add a client first.</p>}
            </div>
            <div><label className="label">Project Name</label>
              <input name="projectName" defaultValue={modal.data?.projectName} className="input" placeholder="e.g. Land Reclamation Ph.1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Start Date</label>
                <input type="date" name="startDate" defaultValue={modal.data?.startDate} className="input" /></div>
              <div><label className="label">End Date (leave blank if open)</label>
                <input type="date" name="endDate" defaultValue={modal.data?.endDate} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Daily Rate</label>
                <input type="number" name="dailyRate" defaultValue={modal.data?.dailyRate} className="input" placeholder="0" /></div>
              <div><label className="label">Currency</label>
                <select name="currency" defaultValue={modal.data?.currency || 'MVR'} className="input">
                  <option>MVR</option><option>USD</option>
                </select>
              </div>
            </div>
            <div><label className="label">Billing Cycle</label>
              <select name="billingCycle" defaultValue={modal.data?.billingCycle || 'Monthly'} className="input">
                {BILLING_CYCLES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select name="status" defaultValue={modal.data?.status || 'Draft'} className="input">
                {AGREEMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Invoice Ref</label>
              <input name="invoiceRef" defaultValue={modal.data?.invoiceRef} className="input" placeholder="INV-XXXX" /></div>
            <div><label className="label">Notes</label>
              <textarea name="notes" defaultValue={modal.data?.notes} className="input h-16 resize-none" /></div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save Agreement</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
