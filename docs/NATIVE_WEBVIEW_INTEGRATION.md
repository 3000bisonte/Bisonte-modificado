# Integración Nativa WebView (Google Sign-In con idToken)

Este documento explica cómo integrar la app nativa (host del WebView) para entregar un `idToken` de Google a la WebView, y así iniciar sesión sin depender del flujo OAuth con cookies.

## Protocolo de Mensajes

La WebView enviará una solicitud:
- Mensaje: `{ type: "REQUEST_ID_TOKEN" }`
- Canales usados por la WebView:
  - `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_ID_TOKEN' }))`
  - `window.webkit.messageHandlers.bridge.postMessage({ type: 'REQUEST_ID_TOKEN' })` (iOS WKWebView)
  - `window.parent.postMessage({ type: 'REQUEST_ID_TOKEN' }, '*')` (fallback)

La app nativa debe responder con el `idToken` por cualquiera de estos mecanismos:
- Llamando `window.__BisonteProvideIdToken(idToken)` (inyectando JS en la WebView)
- Enviando un `postMessage` con `{ type: 'ID_TOKEN', idToken }`

La WebView consumirá el token, llamará a NextAuth con `CredentialsProvider` y redirigirá a `/auth/bridge?to=/home`.

---

## React Native (react-native-webview)

```tsx
import { WebView } from 'react-native-webview';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({ webClientId: 'GOOGLE_CLIENT_ID' });

function MyWebView() {
  let webviewRef = null;

  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'REQUEST_ID_TOKEN') {
        const user = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const idToken = tokens?.idToken;
        if (idToken) {
          // Opción 1: inyectar JS con el token directo
          webviewRef?.injectJavaScript(`window.__BisonteProvideIdToken(${JSON.stringify(idToken)}); true;`);
          // Opción 2: postMessage de vuelta
          // webviewRef?.postMessage(JSON.stringify({ type: 'ID_TOKEN', idToken }));
        }
      }
    } catch (e) {}
  };

  return (
    <WebView
      ref={(r) => (webviewRef = r)}
      source={{ uri: 'https://www.bisonteapp.com/' }}
      onMessage={onMessage}
      javaScriptEnabled
      originWhitelist={["*"]}
      sharedCookiesEnabled
    />
  );
}
```

## Android (WebView nativa)

```kotlin
webView.settings.javaScriptEnabled = true
webView.addJavascriptInterface(object {
  @JavascriptInterface
  fun postMessage(message: String) {
    try {
      val obj = JSONObject(message)
      if (obj.optString("type") == "REQUEST_ID_TOKEN") {
        // TODO: Lanzar flujo de Google Sign-In nativo y obtener idToken
        val idToken = obtainIdToken()
        val js = "window.__BisonteProvideIdToken('" + idToken + "');"
        webView.post { webView.evaluateJavascript(js, null) }
      }
    } catch (_: Exception) {}
  }
}, "ReactNativeWebView") // reutilizamos canal compatible
```

## iOS (WKWebView)

```swift
class BridgeHandler: NSObject, WKScriptMessageHandler {
  weak var webView: WKWebView?
  init(_ webView: WKWebView) { self.webView = webView }
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if let dict = message.body as? [String: Any], let type = dict["type"] as? String, type == "REQUEST_ID_TOKEN" {
      // TODO: Lanzar Google Sign-In nativo y obtener idToken
      let idToken = obtainIdToken()
      let js = "window.__BisonteProvideIdToken('" + idToken + "')"
      webView?.evaluateJavaScript(js, completionHandler: nil)
    }
  }
}

let contentController = WKUserContentController()
contentController.add(BridgeHandler(webView), name: "bridge")
let config = WKWebViewConfiguration()
config.userContentController = contentController
let webView = WKWebView(frame: .zero, configuration: config)
```

## Capacitor / Cordova

