import { config } from '@/constants/config';

// Minimal typed fetch client with interceptors

type FetchOpts = RequestInit & { params?: Record<string,string> };

let _idToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string | null) {
  _idToken = token;
}
export function getAuthToken() { return _idToken; }

async function refreshFirebaseIdToken(): Promise<string | null> {
  // Single-flight refresh: all 401 TOKEN_EXPIRED responses wait for one getIdToken(true)
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const { getFirebaseAuth } = await import('@/services/firebase');
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) return null;
      // Wait up to 3s for Firebase auth state to restore (in case currentUser still null on cold start)
      for (let i = 0; i < 6 && !auth.currentUser; i++) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!auth.currentUser) return null;
      const newToken = await auth.currentUser.getIdToken(true);
      setAuthToken(newToken);
      try {
        const { authService } = await import('@/services/auth.service');
        await authService.persistIdToken(newToken);
      } catch {}
      try {
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().setToken(newToken);
      } catch {}
      return newToken;
    } catch (e) {
      console.warn('[api] token refresh failed', e);
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any),
  };
  if (_idToken) headers['Authorization'] = `Bearer ${_idToken}`;

  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    res = await fetch(url, { ...opts, headers, signal: controller.signal });
    clearTimeout(timeout);
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    const err: any = new Error(
      isAbort
        ? `Request timed out (${url}) — backend not reachable in 8s. Check EXPO_PUBLIC_API_URL and firewall.`
        : `Network request failed (${url}). Backend not reachable – make sure it is running and ` +
          `EXPO_PUBLIC_API_URL is correct: use http://192.168.1.2:5000/api/v1 on a physical device, ` +
          `http://localhost:5000/api/v1 on simulator/web. Also allow port 5000 through Windows Firewall.`
    );
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Auto-refresh Firebase ID token on expiry and retry once (single-flight)
    if (res.status === 401 && json?.error?.code === 'TOKEN_EXPIRED' && _idToken) {
      const newToken = await refreshFirebaseIdToken();
      if (newToken) {
        const retryHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any), Authorization: `Bearer ${newToken}` };
        const retryRes = await fetch(url, { ...opts, headers: retryHeaders });
        const retryJson = await retryRes.json().catch(() => ({}));
        if (!retryRes.ok) {
          const retryErr: any = new Error(retryJson?.message || `Request failed ${retryRes.status}`);
          retryErr.status = retryRes.status;
          retryErr.code = retryJson?.error?.code;
          retryErr.details = retryJson?.error?.details;
          retryErr.data = retryJson;
          throw retryErr;
        }
        return retryJson as T;
      }
    }
    const err: any = new Error(json?.message || `Request failed ${res.status}`);
    err.status = res.status;
    err.code = json?.error?.code;
    err.details = json?.error?.details;
    err.data = json;
    throw err;
  }
  return json as T;
}

export const api = {
  get: <T>(p:string, opts?: FetchOpts) => apiFetch<T>(p, { ...opts, method: 'GET' }),
  post: <T>(p:string, body?: any, opts?: FetchOpts) => apiFetch<T>(p, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p:string, body?: any, opts?: FetchOpts) => apiFetch<T>(p, { ...opts, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(p:string, opts?: FetchOpts) => apiFetch<T>(p, { ...opts, method: 'DELETE' }),
};
