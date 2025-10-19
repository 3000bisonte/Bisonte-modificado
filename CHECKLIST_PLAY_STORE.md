# ✅ CHECKLIST DE PUBLICACIÓN EN PLAY STORE

## 📱 **Bisonte Logística v1.0.4**

---

## 🎯 **FASE 1: PREPARACIÓN (30 minutos)**

### 1️⃣ Limpieza de Código (OPCIONAL pero RECOMENDADO)
```bash
# Remover console.logs innecesarios
node scripts/production-cleanup.js

# Verificar que no haya errores
npm run build
```

- [ ] Console.logs removidos
- [ ] Build sin errores
- [ ] Commit de cambios realizados

---

### 2️⃣ Generar APK de Release

**Opción A: Android Studio (RECOMENDADO)**

```bash
# Abrir Android Studio
# File > Open > Seleccionar carpeta android/
```

Luego:
1. [ ] Build > Generate Signed Bundle/APK
2. [ ] Seleccionar "APK"
3. [ ] Choose existing keystore: `android/app/bisonte-release-key.jks`
4. [ ] Key store password: `BisonteApp2024!`
5. [ ] Key alias: `bisonteRelease`
6. [ ] Key password: `BisonteApp2024!`
7. [ ] Seleccionar "release"
8. [ ] Click "Finish"

APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

**Opción B: Línea de Comandos**

```powershell
cd android
.\gradlew assembleRelease
```

- [ ] APK generado exitosamente
- [ ] Tamaño del APK < 50MB
- [ ] APK firmado correctamente

---

### 3️⃣ Probar APK en Dispositivo Real

```bash
# Conectar dispositivo Android por USB
# Habilitar "Depuración USB" en el dispositivo

# Instalar APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Si da error "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
adb uninstall com.bisonteapp
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Flujos a Probar:**

#### Autenticación
- [ ] Registro con email/password
- [ ] Login con email/password
- [ ] Login con Google
- [ ] Recuperar contraseña
- [ ] Cerrar sesión

#### Cotización
- [ ] Completar perfil (si es primera vez)
- [ ] Datos de remitente autollenados
- [ ] Calcular costo de envío
- [ ] Validaciones en tiempo real funcionando

#### Pago
- [ ] Ver anuncio recompensado (descuento 50%)
- [ ] Pagar con tarjeta (MercadoPago)
- [ ] Pagar con PSE
- [ ] Envío gratuito (costo = 0)

#### General
- [ ] Ver "Mis Envíos"
- [ ] Tracking de envío
- [ ] Notificación por email recibida
- [ ] App no se crashea

---

## 🚀 **FASE 2: PLAY STORE (1-2 horas)**

### 1️⃣ Preparar Materiales

#### Capturas de Pantalla (REQUERIDO)
Tomar 4-8 capturas en dispositivo Android:

- [ ] Pantalla de login/inicio
- [ ] Cotizador de envíos
- [ ] Pantalla de pago con MercadoPago
- [ ] Historial "Mis Envíos"
- [ ] Perfil de usuario
- [ ] Tracking de envío (opcional)

**Formato:** PNG o JPG, 16:9 o 9:16  
**Tamaño mínimo:** 320px  
**Tamaño máximo:** 3840px

#### Gráficos

**Ícono de aplicación (REQUERIDO)**
- [ ] Archivo: 512x512px PNG
- [ ] 32-bit con transparencia
- [ ] Ubicación: `public/icon-512.webp` (convertir a PNG)

**Banner de funciones (REQUERIDO)**
- [ ] Tamaño: 1024x500px JPG o PNG
- [ ] Crear en Canva o similar
- [ ] Texto: "Envía paquetes fácil y rápido"

---

### 2️⃣ Crear App en Play Console

**URL:** https://play.google.com/console

1. [ ] Iniciar sesión con cuenta Google de desarrollador
2. [ ] "Crear aplicación"
3. [ ] Nombre: `Bisonte Logística`
4. [ ] Idioma predeterminado: `Español (Colombia)`
5. [ ] Tipo: `Aplicación`
6. [ ] Categoría: `Gratuita`

---

### 3️⃣ Completar Ficha de Play Store

#### **Información de la Aplicación**

**Descripción Corta (80 caracteres)**
```
Envía paquetes fácil y rápido. Calcula, paga y rastrea tus envíos.
```

**Descripción Completa (4000 caracteres)**
```
🚚 Bisonte Logística - Tu Aliado en Envíos

¿Necesitas enviar un paquete? Con Bisonte Logística es fácil, rápido y seguro.

✅ CARACTERÍSTICAS:
• Cotiza tu envío al instante
• Paga con tarjeta, PSE o efectivo
• Rastrea tu paquete en tiempo real
• Envíos gratis viendo anuncios
• Soporte 24/7 por chat

📦 CÓMO FUNCIONA:
1. Ingresa los datos de tu envío
2. Recibe la cotización inmediata
3. Paga con tu método preferido
4. Recibe actualizaciones por email

🎁 BENEFICIOS:
• Descuentos por ver anuncios
• Historial completo de envíos
• Múltiples métodos de pago
• Interfaz intuitiva y moderna

