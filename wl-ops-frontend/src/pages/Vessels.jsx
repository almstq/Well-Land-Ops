import { useState } from 'react';
import { useAppContext } from '../App';
import { Navigation, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Vessels() {
  const { db, updateDb } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  if (!db) return null;

  const vessels = db.vessels || [];
  const staff = db.staff || [];

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());
    const captain = staff.find(s => s['Staff ID'] === dataObj['Captain Staff ID']);
    const crewLead = staff.find(s => s['Staff ID'] === dataObj['Crew Lead Staff ID']);
    if (captain) dataObj['Captain in Charge'] = captain['Full Name'];
    if (crewLead) dataObj['Crew Assigned'] = crewLead['Full Name'];

    let list = [...vessels];
    if (editingData && editingData['Vessel ID']) {
      list = list.map(v => v['Vessel ID'] === editingData['Vessel ID'] ? { ...v, ...dataObj } : v);
    } else {
      list.push({ 'Vessel ID': `WL-MV-${String(list.length + 1).padStart(4, '0')}`, ...dataObj });
    }

    await updateDb({ vessels: list });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">Marine Vessels</h1>
          <p className="text-textMuted mt-1">Manage LCTs, Dhonis, and Speedboats.</p>
        </div>
        <button onClick={() => { setEditingData({}); setModalOpen(true); }} className="btn btn-primary px-4 h-9">Add Vessel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vessels.map((v, i) => {
          let bgImage = '/images/lct_vessel.png';
          const typeLower = (v.Type || '').toLowerCase();
          if (typeLower.includes('speed')) bgImage = '/images/speed_boat.png';
          else if (typeLower.includes('dhoni') || typeLower.includes('ferry')) bgImage = '/images/dhoni_ferry.png';
          else if (typeLower.includes('lct')) bgImage = '/images/lct_vessel.png';

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={v['Vessel ID'] || i} className="bg-surface rounded-md3-lg overflow-hidden flex flex-col relative group border border-border/50 shadow-soft hover:shadow-md3 transition-shadow">
              <div className="h-44 relative bg-surfaceContainer overflow-hidden">
                <img src={bgImage} alt={v.Type} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3">
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm", v.Status === 'Active' || v.Status === 'Running' ? 'bg-success text-white' : 'bg-warning text-white')}>
                    {v.Status || 'Unknown'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-white text-xl tracking-tight drop-shadow-md">{v['Name/Ref']}</h3>
                    <p className="text-xs font-medium text-white/90 uppercase tracking-wider">{v.Type}</p>
                  </div>
                  <button onClick={() => { setEditingData(v); setModalOpen(true); }} className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-colors">Manage</button>
                </div>
              </div>
              
              <div className="p-5 flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2 text-sm border-b border-border/30 pb-3">
                  <span className="text-textMuted block text-[10px] uppercase font-bold tracking-wider mb-1"><ShieldCheck className="w-3 h-3 inline mr-1"/> Captain in Charge</span>
                  <span className="font-medium text-textMain">{v['Captain in Charge'] || 'Unassigned'}</span>
                </div>
                <div className="col-span-2 text-sm border-b border-border/30 pb-3">
                  <span className="text-textMuted block text-[10px] uppercase font-bold tracking-wider mb-1"><Navigation className="w-3 h-3 inline mr-1"/> Crew Assigned</span>
                  <span className="font-medium text-textMuted text-xs leading-relaxed">{v['Crew Assigned'] || 'None'}</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-textMuted block text-[10px] uppercase font-bold tracking-wider mb-1">Capacity / Notes</span>
                  <span className="font-medium text-textMain">{v['Capacity/Notes'] || '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-textMuted block text-[10px] uppercase font-bold tracking-wider mb-1">Drydocked?</span>
                  <span className={cn("font-medium", v['Drydocked?'] === 'Yes' ? 'text-danger font-bold' : 'text-textMain')}>{v['Drydocked?'] || 'No'}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingData?.['Vessel ID'] ? 'Edit' : 'Add'} Vessel</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-4 overflow-y-auto grid grid-cols-2 gap-4">
              <div><label className="label">Name / Ref</label><input required name="Name/Ref" defaultValue={editingData?.['Name/Ref'] || ''} className="input" /></div>
              <div><label className="label">Type</label><select name="Type" defaultValue={editingData?.Type || ''} className="input"><option>LCT</option><option>Dhoni/Ferry</option><option>Speed Boat</option><option>Tug Boat</option></select></div>
              <div><label className="label">Status</label><select name="Status" defaultValue={editingData?.Status || 'Active'} className="input"><option>Active</option><option>Running</option><option>Drydocked</option><option>Maintenance</option></select></div>
              <div><label className="label">Drydocked?</label><select name="Drydocked?" defaultValue={editingData?.['Drydocked?'] || 'No'} className="input"><option>No</option><option>Yes</option></select></div>
              <div className="col-span-2">
                <label className="label">Captain in Charge</label>
                <select name="Captain Staff ID" defaultValue={editingData?.['Captain Staff ID'] || ''} className="input">
                  <option value="">Unassigned</option>
                  {staff.filter(s => s['Full Name']).map(s => (
                    <option key={s['Staff ID']} value={s['Staff ID']}>
                      {s['Full Name']} - {s.Designation || s.Category || s['Staff ID']}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Crew Lead Assigned</label>
                <select name="Crew Lead Staff ID" defaultValue={editingData?.['Crew Lead Staff ID'] || ''} className="input">
                  <option value="">Unassigned</option>
                  {staff.filter(s => s['Full Name']).map(s => (
                    <option key={s['Staff ID']} value={s['Staff ID']}>
                      {s['Full Name']} - {s.Designation || s.Category || s['Staff ID']}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Capacity / Notes</label><input name="Capacity/Notes" defaultValue={editingData?.['Capacity/Notes'] || ''} className="input" /></div>
              
              <div className="col-span-2 pt-4 flex justify-end gap-2 border-t border-border mt-2">
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
