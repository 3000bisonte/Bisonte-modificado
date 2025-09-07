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
