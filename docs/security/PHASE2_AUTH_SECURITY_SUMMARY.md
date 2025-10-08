# Fase 2: Auditoría y refactorización de autenticación y seguridad

> Completado el 6 de octubre de 2025

## Resumen ejecutivo

Se migró y tipificó estrictamente la capa de autenticación crítica del proyecto, garantizando type-safety en los puentes nativos y módulos de seguridad. Se documentó el flujo completo Google/Capacitor y se validó la integridad de las migraciones Prisma relacionadas con recuperación de contraseñas.

---

## 1. Migración TypeScript de módulos críticos

### 1.1 `src/lib/nativeBridge.ts` ✅

**Antes:** JavaScript con JSDoc (`nativeBridge.js`)  
**Ahora:** TypeScript con interfaces explícitas

**Mejoras implementadas:**
- Interfaces tipadas para plugins Capacitor (`BisonteAuthPlugin`, `FirebaseAuthenticationPlugin`, `GoogleAuthPlugin`)
- Validación de tokens JWT mediante guardas de tipo (`isJwtToken`)
- Helpers seguros para extraer tokens de payloads heterogéneos
- Manejo robusto de `postMessage` con tipos específicos para ReactNativeWebView, iOS WebKit y Capacitor
- Integración con contrato `BisonteAuthPlugin` definido en `src/types/bisonte-auth-plugin.d.ts`

**Consumidores:**
- `src/components/GoogleButton.js`
- `src/components/GoogleButtonRegister.js`
- `src/components/DiagnosticsWidget.tsx`
- `src/app/auth/native-test/page.tsx`

### 1.2 `src/lib/security.ts` ✅

**Antes:** JavaScript (`security.js`)  
**Ahora:** TypeScript con tipos explícitos

**Mejoras implementadas:**
- Interfaces para rate limiting (`RateLimitOptions`, `RateLimitResponse`)
- Tipado de funciones criptográficas (`hashPassword`, `verifyPassword`, `hashToken`)
- Validación de fortaleza de contraseña con tipo `PasswordStrengthResult`
- Funciones de recuperación con tipo `PasswordRecoveryResult`
- Cliente Prisma tipado (`db: PrismaClient`) eliminando accesos `any`
- Tipado seguro de headers HTTP mediante guardas (`hasGet`, `isPlainHeaders`)
- Protección contra object injection usando `hasOwnProperty` checks

**Funciones clave:**
```typescript
checkRateLimit(identifier, action, maxAttempts, windowMs, options): Promise<RateLimitResponse>
checkLoginRateLimit(ip, email): Promise<{ ipLimit, emailLimit }>
createPasswordRecovery(email, ipAddress, userAgent): Promise<PasswordRecoveryResult>
verifyRecoveryCode(email, code): Promise<PasswordReset | null>
```

### 1.3 `src/lib/ua.ts` ✅

**Antes:** Parcialmente tipado  
**Ahora:** Completamente tipado con interfaz exportable

**Mejoras implementadas:**
- Interfaz `WebViewBridgeWindow` exportada para compartir entre módulos
- Tipado explícito de `ReactNativeWebView.postMessage`
- Tipado de `webkit.messageHandlers` con firmas de funciones
- Helpers: `isWebViewUA`, `isWebViewRuntime`, `isCapacitorRuntime`, `buildBridgeCallback`

---

## 2. Documentación del flujo Google/Capacitor

### 2.1 Documento técnico creado

**Ubicación:** `docs/integrations/mobile/google-capacitor-flow.md`

**Contenido:**
1. **Detección de contexto** mediante `isWebViewRuntime()` y `isCapacitorRuntime()`
2. **Obtención de token nativo** con orden de prioridad de plugins:
   - `BisonteAuth.googleSignInCCT()` (AppAuth/Chrome Custom Tabs)
   - `FirebaseAuthentication.signInWithGoogle()`
   - `GoogleAuth.initialize()` + `.signIn()`
   - Fallback: `postMessage` + `window.__BisonteProvideIdToken`
3. **Envío a NextAuth** mediante `signIn("credentials", { idToken })`
4. **Validación** con `google-auth-library` usando audiencias configuradas
5. **Persistencia** a través de `handleGoogleAuth` → `prisma.usuarios.upsert` → `UserSession`
6. **Callbacks nativos esperados** con contratos de plugins
7. **Diagramas de secuencia** simplificados
8. **Buenas prácticas** de seguridad para WebView/CustomTabs

### 2.2 Flujo de datos

```
App WebView → requestGoogleIdToken() → Plugin nativo (BisonteAuth/Firebase/GoogleAuth)
    ↓
  idToken
    ↓
signIn("credentials") → NextAuth authorize() → googleClient.verifyIdToken()
    ↓
handleGoogleAuth() → prisma.usuarios.upsert({ emailVerified: true })
    ↓
NextAuth session → prisma.UserSession.create()
    ↓
Redirect to /auth/bridge?to=/home
```

