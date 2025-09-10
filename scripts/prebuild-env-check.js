#!/usr/bin/env node
// Forces env validation during CI/build. Any missing or invalid var will fail the build with a readable message.
const path = require('path')
const { pathToFileURL } = require('url')

try {
  // Transpile TS on-the-fly using esbuild-register for speed and zero config
  require('esbuild-register/dist/node').register({ target: 'es2020' })
  require(path.join(process.cwd(), 'src', 'lib', 'env.ts'))
  console.log('[prebuild-env-check] ✅ Environment looks valid.')
} catch (err) {
  console.error('\n[prebuild-env-check] ❌ Environment validation failed.')
  console.error(err?.message || err)
  process.exit(1)
}
