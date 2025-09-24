# Capacitor Plugin: BisonteAuth (Chrome Custom Tabs / AppAuth)

Objetivo: Proveer un método nativo `BisonteAuth.googleSignInCCT()` que abra el flujo de Google en Chrome Custom Tabs (Android) o SFSafariViewController (iOS) usando AppAuth (OIDC), haga el intercambio de código por tokens y devuelva `idToken` a la WebView.

La web ya detecta este plugin y, al recibir `idToken`, inicia sesión con NextAuth (ruta de credenciales) y redirige a `/auth/bridge` → `/home`.

---

## Interfaz del plugin

```ts
// definitions.ts
export interface BisonteAuthPlugin {
  googleSignInCCT(): Promise<{ idToken: string; accessToken?: string; email?: string; raw?: any }>
}

declare global {
  interface Window {
    BisonteAuth?: {
      googleSignInCCT(): Promise<{ idToken: string; accessToken?: string; email?: string; raw?: any }>
    }
  }
}
```

```ts
// index.ts
import { registerPlugin } from '@capacitor/core';
import type { BisonteAuthPlugin } from './definitions';

export const BisonteAuth = registerPlugin<BisonteAuthPlugin>('BisonteAuth');
```

---

## Android (Kotlin + AppAuth + CCT)

Dependencias (en app `build.gradle`):

```gradle
dependencies {
    implementation 'net.openid:appauth:0.11.1'
}
```

Plugin Kotlin (por ejemplo `BisonteAuth.kt`):

```kotlin
package com.bisonte.auth

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.getcapacitor.*
import net.openid.appauth.*

@CapacitorPlugin(name = "BisonteAuth")
class BisonteAuth : Plugin() {
  private var authService: AuthorizationService? = null
  private var authRequest: AuthorizationRequest? = null
  private var state: AuthState? = null
  private var pendingCall: PluginCall? = null

  // TODO: Reemplazar por tus valores
  private val clientId = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
  private val redirectUri = Uri.parse("com.bisonteapp:/oauth2redirect") // esquema personalizado
  private val authEndpoint = Uri.parse("https://accounts.google.com/o/oauth2/v2/auth")
  private val tokenEndpoint = Uri.parse("https://oauth2.googleapis.com/token")
  private val issuer = Uri.parse("https://accounts.google.com")

  @PluginMethod
  fun googleSignInCCT(call: PluginCall) {
    if (pendingCall != null) {
      call.reject("Another auth in progress")
      return
    }
    pendingCall = call
    val activity = bridge.activity

    // Configuración de endpoints
    val serviceConfig = AuthorizationServiceConfiguration(authEndpoint, tokenEndpoint, null)
    val builder = AuthorizationRequest.Builder(
      serviceConfig,
      clientId,
      ResponseTypeValues.CODE,
      redirectUri
    )
    builder.setScopes("openid", "email", "profile")
    authRequest = builder.build()

    authService = AuthorizationService(activity)
    val customTabsIntent = CustomTabsIntent.Builder().build()
    val authIntent = authService!!.getAuthorizationRequestIntent(authRequest!!, customTabsIntent)

    // Lanzar flujo en CCT
    startActivityForResult(call, authIntent, "handleAuthResult")
  }

  @ActivityCallback
  fun handleAuthResult(result: ActivityResult) {
    val call = pendingCall ?: return
    val data: Intent? = result.data
    val resp = AuthorizationResponse.fromIntent(data!!)
    val ex = AuthorizationException.fromIntent(data)
    if (resp == null) {
      call.reject(ex?.errorDescription ?: "Authorization failed")
      pendingCall = null
      return
    }
    state = AuthState(resp, ex)

    // Intercambiar code por tokens
    val tokenReq = resp.createTokenExchangeRequest()
    authService?.performTokenRequest(tokenReq) { tokenResp, tokenEx ->
      if (tokenResp != null) {
        state?.update(tokenResp, tokenEx)
        val idToken = tokenResp.idToken
        val accessToken = tokenResp.accessToken
        if (!idToken.isNullOrBlank()) {
          val ret = JSObject()
          ret.put("idToken", idToken)
          if (!accessToken.isNullOrBlank()) ret.put("accessToken", accessToken)
          call.resolve(ret)
        } else {
          call.reject("No idToken in token response")
        }
      } else {
        call.reject(tokenEx?.errorDescription ?: "Token exchange failed")
      }
      pendingCall = null
    }
  }
}
```

