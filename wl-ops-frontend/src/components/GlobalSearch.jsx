import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Truck, Anchor, Users, Package, FileText, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../App';

const CATEGORIES = [
  { key: 'assets',           label: 'Fleet',       icon: Truck,         route: '/fleet',       nameKey: ['AssetName', 'Name', 'Vehicle'] },
  { key: 'vessels',          label: 'Vessels',     icon: Anchor,        route: '/vessels',     nameKey: ['VesselName', 'Name'] },
  { key: 'staff',            label: 'Staff',       icon: Users,         route: '/staff',       nameKey: ['Full Name', 'Name'] },
  { key: 'procurement',      label: 'Procurement', icon: FileText,      route: '/procurement', nameKey: ['Title', 'PRTitle', 'Description'] },
  { key: 'inventory',        label: 'Inventory',   icon: Package,       route: '/inventory',   nameKey: ['ItemName', 'Name', 'Item'] },
  { key: 'issueReports',     label: 'Issues',      icon: AlertTriangle, route: '/issues',      nameKey: ['Title', 'Issue', 'Description'] },
];

function findName(item, keys) {
  for (const k of keys) {
    if (item[k]) return String(item[k]);
  }
  return Object.values(item).find(v => typeof v === 'string' && v.length > 2) || '—';
}

export default function GlobalSearch({ onClose }) {
  const { db } = useAppContext();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q.trim() || !db) { setResults([]); return; }
    const query = q.toLowerCase();
    const found = [];

    for (const cat of CATEGORIES) {
      const items = db[cat.key] || [];
      for (const item of items) {
        const text = JSON.stringify(item).toLowerCase();
        if (text.includes(query)) {
          found.push({
            category: cat.label,
            icon: cat.icon,
            route: cat.route,
            name: findName(item, cat.nameKey),
            sub: item.Status || item.Designation || item.Category || '',
          });
          if (found.length >= 20) break;
        }
      }
      if (found.length >= 20) break;
    }
    setResults(found);
  }, [q, db]);

  const go = (route) => {
    navigate(route);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl shadow-elevation-4 w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
          <Search className="w-5 h-5 text-on-surface-variant shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search fleet, staff, procurement, inventory…"
            className="flex-1 bg-transparent text-body-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="md3-icon-btn w-7 h-7">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!q.trim() && (
            <p className="text-body-sm text-on-surface-variant text-center py-8">Start typing to search across all data…</p>
          )}
          {q.trim() && results.length === 0 && (
            <p className="text-body-sm text-on-surface-variant text-center py-8">No results for "{q}"</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => go(r.route)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                <r.icon className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-md font-medium text-on-surface truncate">{r.name}</div>
                <div className="text-body-xs text-on-surface-variant">{r.category}{r.sub ? ` · ${r.sub}` : ''}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-outline-variant flex items-center gap-4 text-body-xs text-on-surface-variant">
          <span><kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> to close</span>
          <span><kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">↵</kbd> to navigate</span>
        </div>
      </div>
    </div>
  );
}
