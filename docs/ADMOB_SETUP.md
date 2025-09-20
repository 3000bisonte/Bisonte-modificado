# AdMob Setup (Android / Capacitor)

This project integrates native AdMob via `@capacitor-community/admob`.

## 1) Manifest and permissions

Already configured:
- `AndroidManifest.xml` includes:
  - `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${admob_app_id}" />`
  - `<uses-permission android:name="com.google.android.gms.permission.AD_ID" />`
- `android/app/build.gradle` sets `manifestPlaceholders.admob_app_id` using:
  - Gradle property `ADMOB_APP_ID` (preferred), or
  - Environment variable `ADMOB_APP_ID`, otherwise
  - Falls back to Google Test App ID: `ca-app-pub-3940256099942544~3347511713`

No further changes needed in the manifest.

## 2) Provide your real App ID

Use either option when building:

Option A – Pass a Gradle property (works everywhere):
- macOS/Linux: `./gradlew assembleRelease -PADMOB_APP_ID=ca-app-pub-XXXX~YYYY`
- Windows PowerShell: `./gradlew.bat assembleDebug -PADMOB_APP_ID=ca-app-pub-XXXX~YYYY`

Option B – Use environment variable `ADMOB_APP_ID`:
- Windows PowerShell:
  ```powershell
  $env:ADMOB_APP_ID = "ca-app-pub-XXXX~YYYY"; ./gradlew.bat assembleDebug
  ```
- macOS/Linux:
  ```bash
  ADMOB_APP_ID="ca-app-pub-XXXX~YYYY" ./gradlew assembleRelease
  ```

If neither is provided, the Google Test ID will be used.

## 3) Sync and build

Typical flow:
```powershell
# From repo root on Windows PowerShell
npm install
npx cap sync android
# Provide your App ID for native build (replace with your ID)
$env:ADMOB_APP_ID = "ca-app-pub-XXXX~YYYY"; ./android/gradlew.bat -p android assembleDebug
# Or open Android Studio and run the app
```

Requirements:
- JDK 17 (project targets Java 17)
- Android SDK matching `compileSdk` in the project

## 4) Test inside the app

- Launch the Android app (emulator or device)
- Open the route `/test-ads`
- Use the buttons to test Rewarded and Banner flows
- Check logs for initialization and events

Notes:
- Native ads only show in the compiled Android app (not in desktop web)
- In development, the app defaults to Google Test IDs unless you pass real IDs

## 5) Production readiness

- Make sure you pass the real `ADMOB_APP_ID` during CI builds
- Use real Ad Unit IDs via your web config/env for `REWARDED` and `BANNER` as needed by the service layer
- Keep `AD_ID` permission; it’s required by the Google Mobile Ads SDK

## 6) Troubleshooting

- If AdMob fails to initialize, verify:
  - `com.google.android.gms.ads.APPLICATION_ID` is present at runtime (Manifest Merged view in Android Studio)
  - You’re using a valid App ID format (`ca-app-pub-...~...`)
  - Device has Google Play Services and network connectivity
- If build fails about Java, ensure JDK 17 is used
