import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, BarChart3, CalendarDays, Download, Package, ShieldAlert, ShoppingCart, Truck, Users } from 'lucide-react';
import { useAppContext } from '../App';
import { cn } from '../lib/utils';
import { generatePDF } from '../lib/pdfGenerator';

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item) || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function Stat({ label, value, icon: Icon, tone = 'info' }) {
  return (
    <div className="ops-card flex items-center gap-3 p-4">
      <div className={cn('ops-icon', `ops-icon-${tone}`)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</div>
        <div className="text-2xl font-bold text-textMain">{value}</div>
      </div>
    </div>
  );
}

function Distribution({ title, data }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return (
    <section className="ops-card p-5">
      <h2 className="font-bold text-textMain">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-40 truncate text-xs font-medium text-textMuted" title={label}>{label}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surfaceContainer">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(value / total) * 100}%` }} />
            </div>
            <div className="w-8 text-right text-xs font-bold text-textMain">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Reports() {
  const { db } = useAppContext();
  if (!db) return null;

  const assets = db.assets || [];
  const procurement = db.procurement || [];
  const recovery = db.recovery || [];
  const staff = db.staff || [];
  const inventory = db.inventory || [];
  const transferNotes = db.transferNotes || [];
  const compliance = db.compliance || [];
  const issues = db.issueReports || [];
  const openIssues = issues.filter(item => !['Resolved', 'Closed'].includes(item.status));
  const openRecovery = recovery.filter(item => !['Resolved', 'Closed', 'Completed'].includes(item.Status));
  const openPRs = procurement.filter(item => !['Delivered to Site', 'Delivered to HQ Inventory'].includes(item.Status));
  const inTransit = transferNotes.filter(item => item.status === 'In Transit');
  const complianceOpen = compliance.filter(item => !String(item['Status / Notes'] || '').toLowerCase().includes('complete'));

  const actionList = [
    ...openIssues.slice(0, 5).map(item => ({
      type: 'Machine issue',
      title: item.title,
      meta: `${item.assetId || item.assetLabel || 'Asset'} at ${item.location || 'Unknown'}`,
      link: '/issues',
      tone: 'danger',
    })),
    ...openPRs.slice(0, 5).map(item => ({
      type: 'Procurement',
      title: item['Item / Service Requested'],
      meta: `${item['PR Ref']} - ${item['Site / Location'] || 'Unknown'}`,
      link: '/procurement',
      tone: item.Urgency === 'CRITICAL' ? 'danger' : 'warning',
    })),
    ...inTransit.slice(0, 5).map(item => ({
      type: 'Logistics',
      title: item.item,
      meta: `${item.source} -> ${item.destination}`,
      link: '/inventory',
      tone: 'warning',
    })),
  ].slice(0, 10);

  const exportReport = (title, headers, rows) => {
    generatePDF('General Report', {}, { headers: [headers], rows, title });
  };

  const issueRows = issues.map(issue => [
    issue.id,
    issue.assetId || issue.assetLabel || '-',
    issue.location || '-',
    issue.title || '-',
    issue.status || '-',
    issue.priority || '-',
  ]);

  const prRows = procurement.map(pr => [
    pr['PR Ref'] || '-',
    pr['Issue Ref'] || '-',
    pr['Asset ID'] || '-',
    pr['Item / Service Requested'] || '-',
    pr.Status || '-',
    pr['Site / Location'] || '-',
  ]);

  const assetRows = assets.map(asset => [
    asset['Asset ID'],
    `${asset.Brand || ''} ${asset.Model || ''}`.trim(),
    asset.Category || asset.Type || '-',
    asset.Site || asset['Current Location'] || '-',
    asset.Status || '-',
    asset.Readiness || '-',
    issues.filter(i => i.assetId === asset['Asset ID']).length,
  ]);

  const stockRows = inventory.map(item => [
    item.id || '-',
    item.item || '-',
    item.location || '-',
    item.qty || 0,
    item.prRef || item.lastPrRef || '-',
    item.issueRef || '-',
  ]);

  const periodRows = [
    ['Open issues', openIssues.length],
    ['Open PRs', openPRs.length],
    ['In-transit transfers', inTransit.length],
    ['Stock lines', inventory.length],
    ['Red machines', assets.filter(a => a.Readiness === 'Red').length],
    ['Compliance open', complianceOpen.length],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <BarChart3 className="h-4 w-4" />
            Reports
          </div>
          <h1 className="page-title mt-1">Operations Review</h1>
          <p className="text-sm text-textMuted">A quick management view across fleet, PRs, warehouse, staff, and compliance.</p>
        </div>
      </div>

      <section className="ops-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-textMain">Exportable Management Reports</h2>
            <p className="text-xs text-textMuted mt-1">PDF packs for issues, procurement items, asset history, stock movement, and daily/weekly/monthly reviews.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          <button onClick={() => exportReport('All Issues Report', ['Issue', 'Asset', 'Location', 'Title', 'Status', 'Priority'], issueRows)} className="btn btn-outline text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Issues PDF
          </button>
          <button onClick={() => exportReport('Procurement Items Report', ['PR', 'Issue', 'Asset', 'Item', 'Status', 'Site'], prRows)} className="btn btn-outline text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Items / PR PDF
          </button>
          <button onClick={() => exportReport('Asset History And Machine Status', ['Asset', 'Model', 'Category', 'Location', 'Status', 'Readiness', 'Issues'], assetRows)} className="btn btn-outline text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Asset History PDF
          </button>
          <button onClick={() => exportReport('Inventory And Store Movement', ['Stock ID', 'Item', 'Location', 'Qty', 'PR', 'Issue'], stockRows)} className="btn btn-outline text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Stock PDF
          </button>
          <button onClick={() => exportReport('Daily Weekly Monthly Ops Review', ['Metric', 'Value'], periodRows)} className="btn btn-primary text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Ops Review PDF
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Stat label="Machines" value={assets.length} icon={Truck} />
        <Stat label="Open Issues" value={openIssues.length || openRecovery.length} icon={AlertTriangle} tone={(openIssues.length || openRecovery.length) ? 'danger' : 'success'} />
        <Stat label="Open PRs" value={openPRs.length} icon={ShoppingCart} tone={openPRs.length ? 'warning' : 'success'} />
        <Stat label="Stock Lines" value={inventory.length} icon={Package} />
        <Stat label="Staff" value={staff.length} icon={Users} />
        <Stat label="Compliance" value={complianceOpen.length} icon={ShieldAlert} tone={complianceOpen.length ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Distribution title="Fleet By Location" data={countBy(assets, item => item.Site)} />
        <Distribution title="Fleet By Machine Category" data={countBy(assets, item => item.Category)} />
      </div>

      <section className="ops-card p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-textMain">Priority Action Queue</h2>
          <p className="text-xs text-textMuted">Work this list from top to bottom during the daily ops review.</p>
        </div>
        <div className="divide-y divide-border/60">
          {actionList.length ? actionList.map((item, index) => (
            <Link key={`${item.type}-${index}`} to={item.link} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surfaceContainer">
              <div className="min-w-0">
                <div className={cn('text-[10px] font-bold uppercase tracking-widest', item.tone === 'danger' ? 'text-danger' : 'text-warning')}>{item.type}</div>
                <div className="truncate text-sm font-semibold text-textMain">{item.title}</div>
                <div className="truncate text-xs text-textMuted">{item.meta}</div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-textMuted" />
            </Link>
          )) : (
            <div className="px-5 py-8 text-sm font-medium text-success">No urgent operations actions currently listed.</div>
          )}
        </div>
      </section>
    </div>
  );
}
