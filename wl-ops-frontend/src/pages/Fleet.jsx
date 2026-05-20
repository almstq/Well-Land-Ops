import { useState } from 'react';
import { useAppContext } from '../App';
import { Wrench, ShieldAlert, Plus, Package, FileText, Truck } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Fleet() {
  const { db, updateDb } = useAppContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [historyAsset, setHistoryAsset] = useState(null);

  if (!db) return null;

  const fleet = db.assets || [];
  const issues = db.issueReports || [];
  const procurement = db.procurement || [];
  const transferNotes = db.transferNotes || [];
  const rentals = db.rentalAgreements || db.rentals || [];
  const staff = db.staff || [];
  const categoryList = Array.from(new Set(fleet.map(asset => asset.Category || 'Other Equipment'))).sort();

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());
    const assignedStaff = staff.find(s => s['Staff ID'] === dataObj['Assigned Operator ID']);
    if (assignedStaff) {
      dataObj['Assigned Operator'] = assignedStaff['Full Name'];
    }
    const locationText = `${dataObj.Site || ''} ${dataObj.Status || ''}`;
    const isProjectSite = ['Muthaafushi', 'Bodufinolhu'].some(site => (dataObj.Site || '').includes(site));
    const isShipment = /en\s?route|in transit|shipment|awaiting receipt/i.test(locationText);
    if (isShipment) {
      dataObj.Site = 'New Shipment - Awaiting Receipt';
      dataObj.Status = 'Enroute - Awaiting Receipt';
    } else if (!isProjectSite) {
      dataObj.Site = 'Thilafushi - Base';
    }

    let list = [...fleet];
    if (editingData && editingData['Asset ID']) {
      list = list.map(item => item['Asset ID'] === editingData['Asset ID'] ? { ...item, ...dataObj } : item);
    } else {
      list.push({ 'Asset ID': `WL-HV-${String(list.length + 1).padStart(4, '0')}`, ...dataObj });
    }

    await updateDb({ assets: list });
    setModalOpen(false);
    setEditingData(null);
  };

  const getReadinessBadge = (val) => {
    if (val === 'Green') return 'bg-success text-white';
    if (val === 'Amber') return 'bg-warning text-white';
    if (val === 'Red') return 'bg-danger text-white';
    return 'bg-chipBg text-textMuted';
  };

  const isRentable = (asset) => {
    const isAtBase = (asset.Site || asset['Current Location'] || '').includes('Thilafushi');
    if (!isAtBase) return { status: false, reason: 'Deployed to Project' };
    if (asset.Status !== 'Standby') return { status: false, reason: 'Not on Standby' };
    if (asset['Known Issue'] && !asset['Known Issue'].includes('⚠')) return { status: false, reason: 'Needs Rectification' };
    return { status: true, reason: 'Ready for Rent' };
  };

  const openIssueCount = (assetId) =>
    issues.filter(i => i.assetId === assetId && !['Resolved', 'Closed'].includes(i.status)).length;

  const assetIssues = (assetId) =>
    issues.filter(i => i.assetId === assetId || (i.assetLabel || '').includes(assetId));

  const assetPrs = (assetId) =>
    procurement.filter(pr =>
      pr['Asset ID'] === assetId ||
      assetIssues(assetId).some(issue => issue.id === pr['Issue Ref'] || (issue.linkedPRRefs || []).includes(pr['PR Ref']))
    );

  const assetTransfers = (assetId) =>
    transferNotes.filter(t =>
      t.assetId === assetId ||
      assetPrs(assetId).some(pr => pr['PR Ref'] === t.prRef)
    );

  const assetRentals = (assetId) =>
    rentals.filter(r => r.assetId === assetId || r['Asset ID'] === assetId || r.asset === assetId);

  const filteredFleet = fleet.filter(asset => {
    if (filter === 'All') return true;
    if (filter === 'Red') return asset.Readiness === 'Red';
    if (filter === 'Unknown') return asset.Readiness === 'Unknown' || !asset.Site || asset.Site === 'Unknown';
    if (filter === 'Rentable') return isRentable(asset).status;
    if (filter === 'Issues') return openIssueCount(asset['Asset ID']) > 0;
    if (categoryList.includes(filter)) return (asset.Category || 'Other Equipment') === filter;
    return (asset.Site || asset['Current Location']) === filter;
  });

  const locationsList = db.locations?.length
    ? db.locations.filter(location => (location.Type || '').toLowerCase() !== 'headquarters')
    : [{ name: 'Thilafushi - Base' }, { name: 'Muthaafushi' }, { name: 'Bodufinolhu' }, { name: 'New Shipment - Awaiting Receipt' }];
  const vesselsList = db.vessels || [];

  const getAssetImage = (asset) => {
    const typeLower = (asset.Type || '').toLowerCase();
    const brandLower = (asset.Brand || '').toLowerCase();
    if (typeLower.includes('excavator')) return '/images/komatsu_excavator.png';
    if (typeLower.includes('crane')) return '/images/mobile_crane.png';
    if (typeLower.includes('forklift')) return '/images/forklift.png';
    if (brandLower.includes('isuzu') || brandLower.includes('nissan')) return '/images/isuzu_dump_truck.png';
    return '/images/volvo_a40g.png';
  };

  const issueFiltersCount = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fleet Register</h1>
          <p className="text-sm text-textMuted mt-0.5">Deploy assets, track health, and manage rectifications.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Rentable', ...categoryList, ...locationsList.map(l => l.name || l['Location Name'] || l.Site), 'Red', 'Issues'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                filter === f
                  ? f === 'Issues' ? 'bg-danger text-white border-danger'
                    : f === 'Red' ? 'bg-danger text-white border-danger'
                    : 'bg-primary text-white border-primary'
                  : 'bg-surface text-textMuted border-border hover:bg-surfaceContainer'
              )}
            >
              {f}
              {f === 'Issues' && issueFiltersCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-white px-1 rounded-full text-[10px]">{issueFiltersCount}</span>
              )}
            </button>
          ))}
          <button
            onClick={() => { setEditingData({}); setModalOpen(true); }}
            className="btn btn-primary ml-1 text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Deploy Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredFleet.map(asset => {
          const rentable = isRentable(asset);
          const issueCount = openIssueCount(asset['Asset ID']);

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              key={asset['Asset ID']}
              className="bg-surface rounded-xl overflow-hidden flex flex-col border border-border/60 shadow-soft hover:shadow-card transition-shadow"
            >
              {/* Image header */}
              <div className="h-36 relative bg-surfaceContainer overflow-hidden">
                <img
                  src={getAssetImage(asset)}
                  alt={asset.Type}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <span className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase', getReadinessBadge(asset.Readiness))}>
                    {asset.Readiness || '?'}
                  </span>
                  {issueCount > 0 && (
                    <span className="bg-danger text-white px-2 py-1 rounded-md text-[10px] font-bold">
                      {issueCount} issue{issueCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2.5 left-3 right-3">
                  <div className="font-bold text-white text-base">{asset['Asset ID']}</div>
                  <div className="text-[11px] text-white/80 uppercase tracking-wide">{asset.Brand} {asset.Model}</div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <div className="text-textMuted text-[10px] font-semibold uppercase tracking-wide mb-0.5">Category</div>
                    <div className="font-semibold text-primary truncate">{asset.Category || 'Other Equipment'}</div>
                  </div>
                  <div>
                    <div className="text-textMuted text-[10px] font-semibold uppercase tracking-wide mb-0.5">Location</div>
                    <div className="font-semibold text-textMain truncate">{asset.Site || asset['Current Location'] || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div className="text-textMuted text-[10px] font-semibold uppercase tracking-wide mb-0.5">Status</div>
                    <div className="font-semibold text-textMain">{asset.Status || 'Unknown'}</div>
                  </div>
                  {asset['Assigned Operator'] && (
                    <div className="col-span-2">
                      <div className="text-textMuted text-[10px] font-semibold uppercase tracking-wide mb-0.5">Assigned Staff</div>
                      <div className="font-semibold text-textMain truncate">{asset['Assigned Operator']}</div>
                    </div>
                  )}
                </div>

                {asset['Known Issue'] && asset['Known Issue'] !== '⚠ VERIFY CONDITION' && (
                  <div className="p-2.5 rounded-lg bg-dangerBg text-danger text-xs flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{asset['Known Issue']}</span>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-md',
                    rentable.status ? 'bg-successBg text-success' : 'bg-surfaceContainer text-textMuted'
                  )}>
                    {rentable.status ? '● Rentable' : rentable.reason}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate('/issues', { state: { assetId: asset['Asset ID'] } })}
                      className="text-xs font-semibold text-danger hover:bg-dangerBg px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="Log Issue"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditingData(asset); setModalOpen(true); }}
                      className="text-xs font-semibold text-primary bg-primaryContainer/50 hover:bg-primaryContainer px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setHistoryAsset(asset)}
                      className="text-xs font-semibold text-textMuted bg-surfaceContainer hover:bg-primaryContainer px-3 py-1.5 rounded-lg transition-colors"
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base">{editingData?.['Asset ID'] ? 'Edit Asset' : 'Deploy New Asset'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-textMuted hover:text-textMain">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-5 overflow-y-auto grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Deployment Node (Location / Vessel)</label>
                <select name="Site" defaultValue={editingData?.Site || editingData?.['Current Location'] || 'Thilafushi - Base'} className="input">
                  <optgroup label="Locations">
                    {locationsList.map(l => {
                      const lName = l.name || l['Location Name'] || l.Site;
                      return <option key={lName}>{lName}</option>;
                    })}
                    <option>Unknown</option>
                  </optgroup>
                  <optgroup label="Vessels (Transit)">
                    {vesselsList.map(v => <option key={v['Name/Ref']}>{v['Name/Ref']} (In Transit)</option>)}
                  </optgroup>
                </select>
              </div>
              <div><label className="label">Type</label><input required name="Type" defaultValue={editingData?.Type || ''} className="input" /></div>
              <div>
                <label className="label">Category</label>
                <select name="Category" defaultValue={editingData?.Category || 'Other Equipment'} className="input">
                  <option>Excavator</option>
                  <option>Dump Truck</option>
                  <option>Crane</option>
                  <option>Forklift</option>
                  <option>Loader / Bobcat</option>
                  <option>Pickup</option>
                  <option>Other Equipment</option>
                </select>
              </div>
              <div><label className="label">Brand</label><input name="Brand" defaultValue={editingData?.Brand || ''} className="input" /></div>
              <div><label className="label">Model</label><input name="Model" defaultValue={editingData?.Model || ''} className="input" /></div>
              <div>
                <label className="label">Status</label>
                <select name="Status" defaultValue={editingData?.Status || 'Unknown'} className="input">
                  <option>Active — Site</option><option>Standby</option><option>Unknown</option><option>Grounded</option>
                </select>
              </div>
              <div>
                <label className="label">Readiness</label>
                <select name="Readiness" defaultValue={editingData?.Readiness || 'Unknown'} className="input">
                  <option>Green</option><option>Amber</option><option>Red</option><option>Unknown</option>
                </select>
              </div>
              <div>
                <label className="label">Assigned Operator</label>
                <select name="Assigned Operator ID" defaultValue={editingData?.['Assigned Operator ID'] || ''} className="input">
                  <option value="">Unassigned</option>
                  {staff.filter(s => s['Full Name']).map(s => (
                    <option key={s['Staff ID']} value={s['Staff ID']}>
                      {s['Full Name']} - {s.Designation || s.Category || s['Staff ID']}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hour Meter</label>
                <input name="Hour Meter" defaultValue={editingData?.['Hour Meter'] || ''} className="input" placeholder="e.g. 12,340 hrs" />
              </div>
              <div className="col-span-2">
                <label className="label">Known Issue / Notes</label>
                <input name="Known Issue" defaultValue={editingData?.['Known Issue'] || ''} className="input" />
              </div>
              <div>
                <label className="label">Last Service</label>
                <input type="date" name="Last Service" defaultValue={editingData?.['Last Service'] || ''} className="input" />
              </div>
              <div>
                <label className="label">Next Service</label>
                <input type="date" name="Next Service" defaultValue={editingData?.['Next Service'] || ''} className="input" />
              </div>
              <div className="col-span-2 pt-3 flex justify-end gap-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {historyAsset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl shadow-elevated max-w-5xl w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-textMain">{historyAsset['Asset ID']} - Asset History</h3>
                <p className="text-xs text-textMuted">{historyAsset.Brand} {historyAsset.Model} · {historyAsset.Site || historyAsset['Current Location'] || 'Unassigned'}</p>
              </div>
              <button onClick={() => setHistoryAsset(null)} className="text-textMuted hover:text-textMain">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-4">
                <div className="section-label mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Repair / Issue History</div>
                <div className="space-y-2">
                  {assetIssues(historyAsset['Asset ID']).map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => navigate('/issues', { state: { issueId: issue.id } })}
                      className="w-full text-left p-3 bg-surfaceContainer hover:bg-primaryContainer rounded-lg text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold">{issue.id}</span>
                        <span className={cn('badge', issue.status === 'Closed' || issue.status === 'Resolved' ? 'badge-success' : 'badge-warning')}>{issue.status}</span>
                      </div>
                      <div className="font-semibold text-textMain mt-1">{issue.title}</div>
                      <div className="text-textMuted mt-1">{issue.location}</div>
                    </button>
                  ))}
                  {assetIssues(historyAsset['Asset ID']).length === 0 && <div className="text-sm text-textMuted">No linked issues.</div>}
                </div>
              </div>

              <div className="card p-4">
                <div className="section-label mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Linked Procurement</div>
                <div className="space-y-2">
                  {assetPrs(historyAsset['Asset ID']).map(pr => (
                    <button
                      key={pr['PR Ref']}
                      onClick={() => navigate('/procurement', { state: { prRef: pr['PR Ref'] } })}
                      className="w-full text-left p-3 bg-surfaceContainer hover:bg-primaryContainer rounded-lg text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold">{pr['PR Ref']}</span>
                        <span className="badge badge-info">{pr.Status}</span>
                      </div>
                      <div className="font-semibold text-textMain mt-1">{pr['Item / Service Requested']}</div>
                      <div className="text-textMuted mt-1">{pr['Reason / Issue'] || pr['Purpose / Machine Use']}</div>
                    </button>
                  ))}
                  {assetPrs(historyAsset['Asset ID']).length === 0 && <div className="text-sm text-textMuted">No linked PRs.</div>}
                </div>
              </div>

              <div className="card p-4">
                <div className="section-label mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Inventory Transfers</div>
                <div className="space-y-2">
                  {assetTransfers(historyAsset['Asset ID']).map(t => (
                    <button
                      key={t.id}
                      onClick={() => navigate('/inventory', { state: { transferId: t.id } })}
                      className="w-full text-left p-3 bg-surfaceContainer hover:bg-primaryContainer rounded-lg text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold">{t.id}</span>
                        <span className="badge badge-default">{t.status}</span>
                      </div>
                      <div className="font-semibold text-textMain mt-1">{t.item} · Qty {t.qty}</div>
                      <div className="text-textMuted mt-1">{t.source} → {t.destination}</div>
                    </button>
                  ))}
                  {assetTransfers(historyAsset['Asset ID']).length === 0 && <div className="text-sm text-textMuted">No transfers.</div>}
                </div>
              </div>

              <div className="card p-4">
                <div className="section-label mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Rental History</div>
                <div className="space-y-2">
                  {assetRentals(historyAsset['Asset ID']).map((r, i) => (
                    <button
                      key={r.id || i}
                      onClick={() => navigate('/crm', { state: { agreementId: r.id } })}
                      className="w-full text-left p-3 bg-surfaceContainer hover:bg-primaryContainer rounded-lg text-xs transition-colors"
                    >
                      <div className="font-semibold text-textMain">{r.client || r.Client || r['Client Name'] || 'Rental Agreement'}</div>
                      <div className="text-textMuted mt-1">{r.status || r.Status || 'Recorded'} · {r.startDate || r['Start Date'] || ''}</div>
                    </button>
                  ))}
                  {assetRentals(historyAsset['Asset ID']).length === 0 && <div className="text-sm text-textMuted">No rental history.</div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
