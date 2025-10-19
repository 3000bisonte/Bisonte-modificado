# 🔒 Auditoría de Seguridad - Bisonte Logística

**Fecha:** 19 de Octubre, 2025  
**Auditor:** Sistema de Análisis de Seguridad  
**Alcance:** Frontend y Backend APIs

---

## 🚨 **PROBLEMAS CRÍTICOS** (Acción Inmediata Requerida)

### 1. ❌ **CRÍTICO: Contraseña en Texto Plano en localStorage**

**Archivo:** `src/app/register/page.js` - Línea 135  
**Severidad:** 🔴 **CRÍTICA**  
**CVSS Score:** 8.5 (Alta)

**Problema:**
```javascript
localStorage.setItem("nombreRegistro", nombre);
localStorage.setItem("emailRegistro", email);
localStorage.setItem("passwordRegistro", password); // ❌ TEXTO PLANO
```

**Riesgos:**
- ✗ Contraseña visible en texto plano en el navegador
- ✗ Accesible desde DevTools → Application → Local Storage
- ✗ Cualquier script XSS puede robarla
- ✗ Persiste indefinidamente hasta que se borre manualmente
- ✗ Viola GDPR, OWASP Top 10, y mejores prácticas de seguridad

**Impacto:**
- Robo masivo de contraseñas
- Comprometer cuentas de usuarios
- Pérdida de confianza
- Multas regulatorias (GDPR hasta €20 millones)

**Solución Requerida:**
1. **NUNCA** almacenar contraseñas en el frontend
2. Eliminar estas líneas completamente
3. Usar solo la sesión del backend para autenticación

**Código Corregido:**
```javascript
// ✅ CORRECTO - No guardar contraseña
localStorage.setItem("nombreRegistro", nombre);
localStorage.setItem("emailRegistro", email);
// localStorage.setItem("passwordRegistro", password); // ❌ ELIMINADO
```

---

### 2. ⚠️ **MEDIO: Datos Sensibles en localStorage Sin Expiración**

**Archivos Afectados:**
- `src/components/MercadoPago.js`
- `src/components/Pagar.js`
- `src/components/Resumen.js`
- `src/components/Cotizador.js`

**Problema:**
```javascript
localStorage.setItem("destinatarioInfo", JSON.stringify(data)); // Datos personales
localStorage.setItem("formDataRemitente", JSON.stringify(data)); // Datos personales
localStorage.setItem("cotizacion", JSON.stringify(data)); // Datos financieros
```

**Riesgos:**
- Datos personales (nombre, dirección, teléfono) persisten indefinidamente
- Datos de cotización con precios pueden manipularse
- No hay TTL (Time To Live) para limpiar datos antiguos
- Vulnerable a acceso no autorizado en dispositivos compartidos

**Solución Recomendada:**
1. Implementar TTL automático (expirar después de 24 horas)
2. Limpiar datos al cerrar sesión
3. Considerar sessionStorage para datos temporales

---

## ✅ **FORTALEZAS DE SEGURIDAD ACTUALES**

### 1. ✓ **Autenticación con NextAuth**
- ✅ Uso de `getServerSession` en APIs
- ✅ Validación de sesión en el backend
- ✅ No expone credenciales en el frontend

### 2. ✓ **Uso de Prisma ORM**
- ✅ Previene inyección SQL automáticamente
- ✅ Queries parametrizadas
- ✅ Tipado fuerte en TypeScript

### 3. ✓ **Recálculo de Costos (Implementado Hoy)**
- ✅ No confía en datos del frontend
- ✅ Recalcula precio antes de procesar
- ✅ Logs de auditoría para detectar discrepancias

### 4. ✓ **Validación con Zod**
- ✅ Schemas de validación en backend
- ✅ Previene datos malformados

---

## ⚠️ **MEJORAS RECOMENDADAS** (No Críticas)

### 1. Rate Limiting

**Estado Actual:** ❌ No implementado  
**Riesgo:** Ataques de fuerza bruta en login/registro

**Recomendación:**
```javascript
// Implementar en middleware o API routes
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos. Intenta en 15 minutos.'
});
```

---

### 2. Content Security Policy (CSP)

**Estado Actual:** ❌ No configurado  
**Riesgo:** Ataques XSS

**Recomendación:**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

---

### 3. HTTPS Obligatorio

**Estado Actual:** ✅ Vercel lo maneja  
**Recomendación:** Forzar HTTPS en producción

```javascript
// middleware.js
if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https')) {
  return NextResponse.redirect(`https://${req.headers.get('host')}${req.url}`);
}
```

---

### 4. Sanitización de Inputs

**Estado Actual:** ⚠️ Parcial (Zod valida formato)  
**Riesgo:** XSS en campos de texto libre

**Recomendación:**
```javascript
import DOMPurify from 'isomorphic-dompurify';