---

## 3. Revisión de migraciones Prisma

### 3.1 Schema actual (`prisma/schema.prisma`)

```prisma
model PasswordReset {
  id        Int       @id @default(autoincrement())
  userId    Int       // ✅ Campo requerido
  email     String    @default("") @db.VarChar(320)
  token     String    @default("") @db.VarChar(128)
  code      String    @db.VarChar(10)
  expiresAt DateTime
  createdAt DateTime  @default(now())
  used      Boolean   @default(false)
  usedAt    DateTime?
  ipAddress String?   @db.VarChar(45)
  userAgent String?   @db.VarChar(255)
  usuarios  usuarios  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([code])
  @@index([email])
  @@index([token])
  @@index([userId])
}
```

### 3.2 Migración aplicada

**Archivo:** `prisma/migrations/20251006_make_passwordreset_userid_required/migration.sql`

**Contenido:**
```sql
-- Step 1: Delete orphaned password reset records
DELETE FROM "PasswordReset" 
WHERE "userId" IS NULL 
   OR "userId" NOT IN (SELECT id FROM usuarios);

-- Step 2: Make userId NOT NULL
ALTER TABLE "PasswordReset" 
ALTER COLUMN "userId" SET NOT NULL;
```

**Estado:** ✅ Migración registrada (database schema is up to date)

### 3.3 Validación de código

La función `createPasswordRecovery` en `src/lib/security.ts` ahora **requiere** que el usuario exista antes de crear un registro de recuperación:

```typescript
export async function createPasswordRecovery(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<PasswordRecoveryResult> {
  const normalizedEmail = email.toLowerCase();
  const user = await db.usuarios.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    throw new Error("No se puede crear una recuperación para un usuario inexistente.");
  }

  // ... resto de la lógica
}
```

**Impacto:** Los endpoints `/api/recuperar` y `/api/auth/password/request` quedan protegidos contra intentos de recuperación para emails no registrados.

---

## 4. Verificación de calidad

### 4.1 Lint exitoso

```bash
npx eslint src/lib/nativeBridge.ts src/lib/security.ts src/lib/ua.ts
# Exit code: 0 ✅
```

### 4.2 Archivos legacy eliminados

- ❌ `src/lib/nativeBridge.js` (reemplazado por `.ts`)
- ❌ `src/lib/security.js` (reemplazado por `.ts`)

### 4.3 Imports actualizados

- `src/lib/userManager.js`: Ahora importa desde `./security` (TypeScript)
- Todos los componentes consumen las interfaces exportadas correctamente

---

## 5. Estructura de módulos actualizada

```
src/lib/
├── nativeBridge.ts      # ✅ TypeScript tipado - Puentes nativos Capacitor
├── security.ts          # ✅ TypeScript tipado - Rate limiting, crypto, recovery
├── ua.ts                # ✅ TypeScript tipado - Detección WebView/Capacitor
├── auth.js              # ⚠️ Pendiente migración (NextAuth config)
├── userManager.js       # ⚠️ Pendiente migración (User CRUD)
└── prisma.js            # Singleton Prisma client

docs/integrations/mobile/
└── google-capacitor-flow.md  # ✅ Documentación técnica completa

prisma/migrations/
└── 20251006_make_passwordreset_userid_required/
    └── migration.sql    # ✅ Migración aplicada
```

---

## 6. Próximos pasos recomendados

### Fase 3 (sugerida): Completar migración TypeScript
- [ ] Migrar `src/lib/auth.js` a TypeScript
- [ ] Migrar `src/lib/userManager.js` a TypeScript
- [ ] Tipar callbacks de NextAuth (`authorize`, `jwt`, `session`)

### Fase 4 (sugerida): Tests de integración
- [ ] Test de flujo completo Google OAuth (mock de plugins)
- [ ] Test de rate limiting bajo carga
- [ ] Test de recuperación de contraseña end-to-end

### Fase 5 (sugerida): Seguridad adicional
- [ ] Implementar Redis para rate limiting en producción
- [ ] Agregar logging estructurado de eventos de seguridad
- [ ] Implementar rotación automática de tokens de recuperación

---

## Checklist de requisitos Fase 2 ✅

- [x] Tipa estrictamente `nativeBridge.js` → `nativeBridge.ts`
- [x] Tipa estrictamente `security.js` → `security.ts`
- [x] Tipa estrictamente `ua.ts`
- [x] Documenta flujo completo Google/Capacitor (plugins, callbacks, persistencia)
- [x] Revisa migraciones Prisma: `PasswordReset.userId` ahora obligatorio
- [x] Ajusta función `createPasswordRecovery` para validar usuario existente
- [x] Elimina archivos JavaScript legacy
- [x] Verifica lint exitoso en todos los módulos críticos

**Estado final:** ✅ **Fase 2 completada**
