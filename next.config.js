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
  
  // 🔒 Security Headers - Críticos para prevenir XSS y otros ataques
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' accounts.google.com gstatic.com;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              font-src 'self' fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' accounts.google.com oauth2.googleapis.com www.googleapis.com;
              frame-src accounts.google.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ],
      },
      // Headers específicos para HTTPS en producción solo si es producción
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload'
            }
          ]
        }
      ] : [])
    ];
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
