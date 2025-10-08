# Flujo de autenticación Google + Capacitor

> Última actualización: 6 de octubre de 2025

Este documento describe paso a paso cómo la aplicación móvil (Capacitor/WebView) solicita y persiste la autenticación con Google dentro del ecosistema Bisonte. Incluye los plugins nativos implicados, los puntos de integración JavaScript/TypeScript y qué datos se almacenan en el backend.

## 1. Detección de contexto

1. `src/lib/ua.ts` expone utilidades para detectar si el runtime actual es un WebView (`isWebViewRuntime`) o un contenedor Capacitor (`isCapacitorRuntime`).
2. Los componentes de UI que disparan el inicio de sesión (por ejemplo `src/components/GoogleButton.js`) consultan `isWebViewRuntime()` antes de decidir si delegan en OAuth tradicional o en el puente nativo.
3. Cuando se requiere el flujo nativo, la ruta de retorno se genera con `buildBridgeCallback()`, que produce `/auth/bridge?to=<path>` para permitir que la app hospede una pantalla web de transición tras el login.

## 2. Obtención del token nativo

La lógica principal vive en `src/lib/nativeBridge.ts`:

1. Se valida que el código se ejecute en cliente y dentro de un WebView. En navegadores normales la función corta devolviendo `null`.
2. Si corre en Capacitor, se intenta obtener un `idToken` nativo siguiendo este orden de prioridad:
   - `Capacitor.Plugins.BisonteAuth.googleSignInCCT()` (plugin propio basado en AppAuth / Chrome Custom Tabs).
   - `Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle()` (plugin oficial de Firebase Auth).
   - `Capacitor.Plugins.GoogleAuth.initialize()` + `.signIn()` (wrapper @codetrix-studio).
3. Cada respuesta se normaliza con `extractToken`, que acepta tanto cadenas como objetos `{ idToken, token, accessToken }` y valida que el valor tenga forma JWT.
4. Si todos los plugins fallan, se abre un canal de mensajería:
   - Se expone `window.__BisonteProvideIdToken(token)` para que el host nativo invoque directamente.
   - Se emite `postMessage` a `ReactNativeWebView`, `window.webkit.messageHandlers.bridge` y al frame padre como última opción.
   - Se mantiene un `setTimeout` (12 segundos por defecto) para resolver con `null` en caso de inactividad.

## 3. Envío del token a NextAuth

1. `GoogleButton` llama a `requestGoogleIdToken()` y, si obtiene token, invoca `signIn("credentials", { idToken, callbackUrl })`.
2. El callback redirige a `/auth/bridge` para cerrar la vista web embebida y devolver el control a la app nativa.
3. En `src/lib/auth.js`, el proveedor Credentials valida el `idToken` con `google-auth-library` usando las audiencias configuradas (`GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`).
4. Al validar el token, se registra el evento con `logSecurityEvent(SecurityEvents.OAUTH_SUCCESS, ...)` para telemetría.

## 4. Persistencia en base de datos y sesión

1. `auth.js` delega a `handleGoogleAuth` (`src/lib/userManager.js`) para crear o actualizar el usuario:
   - Se normaliza el email.
   - Se asegura que el usuario queda marcado como `emailVerified` y se sincronizan nombre/foto.
   - La función retorna un payload con `id`, `role`, `passwordVersion`, etc.
2. NextAuth genera una sesión utilizando el adaptador Prisma (ver `UserSession` en `prisma/schema.prisma`). Se registran IP y User-Agent para auditoría.
3. Los tokens sensibles (`PasswordReset`, códigos de recuperación) se almacenan hasheados a través de `hashToken()` del módulo `security.ts`.

## 5. Callbacks nativos esperados

Implementaciones nativas (Android/iOS) deben cumplir al menos uno de los siguientes contratos:

- Exponer `Capacitor.Plugins.BisonteAuth.googleSignInCCT()` que resuelva con `{ idToken: string }`.
- Exponer `Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle()` que resuelva con `{ authentication: { idToken: string } }`.
- Exponer `Capacitor.Plugins.GoogleAuth.signIn()` y, si requiere setup, proveer `initialize()`.
- Como alternativa, invocar `window.__BisonteProvideIdToken(token)` tras completar el login en un `SFSafariViewController` / `CustomTabs`.

### Señales para depurar

- Los mensajes `console.warn("nativeBridge: ...")` quedan visibles en el inspector WebView.
- Fallos de validación de token quedan registrados mediante `SecurityEvents.OAUTH_FAILED` con metadatos `idTokenPresent`.
- Si ningún token llega, `GoogleButton` muestra una alerta instruyendo a revisar el plugin nativo.

## 6. Diagramas de secuencia simplificados

1. **App WebView ➜ Plugins Capacitor ➜ NextAuth**
   ```
   GoogleButton → requestGoogleIdToken → BisonteAuth/FirebaseAuth/GoogleAuth → (idToken)
   idToken → signIn(credentials) → NextAuth authorize → googleClient.verifyIdToken
   → handleGoogleAuth → prisma.usuarios.upsert → NextAuth session → callbackUrl /auth/bridge
   ```
2. **Fallback por mensajería**
   ```
   WebView → postMessage REQUEST_ID_TOKEN → Host nativo → __BisonteProvideIdToken(token)
   → finish(token) → signIn(credentials) → flujo igual al anterior
   ```

## 7. Buenas prácticas

- Mantener sincronizados los paquetes nativos (`native/capacitor-bisonte-auth`) con las versiones de Capacitor/AndroidX.
- Garantizar que los tokens se usen inmediatamente: `requestGoogleIdToken` no los almacena, sólo los pasa a NextAuth.
- En Android, preferir Chrome Custom Tabs con cuentas del dispositivo para evitar WebViews inseguros.
- En iOS, registrar `ASWebAuthenticationSession` y llamar al callback JavaScript antes de cerrar la sesión.

---

Para cualquier ajuste o validación adicional, revisar también `docs/GOOGLE_AUTH_ANDROID_SETUP.md` y `docs/GOOGLE_AUTH_CAPACITOR.md` que contienen guías específicas de instalación.
