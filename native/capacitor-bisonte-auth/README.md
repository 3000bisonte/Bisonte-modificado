# BisonteAuth Capacitor Plugin (AppAuth + CCT)

This plugin provides `BisonteAuth.googleSignInCCT()` to perform Google Sign-In using AppAuth with Chrome Custom Tabs (Android) / SFSafariViewController (iOS) and returns an `idToken` to the WebView.

Web is already integrated to call:

```ts
const BA = (window as any).Capacitor?.Plugins?.BisonteAuth || (window as any).BisonteAuth;
const res = await BA.googleSignInCCT();
const idToken = res?.idToken;
```

## Install into a Capacitor app

1) Copy this folder `native/capacitor-bisonte-auth` into your native app repo (or publish it as a local/private npm package).

2) iOS (CocoaPods):
   - Open `ios/App/App.xcworkspace` once pods are installed.
   - Ensure Podfile allows `use_frameworks!`
   - The podspec includes `AppAuth` dependency.

3) Android (Gradle):
   - Ensure your app has `mavenCentral()` in repositories.
   - The plugin gradle adds `implementation 'net.openid:appauth:0.11.1'`.

4) Configure your values:
   - In `BisonteAuth.kt` and `BisonteAuth.swift`, replace `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` and `com.bisonteapp:/oauth2redirect` with your settings.
   - Use the "Web client" (server client) from Google Cloud Console (same as `GOOGLE_CLIENT_ID` in backend) to get a verifiable `idToken`.

5) Host app manifest/Info.plist:
   - Android: In your host app `AndroidManifest.xml`, add intent-filters for your custom scheme `com.bisonteapp:/oauth2redirect`.
   - iOS: Add URL Schemes in Info.plist for `com.bisonteapp` and the reversed client id.

6) Build and run your app, then open the WebView to `https://www.bisonteapp.com/#diag` and use the Diagnostics Widget → "CCT (Custom Tabs)" and "Verificar Token".

Refer also to `docs/CAPACITOR_PLUGIN_BISONTE_AUTH_CCT.md` in the web repo for a full guide.
