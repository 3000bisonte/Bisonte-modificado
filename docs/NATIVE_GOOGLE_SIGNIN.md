# Native Google Sign-In (WebView-safe)

Objetivo: Evitar el flujo OAuth basado en cookies en WebView, usando en su lugar Google Sign-In nativo y un ID token que el backend valida para crear sesión con NextAuth.

## Resumen del flujo

1. La app nativa (Android/iOS) inicia Google Sign-In con el SDK oficial y obtiene un `idToken` de Google.
2. La app envía `idToken` a NextAuth (provider `credentials`) usando el endpoint de callback:
   - `POST https://www.bisonteapp.com/api/auth/callback/credentials`
   - Body `application/x-www-form-urlencoded` con: `csrfToken`, `idToken`, y opcionalmente `callbackUrl`.
3. NextAuth valida el `idToken` en el servidor (con `google-auth-library`), crea/actualiza el usuario y establece la sesión.
4. El servidor responde con redirect 302/303 a la `callbackUrl` (p. ej. `/home`).

> Nota: No se envía contraseña; el provider credentials detecta `idToken` y activa la rama nativa.

## Ejemplo de cliente (pseudo)

1) Obtener `csrfToken` desde la web embebida o precargarlo:
```
GET https://www.bisonteapp.com/api/auth/csrf
```
Respuesta:
```json
{ "csrfToken": "<token>" }
```

2) Enviar el `idToken` a NextAuth credentials callback:
```
POST https://www.bisonteapp.com/api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

csrfToken=<token>&idToken=<GOOGLE_ID_TOKEN>&callbackUrl=https%3A%2F%2Fwww.bisonteapp.com%2Fhome
```

3) Manejar redirect en el WebView (seguir 302/303) hasta `/home`.

## Android (Kotlin) sketch
```kotlin
val googleIdToken: String = /* obtenido del SDK nativo */
val csrf = /* GET a /api/auth/csrf y extraer csrfToken */
val form = "csrfToken=" + URLEncoder.encode(csrf, "UTF-8") +
           "&idToken=" + URLEncoder.encode(googleIdToken, "UTF-8") +
           "&callbackUrl=" + URLEncoder.encode("https://www.bisonteapp.com/home", "UTF-8")

val req = Request.Builder()
    .url("https://www.bisonteapp.com/api/auth/callback/credentials")
    .post(form.toRequestBody("application/x-www-form-urlencoded".toMediaType()))
    .build()

client.newCall(req).execute().use { resp ->
    // Seguir redirect hasta /home dentro del WebView
}
```

## iOS (Swift) sketch
```swift
let idToken = /* obtenido del SDK nativo */
let csrf = /* GET a /api/auth/csrf */
let body = "csrfToken=\(csrf)&idToken=\(idToken)&callbackUrl=https%3A%2F%2Fwww.bisonteapp.com%2Fhome"
var req = URLRequest(url: URL(string: "https://www.bisonteapp.com/api/auth/callback/credentials")!)
req.httpMethod = "POST"
req.httpBody = body.data(using: .utf8)
req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
```

## Consideraciones
- Asegúrate de usar `GOOGLE_CLIENT_ID` correcto (Web/Android/iOS) según el flujo.
- No necesitas cookies de terceros; la sesión es de primera parte y NextAuth la gestionará.
- Puedes seguir usando el bridge `/auth/bridge?to=/home` si quieres notificar al host app justo después del login.
