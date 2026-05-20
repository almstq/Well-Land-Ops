import { useState } from 'react';
import { useAppContext } from '../App';
import {
  Building2, Plus, X, Star, Edit2, Search, Package,
  Phone, Mail, Clock, CheckCircle, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPLIER_CATEGORIES = [
  'OEM Parts — Kobelco',
  'OEM Parts — Komatsu',
  'OEM Parts — Volvo',
  'OEM Parts — Tadano',
  'OEM Parts — Isuzu / UD Nissan',
  'OEM Parts — Multi-brand',
  'MRO / Maintenance Consumables',
  'Hydraulics & Hoses',
  'Electrical & Batteries',
  'Tyres & Undercarriage',
  'Lubricants & Fluids',
  'Fabrication & Welding',
  'Workshop Tools & Equipment',
  'Site Utilities',
  'General Supply',
  'Services',
];

const EQUIPMENT_BRANDS = ['Kobelco', 'Komatsu', 'Volvo', 'Tadano', 'Isuzu', 'UD Nissan', 'Other / Multi-brand'];
const SUPPLIER_STATUSES = ['Approved', 'Preferred', 'Pending Approval', 'On Hold', 'Blacklisted'];
const PAYMENT_TERMS = ['Cash / Advance', '7 days', '15 days', '30 days', '45 days', '60 days', 'On delivery'];
const LEAD_TIMES = ['Same day', '1–2 days', '3–5 days', '1 week', '2 weeks', '3–4 weeks', '6+ weeks (import)'];

const STATUS_BADGE = {
  'Preferred':         'badge bg-primary text-white',
  'Approved':          'badge badge-success',
  'Pending Approval':  'badge badge-warning',
  'On Hold':           'badge badge-default',
  'Blacklisted':       'badge badge-critical',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-surface rounded-xl shadow-elevated w-full my-auto flex flex-col max-h-[92vh]',
          wide ? 'max-w-3xl' : 'max-w-xl'
        )}
      >
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-base text-textMain">{title}</h3>
            {subtitle && <p className="text-xs text-textMuted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceContainer ml-4 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

function RatingStars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          className={cn('transition-colors', n <= value ? 'text-warning' : 'text-border hover:text-warning/50')}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SRM() {
  const { db, updateDb } = useAppContext();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modal, setModal] = useState(null);
  const [catalogModal, setCatalogModal] = useState(null);
  const [rating, setRating] = useState(3);

  if (!db) return null;

  const suppliers = db.suppliers || [];
  const catalog = db.supplierCatalog || [];
  const items = db.items || [];
  const procurement = db.procurement || [];

  // ── ID generators ────────────────────────────────────────────────────────
  const nextSupplierId = () => {
    const nums = suppliers.map(s => parseInt((s.id || '').replace('SUP-', '')) || 0);
    return `SUP-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
  };
  const nextCatalogId = () => {
    const nums = catalog.map(c => parseInt((c.id || '').replace('SC-', '')) || 0);
    return `SC-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
  };

  // ── Supplier stats ───────────────────────────────────────────────────────
  const supplierStats = (suppId) => {
    const prs = procurement.filter(p =>
      (p['Selected Vendor'] === suppId ||
       suppliers.find(s => s.id === suppId)?.name === p['Selected Vendor'])
    );
    const catalogItems = catalog.filter(c => c.supplierId === suppId);
    return { poCount: prs.length, catalogCount: catalogItems.length };
  };

  // ── Save supplier ────────────────────────────────────────────────────────
  const saveSupplier = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.rating = rating;
    d.supportedBrands = Array.from(
      e.target.querySelectorAll('input[name="supportedBrands"]:checked')
    ).map(cb => cb.value);

    let list = [...suppliers];
    if (modal?.data?.id) {
      list = list.map(s => s.id === modal.data.id ? { ...s, ...d } : s);
    } else {
      list.push({ id: nextSupplierId(), createdAt: new Date().toISOString(), ...d });
    }
    await updateDb({ suppliers: list });
    if (selectedSupplier?.id === modal?.data?.id) {
      setSelectedSupplier(list.find(s => s.id === modal.data.id));
    }
    setModal(null);
  };

  // ── Save catalog entry ───────────────────────────────────────────────────
  const saveCatalogItem = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.unitPrice = Number(d.unitPrice) || 0;
    d.isOEM = d.isOEM === 'on';
    d.inStock = d.inStock === 'on';

    let list = [...catalog];
    if (catalogModal?.data?.id) {
      list = list.map(c => c.id === catalogModal.data.id ? { ...c, ...d } : c);
    } else {
      list.push({
        id: nextCatalogId(),
        supplierId: catalogModal.supplierId,
        addedAt: new Date().toISOString(),
        ...d,
      });
    }
    await updateDb({ supplierCatalog: list });
    setCatalogModal(null);
  };

  const removeCatalogItem = async (id) => {
    if (!confirm('Remove this item from catalog?')) return;
    await updateDb({ supplierCatalog: catalog.filter(c => c.id !== id) });
  };

  // ── Filtered suppliers ───────────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(s => {
    const cats = filterCat === 'All' ? null : filterCat;
    const searchTerm = search.toLowerCase();
    const matchSearch = !search ||
      (s.name || '').toLowerCase().includes(searchTerm) ||
      (s.contactName || '').toLowerCase().includes(searchTerm) ||
      (s.category || '').toLowerCase().includes(searchTerm);
    const matchCat = !cats || s.category === cats || s.status === cats;
    return matchSearch && matchCat;
  });

  const supplierCatalog = selectedSupplier
    ? catalog.filter(c => c.supplierId === selectedSupplier.id)
    : [];

  // ── Category counts for filter bar ──────────────────────────────────────
  const isOEMSupplier = (s) => (s.category || '').toLowerCase().includes('oem');
  const oemCount = suppliers.filter(isOEMSupplier).length;
  const mroCount = suppliers.filter(s => (s.category || '').toLowerCase().includes('mro')).length;
  const preferredCount = suppliers.filter(s => s.status === 'Preferred').length;

  const tabs = [
    { id: 'suppliers', label: 'Suppliers', icon: Building2, count: suppliers.length },
    { id: 'catalog', label: 'Parts Catalog', icon: Package, count: catalog.length },
  ];

  const openAddSupplier = () => { setRating(3); setModal({ type: 'supplier', data: {} }); };
  const openEditSupplier = (s) => { setRating(s.rating || 3); setModal({ type: 'supplier', data: s }); };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="page-title">Supplier Relationship Management</h1>
          </div>
          <p className="text-sm text-textMuted">OEM parts suppliers, MRO vendors, and the parts they carry.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddSupplier} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: suppliers.length, icon: Building2, color: 'text-primary bg-primaryContainer' },
          { label: 'OEM Suppliers', value: oemCount, icon: Star, color: 'text-oem bg-oemBg' },
          { label: 'MRO Vendors', value: mroCount, icon: Layers, color: 'text-info bg-infoBg' },
          { label: 'Catalog Items', value: catalog.length, icon: Package, color: 'text-success bg-successBg' },
        ].map(k => (
          <div key={k.label} className="card flex items-center gap-4 p-4">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', k.color)}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-textMuted font-medium">{k.label}</div>
              <div className="text-xl font-bold text-textMain">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className="text-xs bg-chipBg text-textMuted px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── SUPPLIERS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'suppliers' && (
        <div className="flex gap-5" style={{ minHeight: '520px' }}>

          {/* Left: list */}
          <div className="w-80 shrink-0 flex flex-col gap-3">
            {/* Search + filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search suppliers…"
                className="input pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['All', 'OEM', 'MRO', 'Preferred'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterCat(f === 'OEM' ? 'OEM' : f === 'MRO' ? 'MRO' : f === 'Preferred' ? 'Preferred' : 'All')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                    filterCat === f || (f === 'OEM' && filterCat === 'OEM') || (f === 'MRO' && filterCat === 'MRO')
                      ? 'bg-primary text-white'
                      : 'bg-surfaceContainer text-textMuted hover:text-textMain'
                  )}
                >
                  {f}
                  {f === 'All' && ` (${suppliers.length})`}
                  {f === 'OEM' && ` (${oemCount})`}
                  {f === 'MRO' && ` (${mroCount})`}
                  {f === 'Preferred' && ` (${preferredCount})`}
                </button>
              ))}
            </div>

            {/* Supplier cards */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredSuppliers.length === 0 && (
                <div className="card text-center py-10 text-textMuted">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No suppliers yet.</p>
                  <button onClick={openAddSupplier} className="btn btn-primary text-xs mt-3">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Supplier
                  </button>
                </div>
              )}
              {filteredSuppliers.map(s => {
                const isSelected = selectedSupplier?.id === s.id;
                const stats = supplierStats(s.id);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedSupplier(isSelected ? null : s)}
                    className={cn(
                      'card p-4 cursor-pointer transition-all hover:shadow-card',
                      isSelected ? 'border-primary ring-1 ring-primary/30 shadow-card' : 'hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                          isOEMSupplier(s) ? 'bg-oemBg text-oem' : 'bg-primaryContainer text-primary'
                        )}>
                          {(s.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-textMain truncate">{s.name || 'Unnamed'}</div>
                          <div className="text-[10px] text-textMuted truncate">{s.category}</div>
                        </div>
                      </div>
                      <span className={cn(STATUS_BADGE[s.status] || 'badge badge-default', 'text-[10px] shrink-0')}>
                        {s.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-textMuted">
                      <div className="flex gap-2">
                        {stats.catalogCount > 0 && (
                          <span className="font-medium">{stats.catalogCount} items</span>
                        )}
                        {stats.poCount > 0 && (
                          <span className="font-medium">{stats.poCount} PO{stats.poCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      {s.rating > 0 && (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={cn('w-3 h-3', n <= s.rating ? 'text-warning fill-warning' : 'text-border')} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className="flex-1 min-w-0">
            {!selectedSupplier ? (
              <div className="card h-full flex flex-col items-center justify-center text-textMuted gap-3">
                <Building2 className="w-12 h-12 opacity-20" />
                <p className="font-semibold">Select a supplier to view profile</p>
                <p className="text-sm">or add a new supplier</p>
              </div>
            ) : (
              <div className="card space-y-6">
                {/* Supplier header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold',
                        isOEMSupplier(selectedSupplier) ? 'bg-oemBg text-oem' : 'bg-primaryContainer text-primary'
                      )}>
                        {(selectedSupplier.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-bold text-xl text-textMain">{selectedSupplier.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={STATUS_BADGE[selectedSupplier.status] || 'badge badge-default'}>
                            {selectedSupplier.status}
                          </span>
                          {isOEMSupplier(selectedSupplier) && (
                            <span className="badge badge-oem"><Star className="w-3 h-3 mr-0.5 fill-current" />OEM Supplier</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedSupplier.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <RatingStars value={selectedSupplier.rating} />
                        <span className="text-xs text-textMuted">{selectedSupplier.rating}/5</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setCatalogModal({ supplierId: selectedSupplier.id, supplierName: selectedSupplier.name, data: {} }); }}
                      className="btn btn-outline text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add to Catalog
                    </button>
                    <button onClick={() => openEditSupplier(selectedSupplier)} className="btn btn-outline text-xs">
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <div className="section-label mb-1">Category</div>
                      <div className="font-medium">{selectedSupplier.category || '—'}</div>
                    </div>
                    <div>
                      <div className="section-label mb-1">Contact</div>
                      <div className="font-medium">{selectedSupplier.contactName || '—'}</div>
                      {selectedSupplier.contactPhone && (
                        <div className="flex items-center gap-1.5 text-textMuted text-xs mt-0.5">
                          <Phone className="w-3.5 h-3.5" /> {selectedSupplier.contactPhone}
                        </div>
                      )}
                      {selectedSupplier.contactEmail && (
                        <div className="flex items-center gap-1.5 text-textMuted text-xs mt-0.5">
                          <Mail className="w-3.5 h-3.5" /> {selectedSupplier.contactEmail}
                        </div>
                      )}
                    </div>
                    {selectedSupplier.supportedBrands?.length > 0 && (
                      <div>
                        <div className="section-label mb-1">Supported Brands / Equipment</div>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(selectedSupplier.supportedBrands)
                            ? selectedSupplier.supportedBrands
                            : [selectedSupplier.supportedBrands]
                          ).filter(Boolean).map(b => (
                            <span key={b} className="badge badge-default text-[10px]">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="section-label mb-1">Payment Terms</div>
                      <div className="font-medium">{selectedSupplier.paymentTerms || '—'}</div>
                    </div>
                    <div>
                      <div className="section-label mb-1">Avg Lead Time</div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-textMuted" />
                        {selectedSupplier.leadTimeAvg || '—'}
                      </div>
                    </div>
                    {selectedSupplier.notes && (
                      <div>
                        <div className="section-label mb-1">Notes</div>
                        <div className="text-textMuted text-xs leading-relaxed">{selectedSupplier.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parts Catalog for this supplier */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="section-label">
                      Parts Catalog ({supplierCatalog.length})
                    </h3>
                    <button
                      onClick={() => setCatalogModal({ supplierId: selectedSupplier.id, supplierName: selectedSupplier.name, data: {} })}
                      className="text-xs text-primary hover:bg-primaryContainer/50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                  </div>

                  {supplierCatalog.length === 0 ? (
                    <div className="p-6 border border-dashed border-border rounded-xl text-center text-textMuted">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No catalog items yet.</p>
                      <p className="text-xs mt-1">Add the parts and items this supplier can provide.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Item / Part</th>
                            <th>Part #</th>
                            <th>Brand</th>
                            <th>Unit Price</th>
                            <th>Lead Time</th>
                            <th>Type</th>
                            <th>Stock</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierCatalog.map(c => (
                            <tr key={c.id}>
                              <td className="font-semibold">{c.itemName}</td>
                              <td className="font-mono text-xs text-textMuted">{c.partNumber || '—'}</td>
                              <td className="text-textMuted">{c.brand || '—'}</td>
                              <td className="font-semibold">
                                {c.unitPrice > 0 ? `${c.currency || 'MVR'} ${Number(c.unitPrice).toLocaleString()}` : '—'}
                              </td>
                              <td className="text-textMuted">{c.leadTime || '—'}</td>
                              <td>
                                {c.isOEM
                                  ? <span className="badge badge-oem"><Star className="w-3 h-3 mr-0.5 fill-current" />OEM</span>
                                  : <span className="badge badge-default">Generic</span>
                                }
                              </td>
                              <td>
                                {c.inStock
                                  ? <span className="badge badge-success">In Stock</span>
                                  : <span className="badge badge-default">On Order</span>
                                }
                              </td>
                              <td>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setCatalogModal({ supplierId: selectedSupplier.id, supplierName: selectedSupplier.name, data: c })}
                                    className="text-textMuted hover:text-primary p-1.5 rounded hover:bg-primaryContainer/50"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removeCatalogItem(c.id)}
                                    className="text-textMuted hover:text-danger p-1.5 rounded hover:bg-dangerBg"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATALOG TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search parts catalog…"
              className="input pl-9"
            />
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / Part Name</th>
                  <th>Part #</th>
                  <th>Supplier</th>
                  <th>Brand</th>
                  <th>Unit Price</th>
                  <th>Lead Time</th>
                  <th>Type</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {catalog.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-textMuted">
                      No catalog items. Open a supplier and add parts they supply.
                    </td>
                  </tr>
                )}
                {catalog
                  .filter(c => !search ||
                    c.itemName?.toLowerCase().includes(search.toLowerCase()) ||
                    c.partNumber?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(c => {
                    const sup = suppliers.find(s => s.id === c.supplierId);
                    return (
                      <tr key={c.id}>
                        <td className="font-semibold">{c.itemName}</td>
                        <td className="font-mono text-xs text-textMuted">{c.partNumber || '—'}</td>
                        <td>
                          <button
                            onClick={() => { setSelectedSupplier(sup); setActiveTab('suppliers'); }}
                            className="text-primary hover:underline font-medium text-xs"
                          >
                            {sup?.name || '—'}
                          </button>
                        </td>
                        <td className="text-textMuted">{c.brand || '—'}</td>
                        <td className="font-semibold text-success">
                          {c.unitPrice > 0 ? `${c.currency || 'MVR'} ${Number(c.unitPrice).toLocaleString()}` : '—'}
                        </td>
                        <td className="text-textMuted">{c.leadTime || '—'}</td>
                        <td>
                          {c.isOEM
                            ? <span className="badge badge-oem"><Star className="w-3 h-3 mr-0.5 fill-current" />OEM</span>
                            : <span className="badge badge-default">Generic</span>
                          }
                        </td>
                        <td>
                          {c.inStock
                            ? <span className="badge badge-success">In Stock</span>
                            : <span className="badge badge-default">On Order</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT SUPPLIER MODAL ────────────────────────────────────────── */}
      {modal?.type === 'supplier' && (
        <Modal
          title={modal.data?.id ? 'Edit Supplier' : 'Add Supplier'}
          subtitle={modal.data?.id ? modal.data.name : 'Register a new supplier in your SRM'}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={saveSupplier} className="p-5 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Supplier / Company Name <span className="text-danger">*</span></label>
                <input required name="name" defaultValue={modal.data?.name || ''} className="input" placeholder="e.g. Kobelco Parts Maldives" />
              </div>
              <div>
                <label className="label">Category <span className="text-danger">*</span></label>
                <select required name="category" defaultValue={modal.data?.category || ''} className="input">
                  <option value="">Select category…</option>
                  {SUPPLIER_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={modal.data?.status || 'Pending Approval'} className="input">
                  {SUPPLIER_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Supported Equipment Brands</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {EQUIPMENT_BRANDS.map(b => {
                  const checked = Array.isArray(modal.data?.supportedBrands)
                    ? modal.data.supportedBrands.includes(b)
                    : modal.data?.supportedBrands === b;
                  return (
                    <label key={b} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border border-border hover:bg-surfaceContainer transition-colors text-xs font-medium">
                      <input type="checkbox" name="supportedBrands" value={b} defaultChecked={checked} className="accent-primary" />
                      {b}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Contact Name</label>
                <input name="contactName" defaultValue={modal.data?.contactName || ''} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="contactPhone" defaultValue={modal.data?.contactPhone || ''} className="input" placeholder="+960" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="contactEmail" type="email" defaultValue={modal.data?.contactEmail || ''} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Payment Terms</label>
                <select name="paymentTerms" defaultValue={modal.data?.paymentTerms || ''} className="input">
                  <option value="">Select…</option>
                  {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Avg Lead Time</label>
                <select name="leadTimeAvg" defaultValue={modal.data?.leadTimeAvg || ''} className="input">
                  <option value="">Select…</option>
                  {LEAD_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select name="currency" defaultValue={modal.data?.currency || 'MVR'} className="input">
                  <option>MVR</option><option>USD</option><option>SGD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label mb-2">Supplier Rating</label>
              <div className="flex items-center gap-3">
                <RatingStars value={rating} onChange={setRating} />
                <span className="text-sm text-textMuted">{rating}/5</span>
              </div>
            </div>

            <div>
              <label className="label">Notes / Remarks</label>
              <textarea name="notes" defaultValue={modal.data?.notes || ''} className="input h-20 resize-none"
                placeholder="Reliability notes, sourcing tips, account number, special terms…" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={() => setModal(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Supplier</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── ADD/EDIT CATALOG ITEM MODAL ────────────────────────────────────── */}
      {catalogModal && (
        <Modal
          title={catalogModal.data?.id ? 'Edit Catalog Item' : 'Add Item to Catalog'}
          subtitle={`Supplier: ${catalogModal.supplierName}`}
          onClose={() => setCatalogModal(null)}
        >
          <form onSubmit={saveCatalogItem} className="p-5 space-y-4">
            <div>
              <label className="label">Item / Part Name <span className="text-danger">*</span></label>
              <input required name="itemName" defaultValue={catalogModal.data?.itemName || ''} className="input"
                placeholder="e.g. Battery 12V/100Ah or Hydraulic Control Valve" list="items-list" />
              <datalist id="items-list">
                {items.map(i => <option key={i.id || i['Item Code']} value={i.name || i['Item Name']} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Part Number / OEM Code
                </label>
                <input name="partNumber" defaultValue={catalogModal.data?.partNumber || ''} className="input" placeholder="Manufacturer part #" />
              </div>
              <div>
                <label className="label">Brand / Make</label>
                <select name="brand" defaultValue={catalogModal.data?.brand || ''} className="input">
                  <option value="">Select or type…</option>
                  {EQUIPMENT_BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Unit Price</label>
                <input type="number" min="0" step="0.01" name="unitPrice" defaultValue={catalogModal.data?.unitPrice || ''} className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Currency</label>
                <select name="currency" defaultValue={catalogModal.data?.currency || 'MVR'} className="input">
                  <option>MVR</option><option>USD</option><option>SGD</option>
                </select>
              </div>
              <div>
                <label className="label">Lead Time</label>
                <select name="leadTime" defaultValue={catalogModal.data?.leadTime || ''} className="input">
                  <option value="">Select…</option>
                  {LEAD_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Min Order Qty</label>
                <input type="number" min="1" name="minOrderQty" defaultValue={catalogModal.data?.minOrderQty || 1} className="input" />
              </div>
              <div>
                <label className="label">Compatible Machines / Notes</label>
                <input name="compatibility" defaultValue={catalogModal.data?.compatibility || ''} className="input" placeholder="e.g. Kobelco SK380, SK200" />
              </div>
            </div>

            {/* OEM + Stock toggles */}
            <div className="flex gap-6">
              <label className={cn(
                'flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold flex-1 justify-center',
                catalogModal.data?.isOEM
                  ? 'border-oem bg-oemBg text-oem'
                  : 'border-border text-textMuted hover:border-oem/40'
              )}>
                <input
                  type="checkbox"
                  name="isOEM"
                  defaultChecked={catalogModal.data?.isOEM || false}
                  className="hidden"
                  onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, isOEM: e.target.checked } }))}
                />
                <Star className="w-4 h-4 fill-current" />
                OEM Part
              </label>

              <label className={cn(
                'flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold flex-1 justify-center',
                catalogModal.data?.inStock
                  ? 'border-success bg-successBg text-success'
                  : 'border-border text-textMuted hover:border-success/40'
              )}>
                <input
                  type="checkbox"
                  name="inStock"
                  defaultChecked={catalogModal.data?.inStock || false}
                  className="hidden"
                  onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, inStock: e.target.checked } }))}
                />
                <CheckCircle className="w-4 h-4" />
                In Stock
              </label>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea name="notes" defaultValue={catalogModal.data?.notes || ''} className="input h-16 resize-none"
                placeholder="Any sourcing notes, spec caveats, substitution warnings…" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={() => setCatalogModal(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Item</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
