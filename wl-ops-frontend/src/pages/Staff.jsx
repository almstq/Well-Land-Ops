import { useState } from 'react';
import { useAppContext } from '../App';
import { User, Plus, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Staff() {
  const { db, updateDb } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  if (!db) return null;
  const staff = db.staff || [];
  const locationsList = db.locations || [{ Site: 'Thilafushi - Base'}, { Site: 'Muthaafushi' }, { Site: 'Bodufinolhu' }, { Site: 'New Shipment - Awaiting Receipt' }];
  const vesselsList = db.vessels || [];

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());

    let list = [...staff];
    if (editingData && editingData['Staff ID']) {
      list = list.map(item => item['Staff ID'] === editingData['Staff ID'] ? { ...item, ...dataObj } : item);
    } else {
      list.push({ 'Staff ID': `WL-EMP-${String(list.length + 1).padStart(4, '0')}`, ...dataObj });
    }

    await updateDb({ staff: list });
    setModalOpen(false);
    setEditingData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">Staff & Operators</h1>
          <p className="text-textMuted mt-1">Deploy personnel to vessels or locations.</p>
        </div>
        <button onClick={() => { setEditingData({}); setModalOpen(true); }} className="btn btn-primary px-4 h-9">
          <Plus className="w-4 h-4 mr-2" />
          Deploy New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staff.filter(s => s['Full Name']).map((s, i) => (
          <div key={s['Staff ID'] || i} className="card p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-slate-50/50 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-textMain">{s['Full Name']}</h3>
                  <p className="text-xs text-textMuted">{s['Designation']}</p>
                </div>
              </div>
              <button onClick={() => { setEditingData(s); setModalOpen(true); }} className="text-primary hover:text-primary/80 bg-primary/10 px-2 py-1 rounded text-xs font-bold">Deploy</button>
            </div>
            <div className="p-4 space-y-2 text-sm flex-1">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700">{s['Current Location'] || s.Site || 'Unassigned HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">ID</span>
                <span className="font-medium">{s['Staff ID']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Category</span>
                <span className="font-medium">{s['Category']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Nationality</span>
                <span className="font-medium text-right max-w-[120px] truncate" title={s['Nationality']}>{s['Nationality']}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingData?.['Staff ID'] ? 'Deploy' : 'Add'} Staff</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-4 overflow-y-auto grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label font-bold text-primary">Deployment Node (Location / Vessel)</label>
                <select name="Current Location" defaultValue={editingData?.['Current Location'] || editingData?.Site || ''} className="input bg-primary/5 border-primary/30">
                  <option value="">Unassigned</option>
                  <optgroup label="Locations">
                    {locationsList.map(l => {
                      const lName = l.name || l['Location Name'] || l.Site;
                      return <option key={lName}>{lName}</option>
                    })}
                  </optgroup>
                  <optgroup label="Vessels">
                    {vesselsList.map(v => <option key={v['Name/Ref']}>{v['Name/Ref']}</option>)}
                  </optgroup>
                </select>
              </div>

              <div><label className="label">Full Name</label><input required name="Full Name" defaultValue={editingData?.['Full Name'] || ''} className="input" /></div>
              <div><label className="label">Designation</label><input name="Designation" defaultValue={editingData?.['Designation'] || ''} className="input" /></div>
              <div><label className="label">Category</label>
                <select name="Category" defaultValue={editingData?.['Category'] || 'Land/Terminal'} className="input">
                  <option>Land/Terminal</option><option>Marine</option><option>Management</option>
                </select>
              </div>
              <div><label className="label">Nationality</label><input name="Nationality" defaultValue={editingData?.['Nationality'] || ''} className="input" /></div>
              
              <div className="pt-4 flex justify-end gap-2 col-span-2 border-t border-slate-100 mt-2">
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
