const API_BASE = 'http://192.168.1.15:3000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
  
  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  if (!response.ok) {
    const error = await response.text();
    try {
  const parsed = JSON.parse(error);
  throw new Error(parsed.message || 'Request failed');
} catch (e) {
  if (e instanceof Error && e.message !== 'Request failed') throw e;
  throw new Error('Request failed. Please try again.');
}
  }
  return response.json();
}

export const auth = {
  register: (data: any) =>
    request<{ status: string; data: { access_token: string; user: unknown } }>('/api/auth/register', {
      method: 'POST', body: data,
    }),
  login: (email: string, password: string) =>
    request<{ status: string; data: { access_token: string; user: unknown } }>('/api/auth/login', {
      method: 'POST', body: { email, password },
    }),
  me: () =>
    request<{ status: string; data: { user: unknown } }>('/api/auth/me'),
  logout: () =>
    request<{ status: string; message: string }>('/api/auth/logout', { method: 'POST' }),
};

export const metrics = {
  getLatest: () =>
    request<{ status: string; data: any }>('/api/agents/metrics_engine'),
};

export default { auth, metrics };
