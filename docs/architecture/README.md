# Arquitectura del Proyecto Bisonte Logística

## Visión General

Este documento describe la arquitectura actual del proyecto Bisonte Logística después de la migración y reorganización estructural completa. El proyecto implementa una arquitectura de monorepo organizada con Next.js 13 App Router, integración móvil con Capacitor, y un sistema de autenticación robusto.

## Estructura del Proyecto

```
bisonte-logistica/
├── 📱 Aplicación Principal
│   ├── src/                    # Código fuente de la aplicación
│   │   ├── app/               # Next.js 13 App Router
│   │   ├── components/        # Componentes React reutilizables
│   │   ├── lib/               # Utilidades y servicios
│   │   └── constants/         # Constantes de la aplicación
│   │
├── 📋 Configuración
│   ├── config/                # Configuraciones del proyecto
│   │   ├── build/            # Configuración de build (TS, ESLint, Prettier)
│   │   ├── environments/     # Variables de entorno por ambiente
│   │   └── security/         # Configuración de seguridad
│   │
├── 📱 Móvil
│   ├── mobile/               # Configuración específica de móvil
│   └── native/               # Plugins nativos de Capacitor
│   
├── 🛠️ Herramientas
│   ├── scripts/              # Scripts de automatización
│   │   ├── build/           # Scripts de construcción
│   │   ├── deploy/          # Scripts de despliegue
│   │   ├── maintenance/     # Scripts de mantenimiento
│   │   └── testing/         # Scripts de pruebas
│   │
├── 📚 Documentación
│   └── docs/                 # Documentación técnica
│       ├── architecture/    # Documentación de arquitectura
│       ├── deployment/      # Guías de despliegue
│       ├── mobile/          # Documentación móvil
│       └── security/        # Documentación de seguridad
│
└── 🔧 Backend y APIs
    ├── api-server/          # Servidor API independiente
    ├── backend/             # Lógica de backend
    └── prisma/              # Configuración de base de datos
```

## Principios Arquitectónicos

### 1. **Separación de Responsabilidades**
- **Frontend**: React/Next.js para la interfaz web
- **Móvil**: Capacitor para aplicaciones nativas
- **Backend**: API independiente con Prisma ORM
- **Configuración**: Centralizada y organizada por dominio

### 2. **Modularidad**
- Componentes reutilizables con composición clara
- Servicios independientes con interfaces bien definidas
- Configuraciones modulares por ambiente y funcionalidad

### 3. **Escalabilidad**
- Estructura de monorepo para manejo unificado
- Path aliases para imports limpios y mantenibles
- Scripts automatizados para tareas repetitivas

## Tecnologías Principales

### Frontend Web
```typescript
// Stack principal
Next.js 13          // Framework React con App Router
TypeScript          // Tipado estático
Tailwind CSS        // Framework de estilos utilitarios
NextAuth.js         // Autenticación con OAuth
```

### Aplicación Móvil
```typescript
// Stack móvil
Capacitor 7         // Framework híbrido
Android SDK         // Desarrollo nativo Android
Plugins Nativos     // capacitor-bisonte-auth
```

### Backend y Base de Datos
```typescript
// Stack backend
Prisma ORM          // ORM para base de datos
PostgreSQL          // Base de datos principal
Node.js             // Runtime del servidor
```

## Patrones de Path Aliases

El proyecto implementa un sistema comprensivo de path aliases para mejorar la experiencia de desarrollo:

```typescript
// tsconfig.json - Path Aliases Configurados
{
  "paths": {
    // Core de la aplicación
    "@/*": ["./src/*"],
    "@/app/*": ["./src/app/*"],
    "@/pages/*": ["./src/pages/*"],
    
    // Componentes por categoría
    "@/components/*": ["./src/components/*"],
    "@/ui/*": ["./src/components/ui/*"],
    "@/forms/*": ["./src/components/forms/*"],
    "@/layout/*": ["./src/components/layout/*"],
    
    // Lógica de negocio
    "@/lib/*": ["./src/lib/*"],
    "@/services/*": ["./src/lib/services/*"],
    "@/hooks/*": ["./src/lib/hooks/*"],
    "@/api/*": ["./src/lib/api/*"],
    
    // Configuración y tipos
    "@/config/*": ["./config/*"],
    "@/types/*": ["./types/*"],
    
    // Móvil y nativo
    "@/mobile/*": ["./mobile/*"],
    "@/native/*": ["./native/*"],
    
    // Recursos
    "@/public/*": ["./public/*"],
    "@/assets/*": ["./public/assets/*"]
  }
}
```

