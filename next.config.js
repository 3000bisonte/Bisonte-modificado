/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite hacer build aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  // ...resto de tu configuración existente
}

module.exports = nextConfig
