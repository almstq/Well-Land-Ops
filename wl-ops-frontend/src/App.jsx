import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { fetchDb, saveDb, saveTable, getToken, clearToken } from './services/api';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import IssueReports from './pages/IssueReports';
import Procurement from './pages/Procurement';
import Fleet from './pages/Fleet';
import Vessels from './pages/Vessels';
import Staff from './pages/Staff';
import Compliance from './pages/Compliance';
import MasterData from './pages/MasterData';
import Inventory from './pages/Inventory';
import SRM from './pages/SRM';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { canAccess } from './lib/accessControl';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

function RequireAccess({ permission, children }) {
  const { currentUser } = useAppContext();
  if (!canAccess(currentUser, permission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('wlOpsUser') || 'null');
  } catch {
    return null;
  }
}

function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    // Only restore session if a token still exists
    return getToken() ? getStoredUser() : null;
  });

  const loadDb = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDb();
      setDb(data);
    } catch {
      setDb({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDb();
    } else {
      setLoading(false);
    }
  }, [currentUser, loadDb]);

  const updateDb = async (newData) => {
    const updated = { ...db, ...newData };
    setDb(updated);
    await saveDb(updated);
  };

  const updateTable = async (table, data) => {
    const updated = { ...db, [table]: data };
    setDb(updated);
    await saveTable(table, data);
  };

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('wlOpsUser', JSON.stringify(user));
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem('wlOpsUser');
    setCurrentUser(null);
    setDb(null);
  };

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-surface-dim">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-body-md text-on-surface-variant font-medium">Loading Well Land Ops…</div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ db, updateDb, updateTable, currentUser, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="crm" element={<RequireAccess permission="crm"><CRM /></RequireAccess>} />
            <Route path="issues" element={<RequireAccess permission="issues"><IssueReports /></RequireAccess>} />
            <Route path="procurement" element={<RequireAccess permission="procurement"><Procurement /></RequireAccess>} />
            <Route path="fleet" element={<RequireAccess permission="fleet"><Fleet /></RequireAccess>} />
            <Route path="vessels" element={<RequireAccess permission="vessels"><Vessels /></RequireAccess>} />
            <Route path="staff" element={<RequireAccess permission="staff"><Staff /></RequireAccess>} />
            <Route path="compliance" element={<RequireAccess permission="compliance"><Compliance /></RequireAccess>} />
            <Route path="master" element={<RequireAccess permission="master"><MasterData /></RequireAccess>} />
            <Route path="inventory" element={<RequireAccess permission="inventory"><Inventory /></RequireAccess>} />
            <Route path="srm" element={<RequireAccess permission="srm"><SRM /></RequireAccess>} />
            <Route path="reports" element={<RequireAccess permission="reports"><Reports /></RequireAccess>} />
            <Route path="rentals" element={<Navigate to="/crm" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}

export default App;
