# 📖 Documentación Técnica - Bisonte Logística

> **Hub central de toda la documentación técnica del proyecto**

## 🗂️ Índice General

### 🏗️ **Arquitectura del Sistema**
- [📋 Arquitectura General](./ARCHITECTURE.md) - Visión general del sistema
- [🏗️ Decisiones Arquitecturales](./architecture/) - Documentos técnicos detallados
- [🔄 Migración y Refactoring](./architecture/FASE_1_MIGRACION_COMPLETADA.md)

### 🚀 **Deployment y DevOps**  
- [📦 Guías de Deploy](./deployment/) - Vercel, Netlify, Android
- [🔧 Configuración de CI/CD](./deployment/) - Pipelines y automatización
- [🌍 Environments](./deployment/) - Staging, production, development

### 📱 **Desarrollo Móvil**
- [🤖 Android Setup](./mobile/) - Configuración y desarrollo Android
- [🔌 Capacitor Plugins](./mobile/) - Plugins nativos personalizados  
- [🔐 Autenticación Nativa](./mobile/) - Google Sign-In y OAuth

### 🛡️ **Seguridad**
- [🔒 Implementaciones de Seguridad](./security/) - CSP, Rate Limiting, Validation
- [🔍 Auditorías de Seguridad](./security/) - Reportes y análisis
- [📊 Monitoreo](./security/) - Logging y métricas de seguridad

### 📚 **API y Integraciones**
- [🌐 Documentación API](./api/) - Endpoints y especificaciones
- [🔗 Integraciones](./integrations/) - Servicios externos y webhooks
- [📋 Especificaciones Técnicas](./api/) - Contratos y esquemas

### 📝 **Guías y Procesos**
- [🔧 Flujos de Trabajo](./guides/) - Procesos de desarrollo
- [🚀 Getting Started](../README.md) - Guía rápida de inicio
- [🤝 Contribución](./guides/) - Cómo contribuir al proyecto

---

## 🎯 **Documentos Destacados**

### **Para Desarrolladores Nuevos**
1. 📖 [README Principal](../README.md) - Empezar aquí
2. 🏗️ [Arquitectura del Sistema](./ARCHITECTURE.md)
3. ⚡ [Quick Start Guide](./guides/)

### **Para Desarrollo Móvil**
1. 📱 [Setup Android](./mobile/ANDROID_CUSTOM_TABS_GOOGLE_SIGNIN.md)
2. 🔌 [Plugin Nativo](./mobile/CAPACITOR_PLUGIN_BISONTE_AUTH_CCT.md)
3. 🔐 [Google Sign-In](./mobile/NATIVE_GOOGLE_SIGNIN.md)

### **Para DevOps**
1. 🚀 [Deploy Vercel](./deployment/INSTRUCCIONES_DEPLOY_VERCEL_COMPLETA.md)
2. 🌐 [Deploy Netlify](./deployment/INTEGRACION-NETLIFY.md)  
3. 📦 [Build Android](./mobile/)

### **Para Seguridad**
1. 🔒 [Implementación Completa](./security/SECURITY_IMPLEMENTATION_COMPLETE.md)
2. 🔍 [Auditoría de Seguridad](./security/SECURITY_AUDIT_COMPLETE.md)
3. 📊 [Monitoreo](./security/)

---

## 📋 **Estructura de Carpetas**

```
docs/
├── 📖 README.md                    # Este archivo índice
├── 🏗️ ARCHITECTURE.md              # Arquitectura general
│
├── 📂 architecture/                # Diseño y decisiones técnicas
│   ├── NEXTAUTH_*.md              # Configuración de autenticación
│   ├── GOOGLE_AUTH_*.md           # Integración Google OAuth
│   ├── SECURITY_*.md              # Implementaciones de seguridad
│   └── FASE_1_MIGRACION_*.md      # Documentos de migración
│
├── 📂 deployment/                  # Guías de deploy
│   ├── DEPLOY_*.md                # Procesos de deployment
│   ├── INSTRUCCIONES_*.md         # Instrucciones detalladas
│   └── PRODUCTION_*.md            # Configuración de producción
│
├── 📂 mobile/                      # Desarrollo móvil
│   ├── ANDROID_*.md               # Configuración Android
│   ├── CAPACITOR_*.md             # Plugins de Capacitor
│   ├── NATIVE_*.md                # Integraciones nativas
│   └── ADMOB_*.md                 # Configuración de AdMob
│
├── 📂 security/                    # Documentación de seguridad
│   ├── SECURITY_AUDIT_*.md        # Auditorías realizadas
│   └── SECURITY_IMPLEMENTATION_*.md # Implementaciones
│
├── 📂 api/                        # Documentación técnica API
│   ├── ENVIRONMENT_*.md           # Configuración de entornos
│   ├── MIGRATION_*.md             # Migraciones de datos
│   └── URL_MIGRATION_*.md         # Migraciones de URLs
│
├── 📂 integrations/               # Integraciones externas
│   └── [Futuras integraciones]
│
└── 📂 guides/                     # Guías y procesos
    ├── LOGIN_*.md                 # Guías de login
    └── [Futuras guías]
```

---

## 🔄 **Mantenimiento de la Documentación**

### **Convenciones de Nombres**
- `ARCHITECTURE_*.md` - Documentos de arquitectura
- `DEPLOY_*.md` - Documentos de deployment  
- `SECURITY_*.md` - Documentos de seguridad
- `MOBILE_*.md` - Documentos móviles
- `API_*.md` - Documentación de API

### **Actualización de Documentos**
1. Mantener este índice actualizado
2. Usar formato Markdown consistente
3. Incluir emojis para mejor navegación
4. Enlaces relativos para portabilidad

### **Revisión Periódica**
- ✅ Mensual: Verificar enlaces rotos
- ✅ Trimestral: Actualizar documentos obsoletos  
- ✅ Semestral: Reorganizar si es necesario

---

*Documentación generada automáticamente - Última actualización: 24/09/2025*