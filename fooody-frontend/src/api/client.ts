import { config } from '@/constants/config';

// Minimal typed fetch client with interceptors

type FetchOpts = RequestInit & { params?: Record<string,string> };

let _idToken: string | null = null;

export function setAuthToken(token: string | null) {
  _idToken = token;
}
export function getAuthToken() { return _idToken; }

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any),
  };
  if (_idToken) headers['Authorization'] = `Bearer ${_idToken}`;

  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (e: any) {
    const err: any = new Error(
      `Network request failed (${url}). Backend not reachable – make sure it is running and ` +
        `EXPO_PUBLIC_API_URL is correct: use http://192.168.1.2:5000/api/v1 on a physical device, ` +
        `http://localhost:5000/api/v1 on simulator/web. Also allow port 5000 through Windows Firewall.`
    );
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
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
