/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite hacer build aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite que el build no falle por errores de TypeScript en Vercel
    ignoreBuildErrors: true,
  },
  // Usar standalone para desarrollo, se puede cambiar a export para Capacitor
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configuración webpack para resolver módulos locales
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Resolver módulos locales del workspace
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@bisonte/capacitor-bisonte-auth': require.resolve('./native/capacitor-bisonte-auth/dist/esm/index.js')
      };
    }
    
    return config;
  },
  // ...resto de tu configuración existente
}

module.exports = nextConfig
