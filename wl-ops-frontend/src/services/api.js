import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('wlOpsToken');
export const setToken = (t) => localStorage.setItem('wlOpsToken', t);
export const clearToken = () => localStorage.removeItem('wlOpsToken');

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — auto-logout on 401 ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      localStorage.removeItem('wlOpsUser');
      // Trigger page reload so App re-renders to login screen
      if (typeof window !== 'undefined') window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (username, password) => {
  if (import.meta.env.PROD) {
    if (username === 'admin' && password === 'wlops2025') {
      const mockUser = { id: 1, username: 'admin', role: 'HOD', name: 'Admin User' };
      setToken('mock-jwt-token');
      localStorage.setItem('wlOpsUser', JSON.stringify(mockUser));
      return { token: 'mock-jwt-token', user: mockUser };
    }
    throw new Error('Invalid credentials');
  }
  const res = await api.post('/auth/login', { username, password });
  setToken(res.data.token);
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  if (import.meta.env.PROD) {
    return { message: 'Password changed successfully (mocked)' };
  }
  const res = await api.post('/auth/change-password', { currentPassword, newPassword });
  return res.data;
};

import initialDb from '../data/initialDb.json';

// ── Database ──────────────────────────────────────────────────────────────────
const emptyDb = {
  assets: [], locations: [], vessels: [], staff: [], operators: [],
  assignments: [], recovery: [], procurement: [], paymentRequests: [],
  suppliers: [], items: [], quotes: [], purchaseOrders: [], inventory: [],
  transfers: [], rentals: [], compliance: [], calls: [], dailyLogs: [],
  janakaDailyLogs: [], documentVault: [], clients: [], rentalAgreements: [],
  issueReports: [], supplierCatalog: [], transferNotes: [],
};

export const fetchDb = async () => {
  if (import.meta.env.PROD) {
    const localDb = localStorage.getItem('wlops_mock_db');
    if (localDb) {
      const parsed = JSON.parse(localDb);
      // If the cached DB has no assets, consider it empty and seed it anyway
      if (!parsed.assets || parsed.assets.length === 0) {
        return { ...emptyDb, ...initialDb };
      }
      
      // Auto-merge new suppliers, inventory, and issues from the new initialDb
      let updated = false;
      parsed.suppliers = parsed.suppliers || [];
      parsed.inventory = parsed.inventory || [];
      parsed.issueReports = parsed.issueReports || [];
      
      const existingSupplierIds = new Set(parsed.suppliers.map(s => s.id));
      for (const sup of (initialDb.suppliers || [])) {
        if (!existingSupplierIds.has(sup.id)) {
          parsed.suppliers.push(sup);
          updated = true;
        }
      }
      
      const existingInventoryIds = new Set(parsed.inventory.map(i => i.id));
      for (const inv of (initialDb.inventory || [])) {
        if (!existingInventoryIds.has(inv.id)) {
          parsed.inventory.push(inv);
          updated = true;
        }
      }
      
      const existingIssueIds = new Set(parsed.issueReports.map(ir => ir.id));
      for (const ir of (initialDb.issueReports || [])) {
        if (!existingIssueIds.has(ir.id)) {
          parsed.issueReports.push(ir);
          updated = true;
        }
      }
      
      if (updated) {
        localStorage.setItem('wlops_mock_db', JSON.stringify(parsed));
      }
      
      return { ...emptyDb, ...parsed };
    }
    // Seed with actual local data for the demo
    return { ...emptyDb, ...initialDb };
  }
  try {
    const res = await api.get('/db');
    return { ...emptyDb, ...(res.data || {}) };
  } catch (err) {
    console.error('fetchDb failed:', err.message);
    return emptyDb;
  }
};

export const saveDb = async (dbData) => {
  if (import.meta.env.PROD) {
    localStorage.setItem('wlops_mock_db', JSON.stringify(dbData));
    return { message: 'Database saved (mocked)' };
  }
  const res = await api.post('/db', dbData);
  return res.data;
};

export const saveTable = async (table, data) => {
  if (import.meta.env.PROD) {
    const db = await fetchDb();
    db[table] = data;
    localStorage.setItem('wlops_mock_db', JSON.stringify(db));
    return { message: `Table ${table} saved (mocked)` };
  }
  const res = await api.post(`/db/${table}`, data);
  return res.data;
};

export const fetchStats = async () => {
  if (import.meta.env.PROD) {
    return {
      totalAssets: 0,
      activeIssues: 0,
      pendingPRs: 0,
      activeRentals: 0
    };
  }
  try {
    const res = await api.get('/stats');
    return res.data;
  } catch {
    return {};
  }
};

export default api;
