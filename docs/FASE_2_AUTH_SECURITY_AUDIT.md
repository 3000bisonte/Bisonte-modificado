# Fase 2: Auditoría y Refactorización de Autenticación y Seguridad

> Fecha: 6 de octubre de 2025  
> Alcance: Módulos críticos de autenticación (nativeBridge, security, ua) + persistencia Prisma

## 1. Migración a TypeScript estricto

### Módulos actualizados

| Archivo antiguo | Nuevo archivo | Estado |
| --- | --- | --- |
| `src/lib/nativeBridge.js` | `src/lib/nativeBridge.ts` | ✅ Completo |
| `src/lib/security.js` | `src/lib/security.ts` | ✅ Completo |
| `src/lib/ua.ts` | (ya existía) | ✅ Mejorado |

### Mejoras de tipado

- **nativeBridge.ts**: Interfaces estrictas para `IdTokenAuthResult`, `CapacitorBridgeWindow`, plugins nativos (BisonteAuth, FirebaseAuth, GoogleAuth).
- **security.ts**: Tipado completo de rate limiting (`RateLimitResponse`, `RateLimitOptions`), funciones de hashing, validación de contraseñas (`PasswordStrengthResult`), y gestión de recuperación (`PasswordRecoveryResult`).
- **ua.ts**: Interfaz `WebViewBridgeWindow` exportada para reutilización, mejora en `buildBridgeCallback` con sanitización de entrada.

### Lint y validación

Todos los módulos pasan ESLint sin errores:
```bash
npx eslint src/lib/nativeBridge.ts src/lib/security.ts src/lib/ua.ts
# EXIT CODE: 0
```

Se solucionaron:
- Ordenamiento de imports (types primero, luego built-ins, luego módulos locales).
- Eliminación de `async` innecesario en funciones síncronas que devuelven Promise.
- Supresión de falsos positivos en detección de inyección de objetos (acceso seguro a headers).

## 2. Documentación del flujo Google/Capacitor

Creado **`docs/integrations/mobile/google-capacitor-flow.md`** con:

1. **Detección de contexto**: `isWebViewRuntime()`, `isCapacitorRuntime()`, `buildBridgeCallback()`.
2. **Obtención de token nativo**: Orden de prioridad de plugins (BisonteAuth → FirebaseAuth → GoogleAuth), fallback a mensajería (`postMessage`, `__BisonteProvideIdToken`).
3. **Envío a NextAuth**: `signIn("credentials", { idToken })`, validación con `google-auth-library`, logging de eventos de seguridad.
4. **Persistencia**: `handleGoogleAuth()` en `userManager.js`, creación/actualización de `usuarios`, sesión NextAuth con `UserSession`.
5. **Callbacks nativos esperados**: Contratos de plugins Android/iOS, señales de depuración.
6. **Diagramas de secuencia**: WebView → Plugins → NextAuth, y fallback por mensajería.
7. **Buenas prácticas**: Sincronización de versiones, uso inmediato de tokens, preferencia por Chrome Custom Tabs.

## 3. Revisión de esquema Prisma

### Problema identificado

`PasswordReset.userId` era `Int` pero **no marcado como requerido** en el esquema Prisma:
```prisma
model PasswordReset {
  id        Int       @id @default(autoincrement())
  userId    Int       // <-- No tenía NOT NULL explícito en la BD
  ...
}
```

Sin embargo, la lógica en `security.ts` (`createPasswordRecovery`) **ya lanzaba error** si el usuario no existía:
```typescript
const user = await db.usuarios.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
if (!user) {
  throw new Error("No se puede crear una recuperación para un usuario inexistente.");
}
```

### Solución aplicada

Creada migración SQL manual:  
**`prisma/migrations/20251006_make_passwordreset_userid_required/migration.sql`**

```sql
-- Eliminar registros huérfanos (si existen)
DELETE FROM "PasswordReset" WHERE "userId" IS NULL OR "userId" NOT IN (SELECT id FROM usuarios);

-- Hacer userId NOT NULL
ALTER TABLE "PasswordReset" ALTER COLUMN "userId" SET NOT NULL;
```

### Cómo aplicar la migración

```bash
# Aplicar migración manualmente
npx prisma migrate resolve --applied 20251006_make_passwordreset_userid_required

# Regenerar cliente Prisma
npx prisma generate
```

### Validación post-migración

- Revisar que `createPasswordRecovery` siga funcionando correctamente (ya tiene validación).
- Los endpoints `/api/recuperar`, `/api/auth/password/request` deben continuar devolviendo 200 incluso si el email no existe (evitar enumeración de usuarios).
- Los registros `PasswordReset` antiguos sin `userId` habrán sido eliminados de forma segura.

## 4. Estructura de archivos actualizada

```
src/lib/
├── nativeBridge.ts      ✅ TypeScript estricto, tipos exportados
├── security.ts          ✅ TypeScript estricto, rate limiting tipado
├── ua.ts                ✅ WebViewBridgeWindow exportado
├── userManager.js       ⚠️  Pendiente: migrar a TS (Fase 3)
├── auth.js              ⚠️  Pendiente: migrar a TS (Fase 3)
└── prisma.js            ✅ OK (wrapper simple)

docs/integrations/mobile/
└── google-capacitor-flow.md  ✅ Documentación completa del flujo

prisma/
└── migrations/
    └── 20251006_make_passwordreset_userid_required/
        └── migration.sql  ✅ Migración de integridad referencial
```

## 5. Próximos pasos (Fase 3)

- Migrar `auth.js` y `userManager.js` a TypeScript.
- Unificar tipos de sesión y usuario en `types/auth.d.ts`.
- Añadir pruebas unitarias para `security.ts` (rate limiting, password strength).
- Implementar telemetría para `SecurityEvents` (integrar con Sentry o similar).
- Revisar consistencia de `logSecurityEvent` en todos los puntos de autenticación.

## 6. Notas de compatibilidad

- **TypeScript**: 5.3.3 (compatible con @typescript-eslint 7.x).
- **Prisma**: Cliente regenerado automáticamente en `postinstall`.
- **ESLint**: Todas las reglas de seguridad y orden de imports aplicadas.
- **Imports**: Consumidores de `nativeBridge`/`security` deben importar sin extensión `.js` (Next.js resuelve automáticamente `.ts`).

---

**Estado general**: Fase 2 completada. Módulos críticos de autenticación tipados, documentados y validados. Migración Prisma lista para aplicar en base de datos de producción previo backup.
