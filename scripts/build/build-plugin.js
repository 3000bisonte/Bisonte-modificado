// Build native plugin only if present; never fail CI.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pluginDir = path.join(process.cwd(), 'native', 'capacitor-bisonte-auth');
if (!fs.existsSync(pluginDir)) {
  console.log('[build-plugin] Plugin directory not found, skipping.');
  process.exit(0);
}

console.log('[build-plugin] Building native plugin...');
const res = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
  cwd: pluginDir,
  stdio: 'inherit'
});

if (res.status !== 0) {
  console.warn('[build-plugin] Build failed (non-blocking in CI), continuing.');
  process.exit(0);
}
console.log('[build-plugin] Done.');