AndroidManifest (para manejar el esquema de retorno):

```xml
<activity android:name="com.getcapacitor.BridgeActivity" ...>
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.bisonteapp" android:host="oauth2redirect" />
  </intent-filter>
  <!-- ... -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.googleusercontent.apps.YOUR_WEB_CLIENT_ID" />
  </intent-filter>
 </activity>
```

Notas:
- Usa el “Web client” de Google (el mismo del backend) en `clientId`.
- `redirectUri` debe estar permitido en Google Console. Usa esquema personalizado (`com.bisonteapp:/oauth2redirect`).
- Añade SHA-1/SHA-256 del keystore a Firebase/Google si corresponde.

---

## iOS (Swift + AppAuth + SFSafariViewController)

Instala AppAuth (CocoaPods o SPM). Ejemplo CocoaPods:

```ruby
pod 'AppAuth', '~> 1.6'
```

Plugin Swift (por ejemplo `BisonteAuth.swift`):

```swift
import Foundation
import Capacitor
import AppAuth

@objc(BisonteAuth)
public class BisonteAuth: CAPPlugin {
  var currentAuthorizationFlow: OIDExternalUserAgentSession?
  var authState: OIDAuthState?

  // TODO: Reemplazar por tus valores
  let clientId = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
  let redirectURI = URL(string: "com.bisonteapp:/oauth2redirect")!
  let issuer = URL(string: "https://accounts.google.com")!

  @objc func googleSignInCCT(_ call: CAPPluginCall) {
    OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) { config, error in
      guard let config = config else {
        call.reject(error?.localizedDescription ?? "Discover failed")
        return
      }
      let request = OIDAuthorizationRequest(
        configuration: config,
        clientId: self.clientId,
        scopes: [OIDScopeOpenID, OIDScopeEmail, OIDScopeProfile],
        redirectURL: self.redirectURI,
        responseType: OIDResponseTypeCode,
        additionalParameters: nil
      )
      self.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self.bridge?.viewController) { authState, error in
        if let state = authState {
          self.authState = state
          if let idToken = state.lastTokenResponse?.idToken {
            call.resolve(["idToken": idToken])
          } else {
            call.reject("No idToken in response")
          }
        } else {
          call.reject(error?.localizedDescription ?? "Auth failed")
        }
      }
    }
  }
}
```

Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.bisonteapp</string>
    </array>
  </dict>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_WEB_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

---

## Uso desde la WebView

La web ya llama:

```ts
const BA = (window as any).Capacitor?.Plugins?.BisonteAuth || (window as any).BisonteAuth;
const res = await BA.googleSignInCCT();
const idToken = res?.idToken || res?.token;
```

Si el plugin no está, el widget muestra “Plugin BisonteAuth.googleSignInCCT no disponible”.

---

## Consejos de configuración
- Usa el “Web client” (no iOS/Android client) para conseguir `idToken` válido para verificación en backend.
- El `redirectUri` debe coincidir exactamente con lo registrado en Google.
- En Android, añade SHA-1 y SHA-256 del keystore si usas Firebase.
- En iOS, revisa que el esquema de URL esté en Info.plist.

---

## Solución de problemas
- Si no llega `idToken` pero sí `accessToken`, revisa el tipo de cliente configurado en Google.
- Si el flujo no vuelve a la app, valida el esquema de URL y el intent-filter / Info.plist.
- En Android 13+, asegúrate de que Chrome esté instalado y CCT habilitado; si no, AppAuth usa un navegador disponible.
