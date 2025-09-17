# Android: Google Sign-In con Chrome Custom Tabs (CCT)

Objetivo: evitar problemas de cookies del WebView delegando el login de Google al sistema (CCT) y devolver un `idToken` al WebView para completar sesión con NextAuth (Credentials).

## Enfoque
- Implementar un plugin Capacitor nativo (p. ej. `BisonteAuth`) que abra el flujo OAuth con [AppAuth-Android](https://github.com/openid/AppAuth-Android) en Chrome Custom Tabs.
- Al finalizar, el plugin valida el `code` en backend o intercambia tokens nativamente y entrega `idToken` al WebView vía `Capacitor.Plugins.BisonteAuth.googleSignInCCT()`.
- La WebView llama `requestGoogleIdToken()` (ya actualizado) y, si recibe `idToken`, inicia sesión con NextAuth `CredentialsProvider`.

## Pasos Android (Kotlin/Java)
1. Dependencias en `android/app/build.gradle`:
   - AppAuth: `implementation 'net.openid:appauth:0.11.1'` (o versión reciente)
2. Crear un plugin Capacitor `BisonteAuth` con un método `googleSignInCCT()`:
   - Construye `AuthorizationServiceConfiguration` con las endpoints de Google.
   - Lanza `AuthorizationService` con `CustomTabsIntent`.
   - Recibe el callback en `onActivityResult`/`ActivityResultLauncher`.
   - Intercambia el `code` por tokens (id_token incluido) usando el cliente de Google en nativo o en backend seguro.
   - Devuelve `{ idToken: string }` a JS con `call.resolve(JSObject().put("idToken", idToken))`.
3. Redirect URI:
   - Usa un esquema propio (p. ej. `com.tuapp:/oauth2redirect/google`) y configúralo en Google Console.
4. Seguridad:
   - Preferible hacer el intercambio de código->token en el backend; el plugin puede abrir un `https://www.bisonteapp.com/auth/native-callback?...` que entregue el `idToken` al plugin.

## Integración con el WebView
- Ya disponible: `window.Capacitor.Plugins.BisonteAuth.googleSignInCCT()`.
- Nuestra WebView llama primero este plugin desde `requestGoogleIdToken()`; si retorna `idToken`, usamos NextAuth Credentials (`idToken`) y redirigimos a `/auth/bridge?to=/home`.
- Si no hay plugin o falla, caemos al OAuth en WebView (con `state+nonce`) y mitigaciones de cookies.

## Notas
- CCT reduce fricción de cookies y mejora UX.
- Mantén `NEXTAUTH_URL` y redirect URIs sincronizados con producción.
- Este enfoque evita PKCE en WebView; se usa `idToken` validado en backend por NextAuth.