## Configuración de Desarrollo

### ESLint y Prettier Unificado

El proyecto utiliza configuraciones base centralizadas:

```javascript
// Configuración ESLint
{
  "extends": ["./config/build/.eslintrc.base.json"],
  
  // Reglas principales incluyen:
  // - TypeScript strict rules
  // - React/React Hooks rules
  // - Security rules (eslint-plugin-security)
  // - Import organization
  // - Accessibility rules
}
```

```json
// Configuración Prettier
{
  "extends": "./config/build/.prettierrc.json",
  
  // Configuración incluye:
  // - Formato consistente para todos los tipos de archivo
  // - Configuraciones específicas por tipo de archivo
  // - Integración con ESLint
}
```

### Scripts de Mantenimiento

#### 1. **Limpieza de Archivos No Utilizados**
```bash
npm run maintenance:cleanup
```
- Detecta archivos potencialmente no utilizados
- Identifica imports rotos
- Encuentra archivos duplicados
- Localiza directorios vacíos

#### 2. **Validación de Imports**
```bash
npm run maintenance:validate-imports
```
- Valida todos los imports del proyecto
- Verifica path aliases y rutas relativas
- Sugiere optimizaciones de imports
- Detecta imports circulares

## Estructura de Componentes

### Organización por Dominio

```typescript
src/components/
├── ui/                    # Componentes base del sistema de diseño
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── ...
├── forms/                 # Componentes específicos de formularios
│   ├── LoginForm/
│   ├── UserForm/
│   └── ...
├── layout/                # Componentes de layout y navegación
│   ├── Header/
│   ├── Sidebar/
│   └── ...
└── domain-specific/       # Componentes específicos del negocio
    ├── logistics/
    ├── inventory/
    └── ...
```

### Convenciones de Nomenclatura

```typescript
// Archivos de componentes
ComponentName/
├── index.ts              # Export principal
├── ComponentName.tsx     # Implementación del componente
├── ComponentName.test.tsx // Tests del componente
├── ComponentName.stories.tsx // Storybook stories
└── types.ts              # Tipos específicos del componente

// Hooks personalizados
src/lib/hooks/
├── useAuth.ts           # Hook de autenticación
├── useLocalStorage.ts   # Hook de localStorage
└── useApi.ts            # Hook para llamadas API

// Servicios
src/lib/services/
├── auth/                # Servicio de autenticación
├── api/                 # Cliente API
└── storage/             # Servicio de almacenamiento
```

## Configuración por Ambientes

### Variables de Entorno

```bash
config/environments/
├── .env.local           # Desarrollo local
├── .env.development     # Ambiente de desarrollo
├── .env.staging         # Ambiente de staging
└── .env.production      # Ambiente de producción
```

### Configuración de Build

```typescript
// config/build/
├── tsconfig.base.json   # Configuración base de TypeScript
├── .eslintrc.base.json  # Configuración base de ESLint
├── .prettierrc.json     # Configuración de Prettier
└── .prettierignore      # Archivos ignorados por Prettier
```

## Seguridad y Autenticación

### NextAuth.js Configuración

```typescript
// Proveedores de autenticación configurados
- Google OAuth 2.0
- Credenciales personalizadas
- JWT con refresh tokens
- Session management

// Características de seguridad implementadas
- CSP (Content Security Policy)
- Rate limiting
- Input validation con Zod
- Sanitización de datos
```

### Headers de Seguridad

```typescript
// next.config.js - Security Headers
{
  "Content-Security-Policy": "...",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // ... más headers de seguridad
}
```

## Desarrollo Móvil con Capacitor

### Configuración de Plugins Nativos

