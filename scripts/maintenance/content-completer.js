#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class ContentCompleter {
  constructor() {
    this.completedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
    this.templates = this.getFileTemplates();
  }

  async run() {
    console.log('📝 Iniciando completado de contenido faltante...\n');
    
    // Leer resultados de la auditoría
    await this.completeEmptyFiles();
    await this.completeCommentOnlyFiles();
    await this.completeMinimalFiles();
    
    this.printReport();
  }

  getFileTemplates() {
    return {
      // Environment files
      '.env.example': `# Environment Variables Template
# Copy this file to .env.local and fill with your values

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bisonte_logistica

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Configuration
API_BASE_URL=http://localhost:3000/api

# Development
NODE_ENV=development
`,

      '.env.production': `# Production Environment Variables
# NEVER commit actual production secrets

# Database
DATABASE_URL=\${DATABASE_URL}

# NextAuth Configuration  
NEXTAUTH_URL=\${NEXTAUTH_URL}
NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}

# API Configuration
API_BASE_URL=\${API_BASE_URL}

# Production
NODE_ENV=production
`,

      '.env.mobile': `# Mobile App Environment Variables

# API Endpoints
API_BASE_URL=http://localhost:3000/api
WEB_CLIENT_URL=http://localhost:3000

# OAuth Configuration
GOOGLE_CLIENT_ID=your-mobile-google-client-id

# Development
NODE_ENV=development
DEBUG=true
`,

      // Package.json templates
      'package.json': {
        backend: `{
  "name": "bisonte-logistica-backend",
  "version": "1.0.0",
  "description": "Backend services for Bisonte Logística",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": ["logistics", "backend", "api"],
  "author": "Bisonte Team",
  "license": "MIT"
}`,
        frontend: `{
  "name": "bisonte-logistica-frontend",
  "version": "1.0.0",
  "description": "Frontend application for Bisonte Logística", 
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.0.0"
  },
  "keywords": ["logistics", "frontend", "react", "nextjs"],
  "author": "Bisonte Team",
  "license": "MIT"
}`
      },

      // README templates
      'README.md': `# Bisonte Logística

Sistema de gestión logística integral.

## 🚀 Características

- Gestión de envíos y entregas
- Seguimiento en tiempo real
- Panel administrativo
- Integración con APIs de pago

## 📋 Requisitos

- Node.js 18+
- PostgreSQL
- Git

## 🛠️ Instalación

\`\`\`bash
# Clonar repositorio
git clone [repository-url]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
\`\`\`

## 📚 Documentación

Ver [docs/](./docs/) para documentación completa.

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (\`git checkout -b feature/amazing-feature\`)
3. Commit cambios (\`git commit -m 'Add amazing feature'\`)
4. Push a la rama (\`git push origin feature/amazing-feature\`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.
`,

      'README-RUN.md': `# Guía de Ejecución

## 🚀 Inicio Rápido

### Desarrollo Local

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 3. Iniciar base de datos (si aplica)
npm run db:setup

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Iniciar servidor de desarrollo
npm run dev
\`\`\`

### Producción

\`\`\`bash
# 1. Build de producción
npm run build

# 2. Iniciar servidor
npm start
\`\`\`

## 🔧 Scripts Disponibles

- \`npm run dev\` - Servidor de desarrollo
- \`npm run build\` - Build de producción  
- \`npm start\` - Servidor de producción
- \`npm test\` - Ejecutar tests
- \`npm run lint\` - Linting de código

## 🐛 Solución de Problemas

### Puerto en uso
\`\`\bash
# Cambiar puerto
PORT=3001 npm run dev
\`\`\`

### Problemas de permisos
\`\`\bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules
npm install
\`\`\`

## 📞 Soporte

Para problemas técnicos, crear issue en el repositorio.
`,

      // TypeScript config
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts", 
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}`,

      // Next.js config
      'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;`,

      // Middleware
      'middleware.js': `import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Check if user is authenticated for protected routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check admin role
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // API routes protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/protected/:path*'
  ]
};`
    };
  }

  async completeEmptyFiles() {
    console.log('📝 Completando archivos vacíos...');
    
    const emptyFiles = [
      '.env.example.nextauth',
      '.env.mobile', 
      '.env.production',
      'archive/backend/package.json',
      'archive/frontend/package.json',
      'archive/backend/README.md',
      'archive/frontend/README.md',
      'archive/backend/README-RUN.md',
      'archive/frontend/README-RUN.md',
      'archive/backend/tsconfig.json',
      'archive/frontend/next.config.js',
      'archive/frontend/middleware.js'
    ];

    for (const filePath of emptyFiles) {
      await this.completeFile(filePath);
    }
  }

  async completeCommentOnlyFiles() {
    console.log('📝 Completando archivos con solo comentarios...');
    
    // Archivos identificados en la auditoría
    await this.completeFile('next-env.d.ts');
    await this.completeFile('src/components/ProviderWrapper.js');
  }

  async completeMinimalFiles() {
    console.log('📝 Completando archivos con contenido mínimo...');
    
    const minimalFiles = [
      'src/app/layout.js',
      'src/app/page.js',
      'src/components/AuthProvider.js'
    ];

    for (const filePath of minimalFiles) {
      await this.enhanceMinimalFile(filePath);
    }
  }

  async completeFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      const fileName = path.basename(relativePath);
      const dirName = path.basename(path.dirname(relativePath));
      
      // Check if file exists and is actually empty
      let currentContent = '';
      try {
        currentContent = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.errors.push(`Error reading ${relativePath}: ${error.message}`);
          return;
        }
      }

      // Skip if file has substantial content
      if (currentContent.trim().length > 50) {
        this.skippedFiles.push(`${relativePath} - Already has content`);
        return;
      }

      // Determine content based on file type and location
      let newContent = '';

      if (fileName.startsWith('.env')) {
        if (fileName.includes('production')) {
          newContent = this.templates['.env.production'];
        } else if (fileName.includes('mobile')) {
          newContent = this.templates['.env.mobile'];
        } else {
          newContent = this.templates['.env.example'];
        }
      } else if (fileName === 'package.json') {
        newContent = dirName.includes('backend') || dirName.includes('api') 
          ? this.templates['package.json'].backend 
          : this.templates['package.json'].frontend;
      } else if (fileName === 'README.md') {
        newContent = this.templates['README.md'];
      } else if (fileName === 'README-RUN.md') {
        newContent = this.templates['README-RUN.md'];
      } else if (fileName === 'tsconfig.json') {
        newContent = this.templates['tsconfig.json'];
      } else if (fileName === 'next.config.js') {
        newContent = this.templates['next.config.js'];
      } else if (fileName === 'middleware.js') {
        newContent = this.templates['middleware.js'];
      } else if (fileName === 'next-env.d.ts') {
        newContent = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;
      } else {
        // Generic content based on file extension
        newContent = await this.generateGenericContent(relativePath);
      }

      if (newContent) {
        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        
        // Write content
        await fs.writeFile(fullPath, newContent);
        this.completedFiles.push(`${relativePath} - Added ${newContent.split('\n').length} lines`);
        console.log(`   ✅ Completado: ${relativePath}`);
      } else {
        this.skippedFiles.push(`${relativePath} - No template available`);
        console.log(`   ⏭️ Omitido: ${relativePath} (sin template)`);
      }

    } catch (error) {
      this.errors.push(`Error completing ${relativePath}: ${error.message}`);
      console.log(`   ❌ Error: ${relativePath}`);
    }
  }

  async enhanceMinimalFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      const currentContent = await fs.readFile(fullPath, 'utf-8');
      
      let enhancedContent = '';
      
      if (relativePath.includes('layout.js')) {
        enhancedContent = `import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bisonte Logística',
  description: 'Sistema de gestión logística integral',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}`;
      } else if (relativePath.includes('page.js') && !relativePath.includes('components')) {
        enhancedContent = `'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido a Bisonte Logística
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de gestión logística integral
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Gestión de Envíos</h3>
            <p className="text-gray-600">Administra tus envíos de manera eficiente</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Seguimiento</h3>
            <p className="text-gray-600">Rastrea tus paquetes en tiempo real</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Reportes</h3>
            <p className="text-gray-600">Analiza el rendimiento de tu negocio</p>
          </div>
        </div>
      </div>
    </div>
  );
}`;
      } else if (relativePath.includes('AuthProvider')) {
        enhancedContent = `'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null 
      };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        isLoading: false 
      };
    case 'LOGOUT':
      return { 
        ...initialState, 
        isLoading: false 
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        dispatch({ type: 'SET_USER', payload: session.user });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (response.ok) {
        const user = await response.json();
        dispatch({ type: 'SET_USER', payload: user });
        return { success: true };
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}`;
      }

      if (enhancedContent && enhancedContent !== currentContent) {
        await fs.writeFile(fullPath, enhancedContent);
        this.completedFiles.push(`${relativePath} - Enhanced with ${enhancedContent.split('\n').length} lines`);
        console.log(`   ✅ Mejorado: ${relativePath}`);
      } else {
        this.skippedFiles.push(`${relativePath} - Content already adequate`);
      }

    } catch (error) {
      this.errors.push(`Error enhancing ${relativePath}: ${error.message}`);
      console.log(`   ❌ Error: ${relativePath}`);
    }
  }

  async generateGenericContent(relativePath) {
    const ext = path.extname(relativePath);
    const fileName = path.basename(relativePath, ext);
    
    switch (ext) {
      case '.js':
      case '.jsx':
        return `// ${fileName}
// TODO: Implement ${fileName} functionality

export default function ${fileName}() {
  return (
    <div>
      <h1>${fileName} Component</h1>
      <p>This component needs to be implemented.</p>
    </div>
  );
}`;

      case '.ts':
      case '.tsx':
        return `// ${fileName}
// TODO: Implement ${fileName} functionality

interface ${fileName}Props {
  // Define props here
}

export default function ${fileName}({}: ${fileName}Props) {
  return (
    <div>
      <h1>${fileName} Component</h1>
      <p>This component needs to be implemented.</p>
    </div>
  );
}`;

      case '.css':
        return `/* ${fileName} Styles */

.${fileName.toLowerCase()} {
  /* Add styles here */
}`;

      default:
        return `# ${fileName}

This file needs content. Please implement according to project requirements.

TODO: Add appropriate content for ${relativePath}
`;
    }
  }

  printReport() {
    console.log('\n📊 REPORTE DE COMPLETADO DE CONTENIDO');
    console.log('====================================');
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Archivos completados: ${this.completedFiles.length}`);
    console.log(`   ⏭️ Archivos omitidos: ${this.skippedFiles.length}`);
    console.log(`   ❌ Errores: ${this.errors.length}`);

    if (this.completedFiles.length > 0) {
      console.log(`\n✅ ARCHIVOS COMPLETADOS (${this.completedFiles.length}):`);
      this.completedFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
    }

    if (this.skippedFiles.length > 0) {
      console.log(`\n⏭️ ARCHIVOS OMITIDOS (${this.skippedFiles.length}):`);
      this.skippedFiles.slice(0, 10).forEach(file => {
        console.log(`   • ${file}`);
      });
      if (this.skippedFiles.length > 10) {
        console.log(`   ... y ${this.skippedFiles.length - 10} más`);
      }
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORES (${this.errors.length}):`);
      this.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    console.log(`\n🎯 PRÓXIMOS PASOS:`);
    console.log(`   1. Revisar archivos completados y ajustar según necesidades`);
    console.log(`   2. Instalar dependencias faltantes: npm install`);
    console.log(`   3. Verificar configuración de variables de entorno`);
    console.log(`   4. Ejecutar tests: npm test`);
    console.log(`   5. Iniciar desarrollo: npm run dev`);

    console.log(`\n✨ COMPLETADO DE CONTENIDO FINALIZADO`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const completer = new ContentCompleter();
  completer.run().catch(console.error);
}

module.exports = ContentCompleter;