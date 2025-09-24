# 🔧 Configuraciones de Build - Guía de Referencia

> **Documentación completa de todas las configuraciones de build del proyecto**

## 📁 Estructura de Configuraciones

```
config/
├── 🏗️ build/                    # Configuraciones de construcción
│   ├── tsconfig.json            # TypeScript base
│   ├── jsconfig.json            # JavaScript fallback
│   ├── .eslintrc.json           # Linting rules
│   ├── postcss.config.js        # PostCSS & Tailwind
│   └── tailwind.config.js       # Tailwind CSS
│
├── 🌍 environments/             # Configuraciones por entorno
│   ├── vercel.json              # Vercel deployment
│   ├── netlify.toml             # Netlify functions
│   ├── PARA_VERCEL_*.json       # Configuraciones específicas
│   └── VERCEL_ENV_VARIABLES_*   # Variables de entorno
│
└── 🛡️ security/                # Configuraciones de seguridad
    └── [Futuras configuraciones de seguridad]
```

---

## 🏗️ **Build Configurations**

### **tsconfig.json (Base)**
**Ubicación:** `config/build/tsconfig.json`  
**Propósito:** Configuración base de TypeScript para todo el proyecto  
**Extiende:** N/A (Configuración base)  
**Usado por:** Proyecto principal, plugins, scripts

**Características principales:**
- Target ES2020 para compatibilidad moderna
- Strict mode deshabilitado para migración gradual  
- Path mapping para imports organizados
- Exclusión de archivos de build y legacy

### **tsconfig.json (Root)**  
**Ubicación:** `./tsconfig.json`  
**Propósito:** Configuración específica del proyecto principal  
**Extiende:** `config/build/tsconfig.json`  
**Usado por:** Next.js, IDE, herramientas de desarrollo

**Path Aliases configurados:**
```json
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/app/*": ["./src/app/*"],
  "@/config/*": ["./config/*"],
  "@/types/*": ["./types/*"],
  "@/mobile/*": ["./mobile/*"],
  "@/native/*": ["./native/*"]
}
```

### **jsconfig.json**
**Ubicación:** `config/build/jsconfig.json`  
**Propósito:** Configuración JavaScript para archivos no-TypeScript  
**Usado por:** Scripts JS, archivos de configuración

### **.eslintrc.json**
**Ubicación:** `config/build/.eslintrc.json`  
**Propósito:** Rules de linting para código consistente  
**Usado por:** ESLint, IDEs, CI/CD

### **postcss.config.js**
**Ubicación:** `config/build/postcss.config.js`  
**Propósito:** Configuración de PostCSS y Tailwind CSS  
**Usado por:** Next.js build system

### **tailwind.config.js**
**Ubicación:** `config/build/tailwind.config.js`  
**Propósito:** Configuración de Tailwind CSS y design system  
**Usado por:** PostCSS, build system

---

## 🌍 **Environment Configurations**

### **vercel.json**
**Ubicación:** `config/environments/vercel.json`  
**Propósito:** Configuración de deployment para Vercel  
**Características:**
- Routing rules
- Headers de seguridad
- Build configuration
- Environment variables

### **netlify.toml**
**Ubicación:** `config/environments/netlify.toml`  
**Propósito:** Configuración para Netlify Functions  
**Características:**
- Build settings
- Function configurations  
- Redirect rules
- Headers

### **PARA_VERCEL_package.json**
**Ubicación:** `config/environments/PARA_VERCEL_package.json`  
**Propósito:** package.json específico para deployment Vercel  
**Cuándo usar:** Deployments que requieren configuración específica

### **PARA_VERCEL_vercel.json**  
**Ubicación:** `config/environments/PARA_VERCEL_vercel.json`  
**Propósito:** vercel.json alternativo para casos específicos  
**Cuándo usar:** Configuraciones de deployment especiales

---

## 📋 **Jerarquía de Configuraciones**

### **TypeScript Hierarchy**
```
Root tsconfig.json
├── extends: config/build/tsconfig.json (Base configuration)
├── overrides: Path aliases específicos del proyecto
└── includes: Archivos específicos del workspace
```

### **ESLint Configuration Chain**
```
.eslintrc.json (config/build/)
├── Base rules para todo el proyecto
├── Next.js specific rules
└── TypeScript integration
```

### **Build Configuration Flow**
```
Next.js Build
├── tsconfig.json (root) → TypeScript compilation
├── postcss.config.js → CSS processing  
├── tailwind.config.js → Utility classes
└── .eslintrc.json → Code quality
```

---

## 🔧 **Uso y Modificación**

### **Modificar Configuraciones Base**
```bash
# Editar configuración TypeScript base
code config/build/tsconfig.json

# Editar configuración de Tailwind
code config/build/tailwind.config.js

# Editar reglas de ESLint
code config/build/.eslintrc.json
```

### **Agregar Path Aliases**
1. Editar `tsconfig.json` (root)
2. Agregar nuevo path en `compilerOptions.paths`
3. Reiniciar TypeScript server en IDE

Ejemplo:
```json
{
  "@/new-folder/*": ["./src/new-folder/*"]
}
```

### **Configurar Nuevo Entorno**
1. Crear archivo en `config/environments/`
2. Documentar propósito y uso
3. Actualizar scripts de deploy si es necesario

---

## 🚨 **Troubleshooting**

### **Problemas Comunes**

#### **Path Aliases no funcionan**
```bash
# Solución 1: Reiniciar TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Solución 2: Verificar configuración
cat tsconfig.json | grep -A 10 "paths"

# Solución 3: Limpiar cache
rm -rf .next && npm run build
```

#### **ESLint no encuentra reglas**
```bash
# Verificar configuración
npx eslint --print-config src/app/page.tsx

# Reinstalar dependencias
npm install --save-dev eslint @next/eslint-config-next
```

#### **Build falla por configuración**
```bash
# Verificar configuración
npm run build -- --debug

# Validar tsconfig
npx tsc --noEmit

# Verificar sintaxis de configs
node -c config/build/postcss.config.js
```

---

## 🔄 **Migración y Updates**

### **Actualizar Configuraciones**
1. Backup configuraciones actuales
2. Aplicar cambios gradualmente
3. Testar build después de cada cambio
4. Documentar cambios realizados

### **Sincronizar con Dependencias**  
```bash
# Verificar compatibilidad
npm outdated

# Actualizar dependencias de build
npm update @next/eslint-config-next typescript tailwindcss

# Verificar configuraciones después de updates
npm run build
```

---

## 📊 **Métricas y Monitoreo**

### **Build Performance**
- **TypeScript compilation time**
- **Bundle size analysis**
- **CSS optimization results**
- **Linting execution time**

### **Configuration Health**
- **Unused path aliases**
- **Deprecated configuration options**
- **Security rule updates needed**
- **Performance optimization opportunities**

---

*Documentación de configuraciones - Última actualización: 24/09/2025*