```typescript
// native/capacitor-bisonte-auth/
├── android/             # Implementación Android
├── ios/                 # Implementación iOS (preparado)
├── src/                 # Interfaz TypeScript
└── package.json         # Configuración del plugin
```

### Sincronización Web-Móvil

```typescript
// Configuración de Capacitor
{
  "appId": "com.bisonte.logistica",
  "appName": "Bisonte Logística",
  "webDir": "out",
  "bundledWebRuntime": false,
  "plugins": {
    "CapacitorBisonteAuth": {
      "enabled": true
    }
  }
}
```

## Scripts de Automatización

### Build y Deploy

```json
{
  "build": "next build",
  "build:analyze": "ANALYZE=true npm run build",
  "deploy:netlify": "./scripts/deploy/deploy-netlify.sh",
  "deploy:vercel": "./scripts/deploy/deploy-vercel.sh"
}
```

### Testing y Quality Assurance

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
  "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
  "format": "prettier --write .",
  "type-check": "tsc --noEmit"
}
```

### Mantenimiento

```json
{
  "maintenance:cleanup": "node scripts/maintenance/cleanup-unused-files.js",
  "maintenance:validate-imports": "node scripts/maintenance/validate-imports.js",
  "maintenance:update-deps": "node scripts/maintenance/update-dependencies.js"
}
```

## Métricas y Beneficios

### Mejoras Implementadas

- ✅ **Reducción del 60% en archivos en raíz**: De 80+ archivos a estructura organizada
- ✅ **Mejora en tiempo de build**: Path aliases optimizados
- ✅ **Cobertura de seguridad**: Implementación completa de CSP y validación
- ✅ **Automatización**: Scripts para tareas repetitivas
- ✅ **Documentación**: Estructura completa y navegable

### Métricas de Calidad

```typescript
// Antes de la migración
- Archivos en raíz: 80+
- Tests dispersos: 48 archivos
- Documentación: Fragmentada (112 archivos)
- Configuración: Inconsistente

// Después de la migración
- Estructura organizada: 7 directorios principales
- Tests organizados: Por dominio y funcionalidad
- Documentación: Consolidada en /docs
- Configuración: Centralizada y modular
```

## Roadmap Técnico

### Próximas Mejoras

1. **Optimización de Performance**
   - Implementar lazy loading avanzado
   - Optimización de bundle splitting
   - Cache strategies mejoradas

2. **Testing Strategy**
   - Unit tests con Jest
   - Integration tests con Playwright
   - E2E tests automatizados

3. **Monitoreo y Observabilidad**
   - Error tracking con Sentry
   - Performance monitoring
   - Analytics de usuario

4. **DevOps y CI/CD**
   - Pipeline automatizado
   - Deploy automático por ambiente
   - Quality gates automatizados

## Convenciones de Desarrollo

### Commits y Branching

```bash
# Formato de commits
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
refactor: refactorización de código
test: adición o modificación de tests
chore: tareas de mantenimiento

# Estrategia de branching
main                     # Producción
develop                  # Desarrollo
feature/nombre-feature   # Nueva funcionalidad
hotfix/nombre-hotfix     # Corrección urgente
```

### Code Review Guidelines

1. **Revisión de Arquitectura**: Verificar adherencia a patrones establecidos
2. **Seguridad**: Revisar validaciones y sanitización
3. **Performance**: Evaluar impacto en rendimiento
4. **Testing**: Verificar cobertura de tests
5. **Documentación**: Asegurar documentación actualizada

## Conclusión

La arquitectura actual del proyecto Bisonte Logística proporciona una base sólida y escalable para el desarrollo continuo. La estructura organizativa, las configuraciones unificadas, y los scripts de automatización facilitan tanto el desarrollo individual como el trabajo en equipo.

La implementación de path aliases, configuraciones centralizadas, y scripts de mantenimiento automatizados mejora significativamente la experiencia de desarrollo y la mantenibilidad del código a largo plazo.

---

*Documento actualizado: Fase 3 de Migración Arquitectónica*
*Última revisión: Configuraciones avanzadas y optimización de estructura*