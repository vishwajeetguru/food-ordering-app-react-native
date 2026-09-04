import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  // cache-buster for GETs to avoid stale CDN cache after mutations
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Request failed';
    const code = err.response?.data?.error?.code;
    // Auto-logout on 401
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Only redirect if not already on login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(Object.assign(new Error(msg), { status: err.response?.status, code, details: err.response?.data?.error?.details, raw: err.response?.data }));
  }
);

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('admin_token');
}

// Unwrap helpers — backend returns {success, message, data}
export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}
