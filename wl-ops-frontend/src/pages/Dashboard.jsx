import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Anchor, AlertTriangle, ArrowUpRight, CheckCircle2, CircleDot,
  Clock, DollarSign, MapPinned, PackageCheck, RadioTower,
  Shield, Ship, ShoppingCart, Truck, Users, Wrench
} from 'lucide-react';
import { useAppContext } from '../App';
import { cn } from '../lib/utils';
import AiDailyBrief from '../components/AiDailyBrief';

const FALLBACK_LOCATIONS = [
  { 'Location Name': 'Thilafushi - Base', Type: 'Base', Status: 'Active' },
  { 'Location Name': 'Muthaafushi', Type: 'Project Site', Status: 'Active' },
  { 'Location Name': 'Bodufinolhu', Type: 'Project Site', Status: 'Active' },
];

const ISLAND_LAYOUT = [
  { x: 11, y: 19, size: 'lg' },
  { x: 38, y: 11, size: 'md' },
  { x: 68, y: 17, size: 'lg' },
  { x: 19, y: 61, size: 'md' },
  { x: 48, y: 51, size: 'lg' },
  { x: 76, y: 61, size: 'md' },
  { x: 56, y: 78, size: 'sm' },
  { x: 84, y: 34, size: 'sm' },
];

function getLocationName(location) {
  return location?.name || location?.['Location Name'] || location?.Site || location?.Location || 'Unknown';
}

function getAssetLocation(asset) {
  return asset?.Site || asset?.['Current Location'] || 'Unknown';
}

function isOpenIssue(issue) {
  return !['Resolved', 'Closed'].includes(issue?.status);
}

function isCriticalIssue(issue) {
  return isOpenIssue(issue) && issue?.priority === 'CRITICAL';
}

function isRealKnownIssue(asset) {
  const issue = (asset?.['Known Issue'] || '').trim();
  return issue && !issue.includes('VERIFY CONDITION') && !issue.includes('WARN VERIFY');
}

function healthClass(readiness, issues) {
  if (issues.some(isCriticalIssue) || readiness === 'Red') return 'danger';
  if (readiness === 'Amber' || issues.length > 0) return 'warning';
  if (readiness === 'Green') return 'success';
  return 'neutral';
}

function formatMoney(value) {
  return `MVR ${Math.round(value || 0).toLocaleString()}`;
}

