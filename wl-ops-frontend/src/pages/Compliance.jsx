import { useState } from 'react';
import { useAppContext } from '../App';
import { Calendar, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Compliance() {
  const { db, updateDb } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  if (!db) return null;
  const compliance = db.compliance || [];

  const handleSave = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let list = [...compliance];
    if (editingData?.id) {
      list = list.map(c => c.id === editingData.id ? { ...c, ...d } : c);
    } else {
      list.push({ id: Date.now().toString(), ...d });
    }
    await updateDb({ compliance: list });
    setModalOpen(false);
    setEditingData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Compliance & Expiries</h1>
          <p className="text-sm text-textMuted mt-0.5">Track permits, registrations, insurance, and regulatory deadlines.</p>
        </div>
        <button onClick={() => { setEditingData({}); setModalOpen(true); }} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Entry
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Asset / Entity</th>
              <th>Frequency</th>
              <th>Due Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {compliance.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-textMuted">No compliance entries. Add one to start tracking.</td>
              </tr>
            )}
            {compliance.map((c, i) => (
              <tr key={c.id || i}>
                <td>
                  <span className="badge badge-default">{c.Category}</span>
                </td>
                <td className="font-medium">{c.Description}</td>
                <td className="font-medium">{c['Asset / Ref'] || c.Entity || '—'}</td>
                <td className="flex items-center gap-1.5 text-textMuted">
                  <Calendar className="w-3.5 h-3.5 shrink-0" /> {c.Frequency || '—'}
                </td>
                <td>
                  {c.DueDate
                    ? <span className={new Date(c.DueDate) < new Date() ? 'badge badge-critical' : 'badge badge-success'}>{c.DueDate}</span>
                    : <span className="text-textMuted text-xs">—</span>
                  }
                </td>
                <td>
                  <button
                    onClick={() => { setEditingData(c); setModalOpen(true); }}
                    className="text-xs text-primary hover:bg-primaryContainer/50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-md w-full"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base">{editingData?.id ? 'Edit' : 'Add'} Compliance Entry</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain p-1 rounded hover:bg-surfaceContainer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="label">Category</label>
                <select name="Category" defaultValue={editingData?.Category || 'Permit'} className="input">
                  <option>Permit</option><option>Registration</option><option>Insurance</option>
                  <option>Inspection</option><option>Tax</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <input required name="Description" defaultValue={editingData?.Description || ''} className="input" />
              </div>
              <div>
                <label className="label">Asset / Entity</label>
                <input name="Asset / Ref" defaultValue={editingData?.['Asset / Ref'] || ''} className="input" placeholder="e.g. WL-HV-0001 or Company" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Frequency</label>
                  <select name="Frequency" defaultValue={editingData?.Frequency || 'Annual'} className="input">
                    <option>Annual</option><option>Semi-annual</option><option>Quarterly</option>
                    <option>Monthly</option><option>One-time</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" name="DueDate" defaultValue={editingData?.DueDate || ''} className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
