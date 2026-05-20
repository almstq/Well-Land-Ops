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
        localStorage.setItem('wlops_mock_db', JSON.stringify(initialDb));
        return { ...emptyDb, ...initialDb };
      }
      
      let updated = false;
      parsed.suppliers = parsed.suppliers || [];
      parsed.inventory = parsed.inventory || [];
      parsed.issueReports = parsed.issueReports || [];
      parsed.items = parsed.items || [];
      parsed.meta = parsed.meta || {};

      // If the cached DB doesn't have our normalized v3 schema flag, or has very few records,
      // let's do a deep non-destructive smart merge of everything.
      if (!parsed.meta.isNormalized_v3 || parsed.suppliers.length < 50 || parsed.items.length < 100) {
        // Smart merge suppliers by name (case-insensitive)
        const existingSupplierNames = new Map(
          parsed.suppliers.map(s => [(s.name || s.Supplier || '').toLowerCase().trim(), s])
        );
        for (const sup of (initialDb.suppliers || [])) {
          const supNameKey = (sup.name || sup.Supplier || '').toLowerCase().trim();
          if (supNameKey) {
            if (!existingSupplierNames.has(supNameKey)) {
              parsed.suppliers.push(sup);
              existingSupplierNames.set(supNameKey, sup);
              updated = true;
            } else {
              // Supplier exists: enrich missing/unpopulated keys (like contact details) non-destructively
              const existingSup = existingSupplierNames.get(supNameKey);
              for (const [key, val] of Object.entries(sup)) {
                if (existingSup[key] === undefined || existingSup[key] === null || existingSup[key] === '') {
                  existingSup[key] = val;
                  updated = true;
                }
              }
            }
          }
        }

        // Smart merge Master Items catalog by name (case-insensitive)
        const existingItemNames = new Map(
          parsed.items.map(i => [(i.name || i['Item Name'] || '').toLowerCase().trim(), i])
        );
        for (const item of (initialDb.items || [])) {
          const itemNameKey = (item.name || item['Item Name'] || '').toLowerCase().trim();
          if (itemNameKey) {
            if (!existingItemNames.has(itemNameKey)) {
              parsed.items.push(item);
              existingItemNames.set(itemNameKey, item);
              updated = true;
            } else {
              // Enrich missing fields
              const existingItem = existingItemNames.get(itemNameKey);
              for (const [key, val] of Object.entries(item)) {
                if (existingItem[key] === undefined || existingItem[key] === null || existingItem[key] === '') {
                  existingItem[key] = val;
                  updated = true;
                }
              }
            }
          }
        }

        // Smart merge Issue Reports by ID or Title (case-insensitive)
        const existingIssueIds = new Set(parsed.issueReports.map(ir => (ir.id || '').toLowerCase().trim()));
        const existingIssueTitles = new Set(parsed.issueReports.map(ir => (ir.title || '').toLowerCase().trim()));
        for (const ir of (initialDb.issueReports || [])) {
          const irIdKey = (ir.id || '').toLowerCase().trim();
          const irTitleKey = (ir.title || '').toLowerCase().trim();
          if (irIdKey && !existingIssueIds.has(irIdKey) && irTitleKey && !existingIssueTitles.has(irTitleKey)) {
            parsed.issueReports.push(ir);
            existingIssueIds.add(irIdKey);
            existingIssueTitles.add(irTitleKey);
            updated = true;
          }
        }

        // Smart merge Inventory by Item + Location key
        const existingInvKeys = new Set(
          parsed.inventory.map(inv => `${(inv.item || inv['Item Name'] || '').toLowerCase().trim()}||${(inv.location || inv.Location || '').toLowerCase().trim()}`)
        );
        for (const inv of (initialDb.inventory || [])) {
          const invKey = `${(inv.item || inv['Item Name'] || '').toLowerCase().trim()}||${(inv.location || inv.Location || '').toLowerCase().trim()}`;
          if (invKey && !existingInvKeys.has(invKey)) {
            parsed.inventory.push(inv);
            existingInvKeys.add(invKey);
            updated = true;
          }
        }

        // Mark as normalized v3
        parsed.meta.isNormalized_v3 = true;
        parsed.meta.version = 3;
        parsed.meta.lastNormalizedAt = new Date().toISOString();
        updated = true;
      }
      
      if (updated) {
        localStorage.setItem('wlops_mock_db', JSON.stringify(parsed));
      }
      
      return { ...emptyDb, ...parsed };
    }
    // Seed with actual local data for the demo
    localStorage.setItem('wlops_mock_db', JSON.stringify(initialDb));
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

export const resetDbToDefault = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wlops_mock_db');
    window.location.reload();
  }
};

export default api;

