# 🚨 Guía de Resolución - Problemas de Autenticación en Producción

## Síntomas Reportados y Soluciones

### 🔴 PROBLEMA 1: Registro exitoso pero redirección falla
**Síntoma:** "El usuario completa el formulario, el sistema dice que redirigirá a home, pero se queda en login"

#### ✅ Soluciones paso a paso:

1. **Verificar flujo de auto-login** en `/registro-exitoso`:
   ```bash
   # Revisar logs de NextAuth
   DEBUG=1 npm run diagnostics:auth
   ```

2. **Confirmar credenciales en localStorage**:
   - Abrir DevTools → Application → Local Storage
   - Verificar que existen: `nombreRegistro`, `emailRegistro`, `passwordRegistro`

3. **Revisar configuración de NextAuth**:
   ```javascript
   // En src/lib/auth.js - verificar callback
   async signIn({ user, account, profile }) {
     // Debe retornar true para login exitoso
     return true;
   }
   ```

4. **Comprobar variables de entorno**:
   ```bash
   echo $NEXTAUTH_URL  # Debe coincidir exactamente con dominio
   echo $NEXTAUTH_SECRET  # No debe estar vacío
   ```

### 🔴 PROBLEMA 2: "Usuario o contraseña incorrectos" después de registro
**Síntoma:** "Al intentar ingresar con credenciales recién registradas, error de credenciales inválidas"

#### ✅ Soluciones paso a paso:

1. **Verificar hashing de contraseñas**:
   ```sql
   -- Conectar a la base de datos y verificar
   SELECT email, password IS NOT NULL as has_password, LENGTH(password) as password_length 
   FROM usuarios 
   WHERE email = 'tu-email-de-prueba@example.com';
   ```

2. **Comprobar normalización de emails**:
   ```javascript
   // Debe ser consistente en registro y login
   const normalizedEmail = email.toLowerCase().trim();
   ```

3. **Verificar función de comparación**:
   ```javascript
   // En src/lib/auth.js authorize()
   const isValidPassword = await verifyPassword(credentials.password, user.password);
   ```

4. **Debug específico - Crear usuario de prueba**:
   ```bash
   # Ejecutar script de diagnóstico específico
   PRODUCTION_URL="https://tu-dominio.com" npm run diagnostics:production
   ```

### 🔴 PROBLEMA 3: Correos de recuperación no llegan
**Síntoma:** "Al hacer clic en 'Olvidé mi contraseña', dice que enviará correo pero nunca llega"

#### ✅ Soluciones paso a paso:

1. **Verificar configuración de Resend**:
   ```bash
   # Comprobar variables
   echo $RESEND_API_KEY
   echo $EMAIL_FROM
   ```

2. **Probar API de Resend directamente**:
   ```javascript
   // Test manual en consola del navegador o Postman
   fetch('/api/auth/password/request', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'tu-email@example.com' })
   })
   ```

3. **Revisar logs del servidor**:
   - Vercel: Dashboard → Functions → View Logs
   - Local: `console.log` en `src/lib/email.js`

4. **Verificar dominio en Resend**:
   - Ir al dashboard de Resend
   - Confirmar que `EMAIL_FROM` está verificado
   - Revisar bounce rate y reputación

## 🔧 Scripts de Diagnóstico

### Análisis Completo Local
```bash
npm run diagnostics:analyze
```

### Test de Producción
```bash
PRODUCTION_URL="https://bisonteapp.com" npm run diagnostics:production
```

### Test de Autenticación en Vivo
```bash
BASE_URL="https://bisonteapp.com" npm run diagnostics:auth
```

## 🔍 Checklist de Verificación Rápida

### Variables de Entorno en Producción
- [ ] `NEXTAUTH_URL` = URL exacta del dominio (sin trailing slash)
- [ ] `NEXTAUTH_SECRET` = String único de 32+ caracteres
- [ ] `DATABASE_URL` = Conexión válida a base de datos
- [ ] `RESEND_API_KEY` = API key activa de Resend
- [ ] `EMAIL_FROM` = Email verificado en Resend

### Base de Datos
- [ ] Tabla `usuarios` existe con campos: `email`, `password`, `nombre`
- [ ] Tabla `passwordReset` existe para recuperación
- [ ] Conexión a base de datos funciona desde el servidor

### Código
- [ ] `bcrypt.hash()` se usa en registro (src/lib/userManager.js)
- [ ] `bcrypt.compare()` se usa en login (src/lib/auth.js)
- [ ] Emails se normalizan con `.toLowerCase().trim()`
- [ ] NextAuth retorna `true` en callback de signIn

## 🚀 Comandos de Emergencia

### Regenerar Cliente Prisma
```bash
npx prisma generate
npx prisma db push
```

### Verificar Build
```bash
npm run build
npm run start
```

### Limpiar Caché
```bash
rm -rf .next
npm run build
```

## 📞 Depuración Avanzada

### 1. Activar Logs de NextAuth
```javascript
// En src/lib/auth.js
export const authOptions = {
  debug: process.env.NODE_ENV === "development",
  // ... resto de config
}
```

### 2. Logs de Prisma
```javascript
// En src/lib/prisma.js
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

### 3. Test Manual de Endpoints
```bash
# Test registro
curl -X POST https://bisonteapp.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","nombre":"Test User"}'

# Test recuperación
curl -X POST https://bisonteapp.com/api/auth/password/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

**💡 Tip:** Siempre probar en desarrollo primero, luego en producción. Los problemas suelen ser de configuración de entorno más que de código.