// Script: Comprehensive API endpoint checker (30+ endpoints)
// Usage:
//   BASE_URL=https://nimble-vacherin-7a32d0.netlify.app/.netlify/functions node scripts/check-endpoints.js
//   node scripts/check-endpoints.js --base https://nimble-vacherin-7a32d0.netlify.app/.netlify/functions
// Optional envs for login:
//   USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD

/* eslint-disable no-console */

const DEFAULT_BASE = process.env.BASE_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || 'https://nimble-vacherin-7a32d0.netlify.app/.netlify/functions';

const argvBase = process.argv.find(a => a.startsWith('--base='))?.split('=')[1];
const BASE = (argvBase || DEFAULT_BASE).replace(/\/$/, '');

// Prefer global fetch (Node >=18). Fallback to node-fetch if needed.
const fetchCompat = async (...args) => {
  if (typeof fetch === 'function') return fetch(...args);
  const mod = await import('node-fetch');
  return mod.default(...args);
};

const withTimeout = async (promise, ms = 8000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await promise(ctrl);
    return res;
  } finally {
    clearTimeout(id);
  }
};

const credsUser = {
  email: process.env.USER_EMAIL || 'demo@bisonte.com',
  password: process.env.USER_PASSWORD || 'demo123'
};

const credsAdmin = {
  email: process.env.ADMIN_EMAIL || '3000bisonte@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

// [method, path, body, access]
// access: 'public' | 'user' | 'admin'
const endpoints = [
  // Health and config
  ['GET','/'],
  ['GET','/api/health'],
  ['GET','/api/status'],
  ['GET','/api/public/config'],
  // Auth core
  ['GET','/api/auth/providers'],
  ['GET','/api/auth/csrf'],
  ['GET','/api/auth/session', null, 'user'],
  ['POST','/api/auth/logout', {}],
  // Google auth web/mobile
  ['GET','/api/auth/signin/google'],
  ['GET','/api/auth/callback/google'],
  ['POST','/api/auth/google', { idToken: 'TEST_TOKEN' }], // expects 400/401 in prod if not provided real token
  // Email-password auth
  ['POST','/api/auth/login', { email: credsUser.email, password: credsUser.password }],
  ['POST','/api/register', { email: `user${Date.now()}@test.com`, password: 'x12345' }],
  // Domain endpoints (public)
  ['GET','/api/test'],
  ['POST','/api/send', { to:'test@example.com', subject:'Test', message:'Hola' }],
  ['GET','/api/email'],
  ['POST','/api/email', { action:'ping' }],
  ['GET','/api/mercadopago/status'],
  ['POST','/api/mercadopago/create-preference', { amount: 10000, description: 'Prueba', email: 'demo@bisonte.com' }],
  ['POST','/api/recuperar', { email: 'demo@bisonte.com' }],
  ['POST','/api/recuperar/validar-token', { email: 'demo@bisonte.com', token: '111111', newPassword: 'Nuevo123!' }],
  ['POST','/api/contacto', { nombre: 'Tester', email: 'tester@example.com', mensaje: 'Hola' }],
  ['GET','/api/contacto'],
  ['GET','/api/perfil/existeusuario?email=demo@bisonte.com'],
  // Domain endpoints (user)
  ['GET','/api/perfil', null, 'user'],
  ['POST','/api/perfil', { nombre: 'Nombre Actualizado' }, 'user'],
  ['GET','/api/envios/historial', null, 'user'],
  ['POST','/api/guardarenvio', { origen: 'Bogotá', destino: 'Cali', peso: 1.2 }, 'user'],
  ['GET','/api/envios', null, 'user'],
  ['POST','/api/envios', { origen:'Bogotá', destino:'Medellín', peso:2, largo:10, ancho:10, alto:10, valorDeclarado:50000 }, 'user'],
  ['GET','/api/usuarios', null, 'user'],
  ['GET','/api/remitente', null, 'user'],
  ['POST','/api/remitente', { nombre:'Remit SA' }, 'user'],
  ['GET','/api/destinatario', null, 'user'],
  ['POST','/api/destinatario', { nombre:'Destinatario X' }, 'user'],
  ['GET','/api/protegido/demo', null, 'user'],
  // Admin
  ['GET','/api/admin/stats', null, 'admin'],
  ['GET','/api/admin/users', null, 'admin'],
  ['GET','/api/admin/settings', null, 'admin'],
  ['POST','/api/admin/settings', { setting:'test', value:'value' }, 'admin']
];

function truncate(str, n = 80) {
  if (!str) return '';
  const s = String(str);
  return s.length > n ? s.slice(0, n - 3) + '...' : s;
}

async function short(res) {
  if (!res || typeof res.status !== 'number') return { status: 0, ok: false, msg: 'network error' };
  const status = res.status;
  let txt = '';
  try { txt = await res.text(); } catch {}
  let js;
  try { js = JSON.parse(txt); } catch {}
  return {
    status,
    ok: res.ok,
    msg: js?.message || js?.error || js?.note || js?.status || truncate(txt)
  };
}

async function doFetch(method, url, body, headers = {}) {
  return withTimeout(async (ctrl) => fetchCompat(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: ctrl.signal
  }), 12000).catch(e => ({ status: 0, ok: false, text: async () => e.message }));
}

