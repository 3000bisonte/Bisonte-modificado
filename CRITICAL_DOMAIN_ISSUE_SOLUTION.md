# 🚨 PROBLEMA CRÍTICO IDENTIFICADO - Redirección de Dominio

## 📊 Diagnóstico Completado

**Fecha**: $(Get-Date)  
**Estado**: 🔴 **PROBLEMA CRÍTICO ENCONTRADO**

---

## 🎯 PROBLEMA RAÍZ IDENTIFICADO

### **Redirección de Dominio Inconsistente**

**Comportamiento Detectado**:
- Usuario accede a: `https://bisonteapp.com`
- Login redirige a: `https://www.bisonteapp.com`
- Cookies se crean en un dominio diferente
- Sesión no se mantiene debido a la inconsistencia de dominios

**Evidencia**:
```
📍 Redirige a: https://www.bisonteapp.com/api/auth/callback/credentials
```

**Impacto**: 🔴 **CRÍTICO** - Las cookies de NextAuth se crean en `www.bisonteapp.com` pero el usuario navega en `bisonteapp.com`

---

## 🔧 SOLUCIÓN INMEDIATA

### **Opción A: Configurar Redirección Consistente (Recomendado)**

1. **En el proveedor de hosting (Vercel/Netlify)**:
   ```bash
   # Configurar redirección automática
   bisonteapp.com -> www.bisonteapp.com
   ```

2. **Actualizar NEXTAUTH_URL**:
   ```env
   NEXTAUTH_URL=https://www.bisonteapp.com
   ```

### **Opción B: Usar Solo Dominio Sin WWW**

1. **En el proveedor de hosting**:
   ```bash
   # Configurar redirección inversa
   www.bisonteapp.com -> bisonteapp.com
   ```

2. **Mantener NEXTAUTH_URL actual**:
   ```env
   NEXTAUTH_URL=https://bisonteapp.com
   ```

### **Opción C: Configuración de Cookie Multi-Dominio**

En `src/lib/auth.js`, la configuración ya intenta manejar esto:
```javascript
const cookieDomain = (isProd && NEXTAUTH_HOST.endsWith('bisonteapp.com')) ? '.bisonteapp.com' : undefined;
```

**Pero puede necesitar ajustes**:
```javascript
// Forzar dominio principal para todas las cookies
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      domain: '.bisonteapp.com',  // Funciona para www y sin www
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true
    }
  }
}
```

---

## ⚡ ACCIÓN INMEDIATA REQUERIDA

### **Paso 1: Verificar configuración de DNS/Hosting**
```bash
# Verificar que ambos dominios apunten al mismo servidor
nslookup bisonteapp.com
nslookup www.bisonteapp.com
```

### **Paso 2: Implementar redirección consistente**
**En Vercel** (si es el caso):
```json
// vercel.json
{
  "redirects": [
    {
      "source": "https://bisonteapp.com/(.*)",
      "destination": "https://www.bisonteapp.com/$1",
      "permanent": true
    }
  ]
}
```

**En Netlify** (si es el caso):
```
# _redirects
https://bisonteapp.com/* https://www.bisonteapp.com/:splat 301!
```

### **Paso 3: Actualizar variables de entorno**
```env
# Si se elige www como dominio principal
NEXTAUTH_URL=https://www.bisonteapp.com

# Si se elige sin www como dominio principal  
NEXTAUTH_URL=https://bisonteapp.com
```

### **Paso 4: Limpiar cookies existentes**
Los usuarios que ya tengan cookies inconsistentes necesitarán:
1. Borrar cookies del navegador para bisonteapp.com
2. O esperar que expiren naturalmente

---

## 📋 VALIDACIÓN POST-FIX

Después de implementar la solución:

```bash
# Ejecutar debug nuevamente
node scripts/diagnostics/auth/debug-session.js https://bisonteapp.com

# Verificar que:
# 1. NO hay redirects de dominio durante login
# 2. Sesión NO está vacía: {"user": {...}}
# 3. Cookies se establecen correctamente
```

---

## 🚀 RESULTADO ESPERADO

Después del fix:
```
✅ Login response: 200 OK (sin redirect de dominio)
✅ Cookies de sesión establecidas correctamente
✅ Session data: {"user":{"id":"104","email":"test+...","name":"..."}}
```

---

**🕒 Tiempo de implementación**: 15-30 minutos  
**⚡ Prioridad**: CRÍTICA - Bloquea el acceso de todos los usuarios  
**👥 Impacto**: Resuelve problemas de registro, login y recuperación de contraseña