export default function Dashboard() {
  const { db } = useAppContext();
  const [selectedLocation, setSelectedLocation] = useState(null);
  if (!db) return null;

  const fleet = db.assets || [];
  const staff = db.staff || [];
  const procurement = db.procurement || [];
  const locations = (db.locations?.length ? db.locations : FALLBACK_LOCATIONS)
    .filter(loc => (loc.Type || '').toLowerCase() !== 'headquarters')
    .map((loc, index) => ({
      ...loc,
      name: getLocationName(loc),
      layout: ISLAND_LAYOUT[index % ISLAND_LAYOUT.length],
    }));
  const clients = db.clients || [];
  const agreements = db.rentalAgreements || [];
  const issueSource = db.issueReports?.length ? db.issueReports : (db.recovery || [])
      .filter(item => !['Resolved', 'Closed', 'Completed'].includes(item.Status))
      .map(item => ({
        id: item['Recovery ID'],
        title: item.Issue || item['Current Action'] || 'Recovery item',
        priority: item.Priority || 'MEDIUM',
        status: item.Status || 'Open',
        location: item.Site || 'Unknown',
        assetId: item['Asset ID'] || item['Asset / Vessel ID'],
        assetLabel: item.Machine || item['Asset ID'] || item['Asset / Vessel ID'],
      }));
  const issues = issueSource;
  const vessels = db.vessels || [];

  const openIssues = issues.filter(isOpenIssue);
  const criticalIssues = openIssues.filter(i => i.priority === 'CRITICAL');
  const criticalPRs = procurement.filter(p => p.Urgency === 'CRITICAL' && !['Delivered to Site', 'Delivered to HQ Inventory'].includes(p.Status));
  const activeAgreements = agreements.filter(a => a.status === 'Active');
  const dailyRevenue = activeAgreements.reduce((sum, item) => sum + (Number(item.dailyRate) || 0), 0);
  const monthlyRevenue = dailyRevenue * 30;
  const activeFleet = fleet.filter(a => (a.Status || '').includes('Active')).length;
  const standbyFleet = fleet.filter(a => a.Status === 'Standby').length;
  const problemFleet = fleet.filter(a => a.Readiness === 'Red' || isRealKnownIssue(a)).length;
  const completedPRs = procurement.filter(p => p['Turnaround Hours']);
  const avgTurnaround = completedPRs.length
    ? (completedPRs.reduce((sum, p) => sum + (parseFloat(p['Turnaround Hours']) || 0), 0) / completedPRs.length).toFixed(1)
    : null;

  const locationNodes = locations.map((location) => {
    const name = location.name;
    const assets = fleet.filter(asset => getAssetLocation(asset).includes(name) || name.includes(getAssetLocation(asset)));
    const crew = staff.filter(person => (person.Site || person['Current Location'] || '').includes(name));
    const nodeIssues = openIssues.filter(issue => (issue.location || '').includes(name));
    const prs = procurement.filter(pr => (pr['Site / Location'] || '').includes(name) && !['Delivered to Site', 'Delivered to HQ Inventory'].includes(pr.Status));
    const readiness = assets.some(a => a.Readiness === 'Red') ? 'Red' : assets.some(a => a.Readiness === 'Amber') ? 'Amber' : assets.some(a => a.Readiness === 'Green') ? 'Green' : 'Unknown';
    const hClass = healthClass(readiness, nodeIssues);
    return { location, name, layout: location.layout, assets, crew, issues: nodeIssues, prs, readiness, health: hClass };
  });

  const selectedNode = locationNodes.find(node => node.name === selectedLocation) || locationNodes[0];
  const fleetByLocation = [...locationNodes].sort((a, b) => b.assets.length - a.assets.length);
  const urgentActions = [
    ...criticalIssues.map(issue => ({
      id: issue.id,
      type: 'Machine issue',
      title: issue.title,
      meta: `${issue.assetLabel || issue.assetId || 'Site'} at ${issue.location}`,
      link: '/issues',
      danger: true,
    })),
    ...criticalPRs.map(pr => ({
      id: pr['PR Ref'],
      type: 'Critical PR',
      title: pr['Item / Service Requested'],
      meta: `${pr.Status} at ${pr['Site / Location'] || 'Unknown'}`,
      link: '/procurement',
      danger: true,
    })),
    ...staff
      .filter(s => s['Work Permit Status'] === 'Expired' || s.Status === 'Probation')
      .map(s => ({
        id: s['Staff ID'],
        type: 'Crew alert',
        title: s['Full Name'],
        meta: `${s.Designation || 'Staff'} at ${s['Current Location'] || 'Unknown'}`,
        link: '/staff',
      })),
  ].slice(0, 8);

  const kpis = [
    { label: 'Fleet Online', value: activeFleet, sub: `${standbyFleet} standby, ${problemFleet} attention`, icon: Truck, tone: problemFleet ? 'warning' : 'success' },
    { label: 'Monthly Run Rate', value: formatMoney(monthlyRevenue), sub: `${activeAgreements.length} rentals, ${clients.length} clients`, icon: DollarSign, tone: 'success' },
    { label: 'Open Issues', value: openIssues.length, sub: `${criticalIssues.length} critical`, icon: Wrench, tone: criticalIssues.length ? 'danger' : 'warning' },
    { label: 'Critical PRs', value: criticalPRs.length, sub: `${procurement.length} total purchase requests`, icon: ShoppingCart, tone: criticalPRs.length ? 'danger' : 'success' },
    { label: 'Marine Links', value: vessels.length, sub: `${vessels.filter(v => v.Status !== 'Drydocked').length} available vessels`, icon: Ship, tone: 'info' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <RadioTower className="h-4 w-4" />
            Live Operations Map
          </div>
          <h1 className="page-title mt-1">Well Land Island Command</h1>
          <p className="text-sm text-textMuted">Machines, crew, issues, procurement pressure, and rental work grouped by deployed island.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/fleet" className="btn btn-primary text-xs">
            <Truck className="mr-1.5 h-4 w-4" /> Deploy Fleet
          </Link>
          <Link to="/issues" className="btn btn-outline text-xs">
            <Wrench className="mr-1.5 h-4 w-4" /> Log Issue
          </Link>
          <Link to="/procurement" className="btn btn-outline text-xs">
            <ShoppingCart className="mr-1.5 h-4 w-4" /> Procurement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, sub, icon: Icon, tone }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="ops-card flex items-center gap-3 p-4"
          >
            <div className={cn('ops-icon', `ops-icon-${tone}`)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-textMuted">{label}</div>
              <div className="truncate text-xl font-bold text-textMain">{value}</div>
              <div className="truncate text-[11px] text-textMuted">{sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="ops-map-shell">
          <div className="ops-map-header">
            <div>
              <h2 className="text-base font-bold text-white">Deployment Archipelago</h2>
              <p className="text-xs text-cyan-100/80">Select an island to inspect machines, crew, issues, and purchase pressure.</p>
            </div>
            <div className="hidden items-center gap-3 text-xs text-cyan-50 md:flex">
              <span className="flex items-center gap-1"><span className="legend-dot bg-emerald-300" /> Ready</span>
              <span className="flex items-center gap-1"><span className="legend-dot bg-amber-300" /> Watch</span>
              <span className="flex items-center gap-1"><span className="legend-dot bg-rose-400" /> Critical</span>
            </div>
          </div>

          <div className="ops-ocean">
            <div className="current-ring ring-one" />
            <div className="current-ring ring-two" />
            <div className="supply-route route-one" />
            <div className="supply-route route-two" />

            {locationNodes.map((node) => {
              const isSelected = selectedNode?.name === node.name;
              return (
                <button
                  key={node.name}
                  type="button"
                  onClick={() => setSelectedLocation(node.name)}
                  className={cn('island-node', `island-${node.layout.size}`, `island-${node.health}`, isSelected && 'island-selected')}
                  style={{ left: `${node.layout.x}%`, top: `${node.layout.y}%` }}
                >
                  <span className="island-land">
                    <span className="island-name">{node.name}</span>
                    <span className="island-count">
                      <Truck className="h-3 w-3" /> {node.assets.length}
                    </span>
                  </span>
                  {node.issues.length > 0 && <span className="island-alert">{node.issues.length}</span>}
                </button>
              );
            })}

            {vessels.slice(0, 3).map((vessel, index) => (
              <div key={vessel['Vessel ID'] || vessel['Name/Ref'] || index} className={`vessel-token vessel-${index + 1}`}>
                <Ship className="h-4 w-4" />
                <span>{vessel['Name/Ref'] || vessel.Type || 'Vessel'}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="ops-card p-0">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Selected Island</div>
                <h2 className="text-lg font-bold text-textMain">{selectedNode?.name || 'No location'}</h2>
              </div>
              <MapPinned className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Units" value={selectedNode?.assets.length || 0} icon={Truck} />
              <MiniStat label="Crew" value={selectedNode?.crew.length || 0} icon={Users} />
              <MiniStat label="Issues" value={selectedNode?.issues.length || 0} icon={AlertTriangle} danger={selectedNode?.issues.length > 0} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="section-label">Machines On Ground</h3>
                <Link to="/fleet" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {selectedNode?.assets.length ? selectedNode.assets.slice(0, 8).map(asset => (
                  <div key={asset['Asset ID']} className="rounded-lg border border-border/70 bg-surfaceContainer px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-textMain">{asset['Asset ID']} - {asset.Brand} {asset.Model}</div>
                        <div className="truncate text-[11px] text-textMuted">{asset.Type || 'Machine'} * {asset.Status || 'Unknown'}</div>
                      </div>
                      <span className={cn('badge shrink-0', asset.Readiness === 'Red' ? 'badge-danger' : asset.Readiness === 'Amber' ? 'badge-warning' : asset.Readiness === 'Green' ? 'badge-success' : 'badge-default')}>
                        {asset.Readiness || 'Unknown'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg bg-surfaceContainer p-4 text-sm text-textMuted">No machines currently assigned to this island.</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="section-label mb-2">Island Pressure</h3>
              <div className="space-y-2 text-sm">
                <PressureRow label="Open issues" value={selectedNode?.issues.length || 0} tone={selectedNode?.issues.some(isCriticalIssue) ? 'danger' : 'warning'} />
                <PressureRow label="Open PRs" value={selectedNode?.prs.length || 0} tone={selectedNode?.prs.length ? 'warning' : 'success'} />
                <PressureRow label="Readiness" value={selectedNode?.readiness || 'Unknown'} tone={selectedNode?.health || 'neutral'} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* AI Operations Brief */}
      <AiDailyBrief />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="ops-card p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-bold text-textMain">Mission Queue</h2>
              <p className="text-xs text-textMuted">Critical issues, blocked procurement, and crew alerts.</p>
            </div>
            <Link to="/issues" className="text-xs font-semibold text-primary hover:underline">
              View issues <ArrowUpRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {urgentActions.length ? urgentActions.map(item => (
              <Link key={`${item.type}-${item.id}`} to={item.link} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surfaceContainer">
                <div className="min-w-0">
                  <div className={cn('text-[10px] font-bold uppercase tracking-widest', item.danger ? 'text-danger' : 'text-warning')}>{item.type}</div>
                  <div className="truncate text-sm font-semibold text-textMain">{item.title}</div>
                  <div className="truncate text-xs text-textMuted">{item.meta}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-textMuted" />
              </Link>
            )) : (
              <div className="flex items-center gap-2 px-5 py-8 text-sm font-medium text-success">
                <CheckCircle2 className="h-5 w-5" />
                No critical mission items right now.
              </div>
            )}
          </div>
        </section>

        <section className="ops-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-textMain">Ops Tempo</h2>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            <TempoRow icon={PackageCheck} label="Average PR turnaround" value={avgTurnaround ? `${avgTurnaround} hrs` : 'No completed PRs'} />
            <TempoRow icon={Shield} label="Standby reserve" value={`${standbyFleet}/${fleet.length} machines`} />
            <TempoRow icon={Anchor} label="Vessel coverage" value={`${vessels.length} registered`} />
            <div className="pt-2">
              <h3 className="section-label mb-3">Fleet Distribution</h3>
              <div className="space-y-2">
                {fleetByLocation.map(node => (
                  <div key={node.name} className="flex items-center gap-2">
                    <div className="w-28 truncate text-xs font-medium text-textMuted" title={node.name}>{node.name}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surfaceContainer">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${fleet.length ? (node.assets.length / fleet.length) * 100 : 0}%` }} />
                    </div>
                    <div className="w-6 text-right text-xs font-bold">{node.assets.length}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, danger }) {
  return (
    <div className={cn('rounded-lg border border-border/70 bg-surfaceContainer p-3 text-center', danger && 'bg-dangerBg text-danger')}>
      <Icon className="mx-auto mb-1 h-4 w-4" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-textMuted">{label}</div>
    </div>
  );
}

function PressureRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surfaceContainer px-3 py-2">
      <span className="text-textMuted">{label}</span>
      <span className={cn(
        'flex items-center gap-1 font-bold',
        tone === 'danger' && 'text-danger',
        tone === 'warning' && 'text-warning',
        tone === 'success' && 'text-success',
        tone === 'neutral' && 'text-textMain'
      )}>
        <CircleDot className="h-3 w-3" />
        {value}
      </span>
    </div>
  );
}

function TempoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surfaceContainer p-3">
      <div className="ops-icon ops-icon-info h-9 w-9">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-textMuted">{label}</div>
        <div className="font-bold text-textMain">{value}</div>
      </div>
    </div>
  );
}
