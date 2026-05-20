import { useState } from 'react';
import { useAppContext } from '../App';
import { Package, MapPin, Building2, Plus, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function MasterData() {
  const { db, updateDb } = useAppContext();
  const [activeTab, setActiveTab] = useState('Items');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  if (!db) return null;

  const items = db.items || [];
  const suppliers = db.suppliers || [];
  const locations = db.locations || [];

  const operators = db.operators || [];
  const assignments = db.assignments || [];
  const recovery = db.recovery || [];

  const tabs = [
    { id: 'Items', icon: Package, data: items },
    { id: 'Suppliers', icon: Building2, data: suppliers },
    { id: 'Locations', icon: MapPin, data: locations },
    { id: 'Operators', icon: Package, data: operators },
    { id: 'Assignments', icon: MapPin, data: assignments },
    { id: 'Recovery', icon: Building2, data: recovery },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());

    let list = db[activeTab.toLowerCase()] || [];
    
    if (editingData && editingData.id) {
      list = list.map(item => item.id === editingData.id ? { ...item, ...dataObj } : item);
    } else {
      list = [...list, { id: Date.now().toString(), ...dataObj }];
    }

    await updateDb({ [activeTab.toLowerCase()]: list });
    setModalOpen(false);
    setEditingData(null);
  };

  const currentList = db[activeTab.toLowerCase()] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">Master Data</h1>
          <p className="text-textMuted mt-1">Manage global items, suppliers, and locations.</p>
        </div>
        <button onClick={() => { setEditingData({}); setModalOpen(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab}
        </button>
      </div>

      <div className="flex gap-4 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors",
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-textMuted hover:text-textMain hover:bg-surfaceContainer"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.id} <span className="bg-surfaceContainer text-textMuted py-0.5 px-2 rounded-full text-xs ml-1 font-bold">{t.data.length}</span>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden border-border/50 shadow-soft">
        <table className="w-full text-sm text-left">
          <thead className="bg-surfaceContainer border-b border-border/50 text-xs uppercase text-textMuted tracking-wider font-bold">
            <tr>
              {activeTab === 'Items' && <><th className="px-6 py-4">Name</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Default Supplier</th></>}
              {activeTab === 'Suppliers' && <><th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Credit Terms</th></>}
              {activeTab === 'Locations' && <><th className="px-6 py-4">Name</th><th className="px-6 py-4">Type</th></>}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((item, i) => (
              <tr key={item.id || item['Location ID'] || i} className="border-b border-border/50 last:border-0 hover:bg-surfaceContainer transition-colors">
                {activeTab === 'Items' && (
                  <>
                    <td className="px-6 py-4 font-bold text-textMain">{item.name || item.Item || item['Item Name'] || 'Unnamed'}</td>
                    <td className="px-6 py-4 text-textMuted font-medium">{item.category || item.Category || '-'}</td>
                    <td className="px-6 py-4 text-textMuted font-medium">{item.supplier || '-'}</td>
                  </>
                )}
                {activeTab === 'Suppliers' && (
                  <>
                    <td className="px-6 py-4 font-bold text-textMain">{item.name || item.Supplier || item['Supplier Name'] || 'Unnamed'}</td>
                    <td className="px-6 py-4 text-textMuted font-medium">{item.contact || item.Contact || '-'}</td>
                    <td className="px-6 py-4 text-textMuted font-medium">{item.terms || item['Credit Terms'] || '-'}</td>
                  </>
                )}
                {activeTab === 'Locations' && (
                  <>
                    <td className="px-6 py-4 font-bold text-textMain">{item.name || item['Location Name'] || item.Site || 'Unnamed'}</td>
                    <td className="px-6 py-4 text-textMuted font-medium">{item.type || item.Type || '-'}</td>
                  </>
                )}
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditingData(item); setModalOpen(true); }} className="text-primary hover:bg-primaryContainer p-2 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {currentList.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-textMuted font-medium">No {activeTab.toLowerCase()} found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingData?.id ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              {activeTab === 'Items' && (
                <>
                  <div><label className="label">Item Name</label><input required name="name" defaultValue={editingData?.name || editingData?.Item || ''} className="input" /></div>
                  <div><label className="label">Category</label><input name="category" defaultValue={editingData?.category || editingData?.Category || ''} className="input" /></div>
                  <div>
                    <label className="label">Linked Supplier</label>
                    <select name="supplier" defaultValue={editingData?.supplier || ''} className="input">
                      <option value="">Select Supplier...</option>
                      {db.suppliers?.map(s => (
                        <option key={s.id || s.name || s.Supplier} value={s.name || s.Supplier}>
                          {s.name || s.Supplier}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'Suppliers' && (
                <>
                  <div><label className="label">Supplier Name</label><input required name="name" defaultValue={editingData?.name || ''} className="input" /></div>
                  <div><label className="label">Contact Detail</label><input name="contact" defaultValue={editingData?.contact || ''} className="input" /></div>
                  <div><label className="label">Credit Terms</label><input name="terms" defaultValue={editingData?.terms || ''} className="input" /></div>
                </>
              )}
              {activeTab === 'Locations' && (
                <>
                  <div><label className="label">Location Name</label><input required name="name" defaultValue={editingData?.name || editingData?.Site || ''} className="input" /></div>
                  <div><label className="label">Type</label><select name="type" defaultValue={editingData?.type || ''} className="input"><option>Base</option><option>Project Site</option><option>Other</option></select></div>
                </>
              )}
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
