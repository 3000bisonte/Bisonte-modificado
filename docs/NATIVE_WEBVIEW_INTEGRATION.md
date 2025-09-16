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