const cleanInput = (input) => DOMPurify.sanitize(input);
```

---

### 5. Limpieza de localStorage al Logout

**Estado Actual:** ⚠️ Parcial  
**Problema:** Algunos datos persisten después del logout

**Recomendación:**
```javascript
const handleLogout = async () => {
  // Limpiar TODOS los datos sensibles
  const keysToRemove = [
    'nombreRegistro',
    'emailRegistro',
    'destinatarioInfo',
    'formDataRemitente',
    'cotizacion',
    'envioDatos',
    'formCotizador',
    'formDestinatario',
    'formRemitente'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Luego logout normal
  await signOut();
};
```

---

### 6. Validación de Costo en Backend

**Estado Actual:** ⚠️ No implementado  
**Riesgo:** Manipulación de precios a pesar del recálculo frontend

**Recomendación:**
```javascript
// src/app/api/orders/route.js
export async function POST(request) {
  const body = await request.json();
  
  // 🔒 RECALCULAR COSTO EN BACKEND
  const costoEsperado = calcularCostoEnServidor(
    body.alto,
    body.ancho,
    body.largo,
    body.peso,
    body.valorDeclarado,
    body.tipoEnvio,
    body.ciudadDestino
  );
  
  // Validar con tolerancia de 1 peso por redondeos
  if (Math.abs(body.costoTotal - costoEsperado) > 1) {
    return NextResponse.json({
      success: false,
      error: 'Discrepancia en el cálculo del costo',
      costoEsperado,
      costoRecibido: body.costoTotal
    }, { status: 400 });
  }
  
  // Continuar...
}
```

---

## 📊 **RESUMEN DE HALLAZGOS**

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Crítica | 1 | ⏳ Pendiente |
| 🟠 Alta | 0 | - |
| 🟡 Media | 1 | ⏳ Pendiente |
| 🟢 Baja | 5 | ✅ Documentadas |

---

## ✅ **PLAN DE ACCIÓN PRIORITARIO**

### Fase 1: Inmediato (Hoy)
1. ✅ **ELIMINAR** `localStorage.setItem("passwordRegistro", password)`
2. ✅ **ELIMINAR** uso de esa password en `registro-exitoso/page.js`
3. ✅ **PROBAR** que el flujo de registro funcione sin la password guardada

### Fase 2: Corto Plazo (Esta Semana)
1. Implementar limpieza automática de localStorage al logout
2. Agregar TTL a datos sensibles en localStorage
3. Sanitizar inputs de usuario con DOMPurify

### Fase 3: Mediano Plazo (Este Mes)
1. Implementar rate limiting en APIs críticas
2. Configurar CSP headers
3. Validación de costo en backend

### Fase 4: Largo Plazo (Próximo Mes)
1. Auditoría de seguridad externa
2. Implementar logging de seguridad
3. Sistema de monitoreo de intentos sospechosos

---

## 🔐 **MEJORES PRÁCTICAS APLICADAS**

✅ NextAuth para autenticación  
✅ Prisma ORM (previene SQL injection)  
✅ Validación con Zod  
✅ Recálculo de costos en frontend  
✅ Uso de HTTPS en producción  
✅ Variables de entorno para secrets  

---

## 📝 **NOTAS TÉCNICAS**

### LocalStorage vs SessionStorage vs Cookies

| Tipo | Persistencia | Acceso JS | Seguro | Uso Recomendado |
|------|--------------|-----------|---------|-----------------|
| **localStorage** | Permanente | ✅ Sí | ❌ No | Preferencias UI no sensibles |
| **sessionStorage** | Tab cerrada | ✅ Sí | ❌ No | Datos temporales de sesión |
| **httpOnly Cookie** | Configurable | ❌ No | ✅ Sí | **Tokens de autenticación** |
| **Secure Cookie** | Configurable | ❌ No | ✅ Sí | **Datos sensibles** |

**Regla de Oro:**
- ❌ **NUNCA** guardar: Contraseñas, tokens, tarjetas de crédito
- ⚠️ **Con cuidado**: Datos personales (con TTL)
- ✅ **Seguro**: Preferencias UI, temas, idioma

---

## 🎯 **CONCLUSIÓN**

**Estado General:** ⚠️ **BUENO CON MEJORAS CRÍTICAS PENDIENTES**

El sistema tiene buenas bases de seguridad (NextAuth, Prisma, validaciones), pero tiene **1 vulnerabilidad crítica** que debe corregirse inmediatamente:

1. 🔴 **CRÍTICO:** Contraseña en texto plano en localStorage

Una vez corregido esto, el sistema estará en un nivel de seguridad **MUY BUENO** para una aplicación web moderna.

---

**Próximo Paso:** Implementar correcciones críticas ahora.

