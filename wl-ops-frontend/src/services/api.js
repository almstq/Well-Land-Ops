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
  const res = await api.post('/auth/login', { username, password });
  setToken(res.data.token);
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await api.post('/auth/change-password', { currentPassword, newPassword });
  return res.data;
};

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
  try {
    const res = await api.get('/db');
    return { ...emptyDb, ...(res.data || {}) };
  } catch (err) {
    console.error('fetchDb failed:', err.message);
    return emptyDb;
  }
};

export const saveDb = async (dbData) => {
  const res = await api.post('/db', dbData);
  return res.data;
};

export const saveTable = async (table, data) => {
  const res = await api.post(`/db/${table}`, data);
  return res.data;
};

export const fetchStats = async () => {
  try {
    const res = await api.get('/stats');
    return res.data;
  } catch {
    return {};
  }
};

export default api;
