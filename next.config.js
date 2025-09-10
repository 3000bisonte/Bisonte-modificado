/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite hacer build aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  // Generate a Node server build (avoid static export)
  output: 'standalone',
  // ...resto de tu configuración existente
}

module.exports = nextConfig
