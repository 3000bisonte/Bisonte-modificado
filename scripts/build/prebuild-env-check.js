// Safe env check: warn on missing keys, do not fail CI builds.
const required = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DATABASE_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn('[prebuild-env-check] Missing env vars (non-blocking):', missing.join(', '));
}
console.log('[prebuild-env-check] Completed.');