Descarga ahora y envía tu primer paquete en menos de 5 minutos.
```

- [ ] Título agregado
- [ ] Descripción corta agregada
- [ ] Descripción completa agregada

#### **Gráficos**

- [ ] Ícono de aplicación (512x512px) subido
- [ ] Banner de funciones (1024x500px) subido
- [ ] Capturas de pantalla (mínimo 2) subidas

#### **Categorización**

- [ ] Categoría: `Productividad`
- [ ] Etiquetas: `envíos`, `logística`, `paquetería`

---

### 4️⃣ Clasificación de Contenido

**Completar Cuestionario:**

- [ ] ¿Contiene violencia? **NO**
- [ ] ¿Contiene sexo? **NO**
- [ ] ¿Contiene lenguaje fuerte? **NO**
- [ ] ¿Permite interacción entre usuarios? **NO**
- [ ] ¿Contiene anuncios? **SÍ** (AdMob)
- [ ] ¿Los anuncios son apropiados? **SÍ**

**Clasificación Final:** PEGI 3 / Everyone

- [ ] Cuestionario completado
- [ ] Clasificación aprobada

---

### 5️⃣ Política de Privacidad ✅ (YA PUBLICADA)

**URL:** https://www.bisonteapp.com/politica-datos/

**Estado:** ✅ COMPLETA - Cumple con Ley 1581 de 2012 (Colombia)

**Contenido incluido:**
- ✅ Normatividad legal (Ley 1581 de 2012)
- ✅ Definiciones (Autorización, Base de Datos, Titular, etc.)
- ✅ Finalidad del tratamiento de datos
- ✅ Principios (finalidad, libertad, veracidad, seguridad)
- ✅ Responsable del tratamiento (Bisonte)
- ✅ Derechos de los titulares (Habeas Data)
- ✅ Datos de menores y sensibles
- ✅ Deberes de Bisonte
- ✅ Procedimiento de consultas y reclamos
- ✅ Medidas de seguridad
- ✅ Autorización de consulta a centrales de riesgo

- [x] ✅ Página de privacidad creada
- [ ] URL agregada en Play Console: `https://www.bisonteapp.com/politica-datos/`

---

### 6️⃣ Subir APK

**Producción > Crear nueva versión**

1. [ ] Subir `app-release.apk`
2. [ ] Nombre de la versión: `1.0.4`
3. [ ] Código de versión: `4`

**Notas de la Versión:**
```
Primera versión de Bisonte Logística

✨ Novedades:
• Sistema de cotización de envíos
• Pagos con MercadoPago (tarjeta, PSE, efectivo)
• Tracking en tiempo real
• Anuncios recompensados para descuentos del 50%
• Notificaciones por email
• Historial completo de envíos
```

- [ ] APK subido correctamente
- [ ] Notas agregadas

---

### 7️⃣ Precios y Distribución

- [ ] Precio: **Gratis**
- [ ] Países: **Colombia** (expandir después)
- [ ] Compras dentro de la app: **NO**
- [ ] Contiene anuncios: **SÍ**

---

### 8️⃣ Revisión Final

**Antes de enviar, verificar:**

- [ ] Toda la información es correcta
- [ ] Capturas de pantalla subidas
- [ ] Política de privacidad válida
- [ ] APK firmado correctamente
- [ ] Clasificación de contenido completa
- [ ] Descripción sin errores ortográficos

---

### 9️⃣ Enviar a Revisión

1. [ ] Click en "Enviar a revisión"
2. [ ] Confirmar todos los avisos
3. [ ] Esperar email de confirmación

**Tiempo estimado de revisión:** 1-7 días

---

## 📊 **POST-PUBLICACIÓN**

### Después de Aprobación

- [ ] Recibir email de "App publicada"
- [ ] Verificar en Play Store: https://play.google.com/store/apps/details?id=com.bisonteapp
- [ ] Descargar app desde Play Store (verificación final)
- [ ] Compartir enlace con usuarios beta
- [ ] Monitorear crashes en Play Console
- [ ] Responder a reseñas de usuarios

---

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### APK Rechazado: "Firma inválida"
```bash
# Regenerar APK con keystore correcto
cd android
./gradlew clean
./gradlew assembleRelease
```

### APK Rechazado: "Permisos peligrosos"
- Verificar `AndroidManifest.xml`
- Solo debe tener `INTERNET`

### APK Rechazado: "Política de privacidad inválida"
- La URL debe ser accesible públicamente
- Debe contener información real sobre datos recopilados

### Build falla con error de Java
```bash
# Usar JDK 17 (ya configurado en gradle.properties)
java -version  # Verificar versión
```

### App se crashea en dispositivo
```bash
# Ver logs detallados
adb logcat | findstr "AndroidRuntime"
```

---

## 📞 **RECURSOS DE AYUDA**

- **Play Console:** https://play.google.com/console
- **Guía oficial Google:** https://support.google.com/googleplay/android-developer
- **Política de desarrollador:** https://play.google.com/about/developer-content-policy/
- **Centro de ayuda:** https://support.google.com/googleplay/android-developer/answer/9859455

---

## ✅ **CHECKLIST RESUMEN**

**Pre-publicación:**
- [ ] Console.logs limpiados (opcional)
- [ ] APK de release generado
- [ ] APK probado en dispositivo real

**Play Store:**
- [ ] Cuenta de desarrollador activa ($25 USD pago único)
- [ ] App creada en Play Console
- [ ] Información completa (título, descripción)
- [ ] Gráficos subidos (ícono, banner, capturas)
- [ ] Clasificación de contenido completada
- [x] ✅ Política de privacidad publicada (https://www.bisonteapp.com/politica-datos/)
- [ ] APK subido
- [ ] Precios y distribución configurados
- [ ] App enviada a revisión

**Post-publicación:**
- [ ] Email de aprobación recibido
- [ ] App verificada en Play Store
- [ ] Enlace compartido con usuarios

---

**¡Buena suerte con la publicación!** 🚀

Si tienes algún problema, revisa `REPORTE_PRE_PRODUCCION_PLAY_STORE.md` para más detalles técnicos.
