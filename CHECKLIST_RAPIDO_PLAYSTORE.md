# 📋 CHECKLIST RÁPIDO - PLAY STORE v1.0.5
**Última actualización: Noviembre 12, 2025**

---

## ✅ ANTES DE GENERAR EL AAB

### Configuración Básica
- [x] Version Code: 5 (en build.gradle)
- [x] Version Name: 1.0.5 (en build.gradle y package.json)
- [x] App ID: com.bisonteapp
- [x] Nombre: Bisonte Logística

### Seguridad
- [ ] Keystore generado y respaldado
- [ ] gradle.properties configurado con credenciales
- [ ] gradle.properties en .gitignore
- [ ] NO commiteaste contraseñas a Git

### Build
- [ ] `npm install` exitoso
- [ ] `npm run build` exitoso
- [ ] `npx cap sync android` exitoso
- [ ] NO hay errores en la compilación

---

## 📱 GENERAR AAB

### Opción 1: Android Studio (Recomendado)
```powershell
npx cap open android
```
Luego: Build → Generate Signed Bundle / APK → Android App Bundle

### Opción 2: Terminal
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

### Verificar AAB
```powershell
jarsigner -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab
```
Debe decir: "jar verified."

---

## 🎨 ASSETS PARA PLAY STORE

### Obligatorios
- [ ] 2+ Screenshots (1080x1920 o 1920x1080)
- [ ] Feature Graphic (1024x500)
- [ ] Ícono alta resolución (512x512)
- [ ] Descripción completa
- [ ] Política de privacidad URL

### Capturas Sugeridas
1. Pantalla de inicio
2. Cotizador
3. Formulario remitente
4. Resumen y pago
5. Historial de envíos

---

## 🧪 TESTING CRÍTICO

- [ ] App se instala en dispositivo real
- [ ] Login con Google funciona
- [ ] Cotizador calcula correctamente
- [ ] MercadoPago procesa pagos
- [ ] AdMob muestra anuncios
- [ ] NO hay crashes evidentes

---

## 🚀 SUBIR A PLAY CONSOLE

1. Ir a: https://play.google.com/console
2. Producción → Crear nueva versión
3. Subir AAB: `android/app/build/outputs/bundle/release/app-release.aab`
4. Completar notas de versión
5. Revisar y publicar

**Tiempo estimado de revisión**: 2-7 días

---

## 📞 SI ALGO FALLA

### Error de firma
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

### Error de Capacitor
```powershell
npx cap sync android --force
```

### Build no funciona
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run build
npx cap sync android
```

---

## 📖 RECURSOS

- **Guía completa**: Ver `GUIA_PLAY_STORE_COMPLETA.md`
- **Script automático**: Ejecutar `.\preparar-play-store.ps1`
- **Template gradle**: Ver `gradle.properties.template`

---

**¡Éxito con tu publicación! 🎉**
