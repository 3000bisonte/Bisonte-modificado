# Google Authentication with Capacitor

Esta configuración permite usar Google Authentication en aplicaciones Capacitor usando `@capacitor-firebase/authentication`.

## ✅ Configuración Completada

### Paquetes Instalados
- `@capacitor-firebase/authentication` - Plugin oficial para Capacitor v7
- Compatible with existing Capacitor v7 setup

### Archivos Creados

#### 1. Core Authentication Library
- `src/lib/capacitor-google-auth.ts` - Main Google Auth class
- `src/hooks/useGoogleAuth.ts` - React hook for components
- `src/components/GoogleAuthButton.tsx` - Ready-to-use component

#### 2. API Integration
- `src/app/api/auth/capacitor-google/route.js` - Backend endpoint for Capacitor auth

## 🚀 Configuración Pendiente

### 1. Firebase Configuration

Crear `capacitor.config.ts` con configuración de Firebase:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bisonte.logistica',
  appName: 'Bisonte Logística',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  }
};

export default config;
```

### 2. Android Configuration

En `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Bisonte Logística</string>
    <string name="title_activity_main">Bisonte Logística</string>
    <string name="package_name">com.bisonte.logistica</string>
    
    <!-- Google Services -->
    <string name="default_web_client_id">TU_GOOGLE_CLIENT_ID_AQUI</string>
</resources>
```

### 3. Firebase Setup

1. **Google Console**: Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. **Android App**: Agregar app Android con package `com.bisonte.logistica`
3. **Download**: Descargar `google-services.json` → `android/app/`
4. **Web Client**: Copiar Web Client ID para `strings.xml`

### 4. Environment Variables

En `.env` y `.env.local`:

```bash
# Google OAuth (ya configurado)
GOOGLE_CLIENT_ID=tu_web_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui

# Firebase (nuevo)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
```

## 📱 Uso en Componentes

### Ejemplo Básico

```tsx
import { GoogleAuthButton } from '@/components/GoogleAuthButton';

export default function LoginPage() {
  return (
    <div className="login-container">
      <h1>Iniciar Sesión</h1>
      
      {/* Web login form */}
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      
      {/* Google Auth (only works on mobile) */}
      <GoogleAuthButton />
    </div>
  );
}
```

### Hook Personalizado

```tsx
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function MyComponent() {
  const { 
    isSignedIn, 
    user, 
    isLoading, 
    signIn, 
    signOut,
    isCapacitor 
  } = useGoogleAuth();

  if (!isCapacitor) {
    return <p>Disponible solo en móvil</p>;
  }

  if (isSignedIn) {
    return (
      <div>
        <p>Hola, {user?.name}!</p>
        <button onClick={signOut}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <button onClick={signIn} disabled={isLoading}>
      {isLoading ? 'Cargando...' : 'Iniciar con Google'}
    </button>
  );
}
```

## 🔧 Build & Deploy

### Capacitor Build

```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync

# Build Android
npx cap build android

# Open in Android Studio
npx cap open android
```

### Variables de Producción

Configura en Vercel/Netlify:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` 
- `NEXT_PUBLIC_FIREBASE_*` variables

## ✨ Características

- ✅ **Detección de Plataforma**: Funciona solo en móvil, muestra mensaje en web
- ✅ **Estado Persistente**: Mantiene sesión entre reinicios de app
- ✅ **Integración NextAuth**: Se conecta con el sistema de auth existente
- ✅ **Error Handling**: Manejo robusto de errores
- ✅ **TypeScript**: Completamente tipado
- ✅ **Loading States**: Estados de carga para mejor UX

## 🐛 Troubleshooting

### Error: "Plugin not found"
- Verificar que Firebase esté configurado
- Ejecutar `npx cap sync`

### Error: "Authentication failed"
- Revisar Client ID en `strings.xml`
- Verificar fingerprint SHA1 en Firebase Console

### Error: "Not in Capacitor environment"
- Normal en web, solo funciona en app móvil
- Usar login web para desarrollo

## 🚀 Próximos Pasos

1. **Configurar Firebase** (más importante)
2. **Testear en Android** 
3. **Configurar iOS** (si necesario)
4. **Deploy a producción**

La implementación está **lista para usar** una vez completada la configuración de Firebase.