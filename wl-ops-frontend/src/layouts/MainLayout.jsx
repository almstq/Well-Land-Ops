import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Anchor, Users, ShieldCheck,
  Database, ShoppingCart, Package, AlertTriangle,
  Star, LogOut, Building2, BarChart3, Menu, X,
  ChevronRight, KeyRound, Search,
} from 'lucide-react';
import GlobalSearch from '../components/GlobalSearch';
import { cn } from '../lib/utils';
import { useAppContext } from '../App';
import { canAccess } from '../lib/accessControl';
import { changePassword } from '../services/api';

const NAV = [
  {
    label: null,
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Command Center', exact: true, permission: 'dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/issues',      icon: AlertTriangle, label: 'Issue Reports',        permission: 'issues' },
      { to: '/procurement', icon: ShoppingCart,  label: 'Procurement',          permission: 'procurement' },
      { to: '/inventory',   icon: Package,       label: 'Inventory & Warehouse', permission: 'inventory' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/fleet',   icon: Truck,     label: 'Fleet Register',    permission: 'fleet' },
      { to: '/vessels', icon: Anchor,    label: 'Vessel Register',   permission: 'vessels' },
      { to: '/staff',   icon: Users,     label: 'Staff Register',    permission: 'staff' },
      { to: '/srm',     icon: Building2, label: 'Supplier Register', permission: 'srm' },
      { to: '/master',  icon: Database,  label: 'Master Data',       permission: 'master' },
    ],
  },
  {
    label: 'Business & Governance',
    items: [
      { to: '/crm',        icon: Star,       label: 'CRM & Rentals', permission: 'crm',        accent: true },
      { to: '/reports',    icon: BarChart3,  label: 'Reports',       permission: 'reports' },
      { to: '/compliance', icon: ShieldCheck,label: 'Compliance',    permission: 'compliance' },
    ],
  },
];

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ ok: false, msg: 'New passwords do not match.' });
      return;
    }
    if (form.next.length < 8) {
      setStatus({ ok: false, msg: 'Password must be at least 8 characters.' });
      return;
    }
    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      setStatus({ ok: true, msg: 'Password changed! Please log in again.' });
      setTimeout(onClose, 2000);
    } catch (err) {
      setStatus({ ok: false, msg: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-elevation-4 w-full max-w-sm p-6">
        <h2 className="text-title-md font-bold text-on-surface mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {['current', 'next', 'confirm'].map((f) => (
            <div key={f}>
              <label className="label">{f === 'current' ? 'Current Password' : f === 'next' ? 'New Password' : 'Confirm New Password'}</label>
              <input
                type="password"
                className="input"
                value={form[f]}
                onChange={e => setForm(v => ({ ...v, [f]: e.target.value }))}
                required
                minLength={f !== 'current' ? 8 : undefined}
              />
            </div>
          ))}
          {status && (
            <p className={cn('text-body-sm', status.ok ? 'text-success' : 'text-error')}>{status.msg}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MainLayout() {
  const { currentUser, logout } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Ctrl+K / Cmd+K opens global search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sections = NAV.map(s => ({
    ...s,
    items: s.items.filter(i => canAccess(currentUser, i.permission)),
  })).filter(s => s.items.length > 0);

  const renderNavItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.exact}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-label-lg font-medium transition-all duration-150',
          isActive
            ? item.accent
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-secondary-container text-on-secondary-container'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn('w-5 h-5 shrink-0 transition-colors', isActive ? 'text-secondary' : 'text-on-surface-variant group-hover:text-on-surface')} />
          <span className="flex-1 text-sm">{item.label}</span>
          {isActive && <ChevronRight className="w-3.5 h-3.5 text-secondary opacity-60" />}
        </>
      )}
    </NavLink>
  );

  const renderSidebar = (className) => (
    <aside className={cn('flex flex-col h-full bg-surface-container-low border-r border-outline-variant', className)}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-elevation-1">
            <Anchor className="w-5 h-5 text-on-primary" />
          </div>
          <div>
            <h1 className="text-title-sm font-bold text-on-surface">Well Land Ops</h1>
            <p className="text-body-xs text-on-surface-variant">Antrac Holding Group</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-outline-variant">
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 w-full rounded-2xl bg-surface-container px-4 py-2.5 text-body-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="hidden sm:inline text-xs bg-surface-container-highest px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="section-label px-4 mb-2">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t border-outline-variant space-y-1">
        <div className="px-4 py-3 rounded-2xl bg-surface-container">
          <div className="text-label-lg font-bold text-on-surface truncate">{currentUser?.name}</div>
          <div className="text-body-xs text-on-surface-variant mt-0.5">{currentUser?.role}</div>
        </div>
        <button
          onClick={() => setShowPwModal(true)}
          className="flex items-center gap-3 text-label-lg text-on-surface-variant hover:text-on-surface w-full px-4 py-2.5 rounded-2xl hover:bg-surface-container transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-label-lg text-on-surface-variant hover:text-error w-full px-4 py-2.5 rounded-2xl hover:bg-error-container/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-dim">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 shrink-0 h-full">
        {renderSidebar("w-full")}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full shadow-elevation-4">
            {renderSidebar("w-full")}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 md3-icon-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-outline-variant shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md3-icon-btn">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-primary" />
            <span className="text-title-sm font-bold text-on-surface">Well Land Ops</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}
