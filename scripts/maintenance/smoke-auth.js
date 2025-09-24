// Minimal auth smoke test
// Usage: BASE_URL=https://your-netlify-site.netlify.app/.netlify/functions node scripts/smoke-auth.js
// Defaults to localhost netlify dev port if not provided.

const BASE = (process.env.BASE_URL || 'http://localhost:8888/.netlify/functions').replace(/\/$/,'');

async function fetchJson(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

(async () => {
  console.log('🔎 Auth smoke against:', BASE);
  const result = { steps: [] };
  try {
    // 1. Health
    const health = await fetchJson('/health');
    result.steps.push(['health', health.status, health.ok]);

    // 2. Login demo user
    const login = await fetchJson('/login', { method: 'POST', body: { email: 'demo@bisonte.com', password: 'demo123' } });
    result.steps.push(['login', login.status, login.ok]);
    if (!login.ok) throw new Error('login failed');
    const { access, refresh } = login.data;

    // 3. Access protected (simulate) - using metrics as simple endpoint
    const metrics1 = await fetchJson('/metrics', { headers: { Authorization: `Bearer ${access}` } });
    result.steps.push(['metrics-with-access', metrics1.status, metrics1.ok]);

    // 4. Refresh
    const refreshCall = await fetchJson('/refresh', { method: 'POST', body: { refresh } });
    result.steps.push(['refresh', refreshCall.status, refreshCall.ok]);
    const newAccess = refreshCall.data?.access;

    // 5. Password recovery issue code
    const recovery = await fetchJson('/password-recovery', { method: 'POST', body: { email: 'demo@bisonte.com' } });
    result.steps.push(['password-recovery', recovery.status, recovery.ok]);

    // 6. Validate code (will fail because random) expecting 401
    const validate = await fetchJson('/password-validate', { method: 'POST', body: { email: 'demo@bisonte.com', code: '000000', newPassword: 'Xx123456!' } });
    result.steps.push(['password-validate-invalid', validate.status, (validate.status === 401) ]);

    // Summary
    const passed = result.steps.filter(s => s[2]).length;
    console.log('\nResultados:');
    for (const [name, status, ok] of result.steps) {
      console.log(`${ok ? '✅' : '❌'} ${name.padEnd(24)} -> ${status}`);
    }
    console.log(`\n${passed}/${result.steps.length} pasos OK`);
    process.exitCode = passed === result.steps.length ? 0 : 1;
  } catch (e) {
    console.error('❌ Smoke error:', e.message);
    process.exitCode = 1;
  }
})();