async function login(email, password) {
  const res = await doFetch('POST', `${BASE}/api/auth/login`, { email, password });
  const dataText = await res.text?.();
  let data;
  try { data = JSON.parse(dataText); } catch { data = {}; }
  return { status: res.status, token: data?.token, role: data?.role, raw: dataText };
}

(async () => {
  console.log(`🧪 Probando ${endpoints.length} endpoints contra: ${BASE}\n`);

  // Acquire tokens
  console.log('🔐 Login user...');
  const userLogin = await login(credsUser.email, credsUser.password);
  console.log(`   status=${userLogin.status} token=${!!userLogin.token}`);

  console.log('🔐 Login admin...');
  const adminLogin = await login(credsAdmin.email, credsAdmin.password);
  console.log(`   status=${adminLogin.status} token=${!!adminLogin.token} role=${adminLogin.role || ''}`);

  const tokenUser = userLogin.token;
  const tokenAdmin = adminLogin.token;

  const results = [];
  let i = 0;
  for (const [method, path, body, access] of endpoints) {
    i += 1;
    process.stdout.write(`\r[${i}/${endpoints.length}] ${method} ${path}    `);

    // No token
    const rNo = await doFetch(method, `${BASE}${path}`, body);
    const noToken = await short(rNo);

    // User token
    let withUser = null;
    if (tokenUser) {
      const rUser = await doFetch(method, `${BASE}${path}`, body, { Authorization: `Bearer ${tokenUser}` });
      withUser = await short(rUser);
    }

    // Admin token
    let withAdmin = null;
    if (tokenAdmin) {
      const rAdmin = await doFetch(method, `${BASE}${path}`, body, { Authorization: `Bearer ${tokenAdmin}` });
      withAdmin = await short(rAdmin);
    }

    // Decide pass criteria
    let pass = false;
    if (access === 'admin') {
      pass = (noToken.status === 401 || noToken.status === 403)
        && (!!withUser && (withUser.status === 401 || withUser.status === 403))
        && (!!withAdmin && withAdmin.ok);
    } else if (access === 'user') {
      pass = (noToken.status === 401 || noToken.status === 403)
        && (!!withUser && withUser.ok);
    } else {
      // public
      pass = noToken.ok;
    }

    results.push({ method, path, access: access || 'public', noToken, withUser, withAdmin, pass });
  }

  console.log('\n');

  // Print table
  const table = results.map(r => ({
    M: r.method,
    Endpoint: truncate(r.path, 32),
    Tipo: r.access.toUpperCase(),
    NoTok: r.noToken.status,
    User: r.withUser ? r.withUser.status : '-',
    Admin: r.withAdmin ? r.withAdmin.status : '-',
    OK: r.pass ? '✅' : '❌'
  }));
  console.table(table);

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const failed = total - passed;
  console.log(`\n📈 Resumen: ${passed}/${total} OK | ${failed} fallas`);

  if (failed > 0) {
    console.log('\n❌ Detalles de fallas:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`\n${r.method} ${r.path} [${r.access}]`);
      console.log(`  - Sin token: ${r.noToken.status} (${r.noToken.msg})`);
      if (r.withUser) console.log(`  - Con usuario: ${r.withUser.status} (${r.withUser.msg})`);
      if (r.withAdmin) console.log(`  - Con admin: ${r.withAdmin.status} (${r.withAdmin.msg})`);
    });
    process.exitCode = 1;
  } else {
    console.log('\n🎉 ¡Todos los endpoints funcionan correctamente!');
  }
})();