```ts
// Escucha postMessage desde la WebView y responde con idToken tras Google Sign-In nativo
window.addEventListener('message', async (e) => {
  if (e?.data?.type === 'REQUEST_ID_TOKEN') {
    const idToken = await obtainIdTokenFromNative();
    if (idToken) {
      if (window.__BisonteProvideIdToken) {
        window.__BisonteProvideIdToken(idToken);
      } else {
        window.postMessage({ type: 'ID_TOKEN', idToken }, '*');
      }
    }
  }
});
```

### Plugins recomendados (Capacitor)

- Opción A: Firebase Authentication
  - iOS/Android: `npm i @capacitor-firebase/authentication`
  - Uso:
    ```ts
    import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
    const res = await FirebaseAuthentication.signInWithGoogle();
    const idToken = res?.credential?.idToken;
    ```

- Opción B: GoogleAuth (por ejemplo `@codetrix-studio/capacitor-google-auth`)
  - iOS/Android: `npm i @codetrix-studio/capacitor-google-auth`
  - Uso:
    ```ts
    import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
    await GoogleAuth.initialize();
    const res = await GoogleAuth.signIn();
    const idToken = res?.authentication?.idToken || res?.idToken;
    ```

En ambos casos, devolver el `idToken` a la WebView llamando a `window.__BisonteProvideIdToken(idToken)`.

---

## Checklist rápido para Capacitor (Android/iOS)

1) Dependencias y build
- Instala uno de los plugins nativos:
  - `@capacitor-firebase/authentication` (recomendado) o `@codetrix-studio/capacitor-google-auth`.
- Ejecuta `npx cap sync` y abre el proyecto nativo para confirmar que compila.

2) Configuración de Google
- Asegura `GOOGLE_CLIENT_ID` del tipo “Web client” y que coincida con el usado en el backend.
- Si usas FirebaseAuth: agrega SHA-1/SH-256 del keystore en Firebase Console (Android), y `REVERSED_CLIENT_ID` en iOS si aplica.

3) Capacitor config
- En Android, habilita `javaScriptEnabled` para el WebView.
- Si abres OAuth en navegador nativo, prefiere AppAuth con Chrome Custom Tabs en un plugin (p.ej. `BisonteAuth.googleSignInCCT`).

4) Entrega del idToken a la WebView
- Tras login nativo, llama a `window.__BisonteProvideIdToken(idToken)` con un token JWT (3 segmentos separados por puntos).
- Alternativa: `window.postMessage({ type: 'ID_TOKEN', idToken }, '*')`.

5) Verificación desde la app web
- Abre `https://www.bisonteapp.com/#diag` dentro de tu WebView para mostrar el Diagnostic Widget.
- Pulsa “Test Plugins”: debe mostrar disponibilidad de `FirebaseAuthentication` y/o `GoogleAuth` y si devuelven `idToken`.
- Pulsa “Nativo (Capacitor)”: si todo está correcto, te logueará y te llevará a `/auth/bridge` y luego `/home`.

6) Si no llega el idToken
- Revisa permisos/certificados de Google (SHA en Android, Info.plist en iOS).
- Comprueba que el plugin efectivamente devuelve `idToken` (no solo `accessToken`).
- Si usas GoogleAuth, ejecuta `initialize()` antes de `signIn()`.
- Confirma que la WebView no bloquea `postMessage`/JS y que la llamada a `__BisonteProvideIdToken` se ejecuta.

---

## Checklist de Configuración
- `NEXTAUTH_URL=https://www.bisonteapp.com`
- `NEXTAUTH_SECRET` correctamente configurado
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` válidos
- En Google Console, el redirect URI debe coincidir con NextAuth
- Cookies en prod: dominio `.bisonteapp.com`, `SameSite=None`, `Secure`
- La app nativa debe permitir cookies si alguna vez se usa el fallback OAuth
- WebView con `javaScriptEnabled` y (si aplica) `sharedCookiesEnabled`

## Pruebas rápidas
- Abra `https://www.bisonteapp.com/` en el WebView y pulse “Continuar con Google”.
- Si el host responde con `idToken`, el login se hace con `CredentialsProvider` y la WebView verá la pantalla de `bridge` y luego `/home`.
- Si el host no responde, cae a OAuth, pero pasando por `/auth/bridge` para finalizar.
