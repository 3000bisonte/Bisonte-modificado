#!/usr/bin/env node
/**
 * Pre-build verification script.
 * Fails fast if critical files or env vars are missing so Vercel error is clearer.
 */
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/context/NotificationContext.js',
  'src/context/ConfirmModalContext.js',
  'src/components/Notification.js',
  'src/components/ConfirmModal.js',
  'src/app/Providers.js'
];

const missing = requiredFiles.filter(f => !fs.existsSync(path.join(process.cwd(), f)));
if (missing.length) {
  console.error('\n[prebuild-verify] ❌ Missing required files:\n' + missing.map(m => ' - ' + m).join('\n'));
  process.exit(1);
}

// Optional: Warn about duplicate legacy frontend dir usage
if (fs.existsSync(path.join(process.cwd(), 'frontend/src/context'))) {
  console.warn('[prebuild-verify] ⚠️ Legacy frontend/src/context directory still present; ensure no stale imports.');
}

console.log('[prebuild-verify] ✅ All critical files present.');
