// Centralized backend API base URL (Netlify Functions - Option B)
// Single env variable: NEXT_PUBLIC_API_BASE_URL (example: https://your-site.netlify.app/.netlify/functions)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined'
  ? process.env.FALLBACK_API_BASE_URL
  : window.__API_BASE_URL__) || 'http://localhost:8888/.netlify/functions';

// Optional: allow injecting at runtime (for edge preview) by setting window.__API_BASE_URL__ before hydration.

export async function apiGet(path, token, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...init,
  });
  return handle(res);
}

export async function apiPost(path, body, token, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
  return handle(res);
}

export async function apiDelete(path, token, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...init,
  });
  return handle(res);
}

export async function apiPut(path, body, token, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
  return handle(res);
}

// ---------------- Token Refresh Utilities ----------------
let refreshing = null;

export async function refreshAccess(refreshToken) {
  if (!refreshToken) return null;
  if (refreshing) return refreshing; // de-duplicate concurrent
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      const text = await res.text();
      let data; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (res.ok && data?.access) return data.access;
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// Wrap fetch with auto refresh on 401 for access token only
export async function apiFetchWithRefresh(path, { method='GET', body, accessToken, refreshToken }) {
  const doReq = async (token) => fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let res = await doReq(accessToken);
  if (res.status === 401 && refreshToken) {
    const newAccess = await refreshAccess(refreshToken);
    if (newAccess) {
      res = await doReq(newAccess);
      return { res, newAccess };
    }
  }
  return { res, newAccess: null };
}

// React hook for managing access/refresh pair (client side only)
// Usage: const { accessToken, refreshToken, setTokens } = useAuthTokens();
import { useState, useEffect, useCallback, useRef } from 'react';

export function useAuthTokens() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const timerRef = useRef(null);

  const schedule = useCallback((token) => {
    if (!token) return;
    try {
      const [, payload] = token.split('.');
      const data = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
      if (data.exp) {
        const ms = (data.exp * 1000) - Date.now() - 30_000; // refresh 30s before expiry
        if (ms > 0) {
          timerRef.current && clearTimeout(timerRef.current);
            timerRef.current = setTimeout(async () => {
              const newA = await refreshAccess(refreshToken);
              if (newA) setAccessToken(newA);
            }, ms);
        }
      }
    } catch {}
  }, [refreshToken]);

  const setTokens = useCallback((a, r) => {
    if (a) setAccessToken(a);
    if (r) setRefreshToken(r);
  }, []);

  useEffect(() => { schedule(accessToken); return () => timerRef.current && clearTimeout(timerRef.current); }, [accessToken, schedule]);

  return { accessToken, refreshToken, setTokens };
}

async function handle(res) {
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error('API error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
