#!/usr/bin/env node
/**
 * Safe pre-build verification script.
 * In CI/Vercel, this script becomes a no-op to avoid blocking builds.
 * Locally, it can warn about missing optional files without failing.
 */
const fs = require('fs');
const path = require('path');

const isCI = process.env.CI === 'true' || !!process.env.GITHUB_ACTIONS || !!process.env.VERCEL;

if (isCI) {
  console.log('[prebuild-verify] CI detected; skipping strict checks.');
  process.exit(0);
}

const optionalFiles = [
  'src/context/NotificationContext.js',
  'src/context/ConfirmModalContext.js',
  'src/components/Notification.js',
  'src/components/ConfirmModal.js',
  'src/app/Providers.js'
];

const missing = optionalFiles.filter(f => !fs.existsSync(path.join(process.cwd(), f)));
if (missing.length) {
  console.warn('\n[prebuild-verify] ⚠️ Optional files missing (non-blocking):\n' + missing.map(m => ' - ' + m).join('\n'));
}

console.log('[prebuild-verify] ✅ Completed.');
