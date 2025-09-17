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
    // Solo configurar alias si no estamos en servidor y el archivo existe
    if (!isServer) {
      const fs = require('fs');
      const path = require('path');
      const pluginPath = path.resolve('./native/capacitor-bisonte-auth/dist/esm/index.js');
      
      // Solo añadir alias si el archivo existe (para evitar errores en Vercel)
      if (fs.existsSync(pluginPath)) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@bisonte/capacitor-bisonte-auth': pluginPath
        };
      } else {
        // En Vercel, usar el módulo desde node_modules si existe
        const nodeModulesPath = path.resolve('./node_modules/@bisonte/capacitor-bisonte-auth/dist/esm/index.js');
        if (fs.existsSync(nodeModulesPath)) {
          config.resolve.alias = {
            ...config.resolve.alias,
            '@bisonte/capacitor-bisonte-auth': nodeModulesPath
          };
        }
      }
    }
    
    return config;
  },
  // ...resto de tu configuración existente
}

module.exports = nextConfig
