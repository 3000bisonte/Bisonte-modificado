# 🚀 Guía Completa para Publicar en Google Play Store

## ✅ Estado Actual de la Aplicación

### Configuración Completada

- ✅ **App ID**: `com.bisonteapp`
- ✅ **Nombre**: Bisonte Logística
- ✅ **Versión**: 1.0.5 (versionCode: 5)
- ✅ **Permisos**: INTERNET, ACCESS_NETWORK_STATE
- ✅ **Iconos**: Todos los tamaños generados (mipmap-*)
- ✅ **Splash Screens**: Generados para todas las densidades
- ✅ **Firebase**: Configurado con google-services.json
- ✅ **AdMob**: App ID de producción configurado
- ✅ **Deep Links**: Configurados para MercadoPago y navegación

---

## 📋 Pasos para Publicar

### 1. Generar Keystore para Firma de Release

El keystore es necesario para firmar tu APK/AAB de producción. **Guarda este archivo de forma segura**.

```powershell
# Navegar a la carpeta android/app
cd android\app

# Generar keystore (ejecutar en PowerShell)
keytool -genkeypair -v -storetype PKCS12 -keystore bisonte-release-key.keystore -alias bisonte-key -keyalg RSA -keysize 2048 -validity 10000
```

**Datos requeridos**:
- Password del keystore: `[CREAR_PASSWORD_SEGURO]`
- Password de la key: `[MISMO_PASSWORD_O_DIFERENTE]`
- Nombre y apellido: Tu nombre o nombre de la empresa
- Unidad organizacional: Desarrollo
- Organización: Bisonte Logística
- Ciudad, Estado, País: Tus datos

**⚠️ IMPORTANTE**: 
- Guarda el archivo `bisonte-release-key.keystore` en un lugar seguro
- Anota las contraseñas en un gestor de contraseñas
- **Si pierdes este archivo, NO podrás actualizar la app en Play Store**

---

### 2. Configurar gradle.properties

Crear o editar el archivo `android/gradle.properties` con las credenciales del keystore:

```properties
# Signing Config
MYAPP_UPLOAD_STORE_FILE=bisonte-release-key.keystore
MYAPP_UPLOAD_STORE_PASSWORD=TU_PASSWORD_KEYSTORE
MYAPP_UPLOAD_KEY_ALIAS=bisonte-key
MYAPP_UPLOAD_KEY_PASSWORD=TU_PASSWORD_KEY
```

**⚠️ SEGURIDAD**: 
- NO subas este archivo a Git
- Asegúrate de que `gradle.properties` esté en `.gitignore`

---

### 3. Sincronizar Capacitor y Preparar Build

```powershell
# Desde la raíz del proyecto
npm run build

# Copiar archivos web a Android
npx cap sync android

# O sincronizar solo Android
npx cap copy android
npx cap update android
```

---

### 4. Generar Android App Bundle (AAB)

El formato AAB es **obligatorio** para nuevas apps en Play Store desde agosto 2021.

#### Opción A: Con Android Studio (Recomendado)

1. Abrir el proyecto Android:
   ```powershell
   npx cap open android
   ```

2. En Android Studio:
   - Build → Generate Signed Bundle / APK
   - Seleccionar "Android App Bundle"
   - Seleccionar el keystore creado
   - Ingresar las contraseñas
   - Seleccionar "release" como build variant
   - Esperar a que se genere

3. El AAB estará en: `android/app/release/app-release.aab`

#### Opción B: Desde Terminal (Avanzado)

```powershell
cd android

# Limpiar builds anteriores
.\gradlew clean

# Generar AAB firmado
.\gradlew bundleRelease

# El archivo estará en: app/build/outputs/bundle/release/app-release.aab
```

---

### 5. Verificar el AAB Generado

```powershell
# Verificar la firma del AAB
jarsigner -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab

# Debería mostrar:
# jar verified.
```

**Tamaño esperado**: Entre 15-30 MB (antes de optimizaciones de Play Store)

---

## 📱 Requisitos de Play Store Console

### 1. Crear Cuenta de Desarrollador

- **URL**: https://play.google.com/console
- **Costo**: $25 USD (pago único de por vida)
- **Documentos**: ID, información de pago

### 2. Screenshots Requeridos

Debes tomar capturas de pantalla en diferentes tamaños:

#### 📱 Teléfono (OBLIGATORIO)
- **Cantidad**: Mínimo 2, máximo 8
- **Formato**: JPG o PNG de 24 bits
- **Dimensiones**: 
  - 16:9 → 1920x1080 o 3840x2160
  - 9:16 → 1080x1920 o 2160x3840

**Screens recomendadas para capturar**:
1. ✅ Pantalla de inicio/home
2. ✅ Cotizador (formulario principal)
3. ✅ Resumen de envío
4. ✅ Página de pago MercadoPago
5. ✅ Mis envíos (historial)
6. ✅ Perfil de usuario
7. ✅ Seguimiento de envío (opcional)
8. ✅ Confirmación de pago (opcional)

#### 📱 Tablet 7" (Opcional pero Recomendado)
- **Dimensiones**: 1024x600, 1920x1200, 2560x1600

#### 📱 Tablet 10" (Opcional pero Recomendado)
- **Dimensiones**: 1280x800, 1920x1200, 2560x1600

**Tip**: Usa el emulador de Android Studio para capturar diferentes tamaños

---

### 3. Gráfico de Funciones (Feature Graphic)

- **Dimensiones**: 1024 x 500 px (EXACTAS)
- **Formato**: JPG o PNG de 24 bits
- **Uso**: Banner principal en Play Store
- **Contenido sugerido**: 
  - Logo de Bisonte Logística
  - Texto: "Envíos rápidos y seguros"
  - Colores corporativos (teal/azul)

**Herramientas**:
- Canva: https://www.canva.com (plantillas para Play Store)
- Figma: Para diseño personalizado
- Photoshop/GIMP

---

### 4. Ícono de Alta Resolución

- **Dimensiones**: 512 x 512 px
- **Formato**: PNG de 32 bits con canal alfa
- **Contenido**: Logo de Bisonte sin bordes

Ya tienes el icono en: `resources/icon.png` - solo verifica que sea 512x512

---

### 5. Descripción de la App

#### Título (Máximo 50 caracteres)
```
Bisonte Logística - Envíos Rápidos
```

#### Descripción Corta (Máximo 80 caracteres)
```
Cotiza, paga y envía tus paquetes de forma rápida y segura
```

#### Descripción Completa (Máximo 4000 caracteres)

```
🚚 BISONTE LOGÍSTICA - Tu solución completa para envíos

Bisonte Logística es la aplicación definitiva para gestionar todos tus envíos de forma simple, rápida y segura. Cotiza, paga y rastrea tus paquetes desde tu celular.

✨ CARACTERÍSTICAS PRINCIPALES

📦 COTIZACIÓN INSTANTÁNEA
• Calcula el costo de tu envío en segundos
• Compara tarifas de diferentes transportadoras
• Precios transparentes sin costos ocultos

💳 PAGOS SEGUROS CON MERCADOPAGO
• Paga con tarjeta de crédito o débito
• PSE (Pago Seguro en Línea)
• Múltiples métodos de pago disponibles
• Transacciones 100% seguras

📍 GESTIÓN COMPLETA DE ENVÍOS
• Ingresa datos de remitente y destinatario fácilmente
• Guarda direcciones frecuentes
• Edita información antes de confirmar
• Recibe notificaciones en tiempo real

🔍 SEGUIMIENTO EN VIVO
• Rastrea tus paquetes en tiempo real
• Historial completo de todos tus envíos
• Notificaciones de cambios de estado
• Comprobantes digitales

👤 PERFIL PERSONALIZADO
• Auto-completa datos desde tu perfil
• Guarda información de contacto
• Direcciones predeterminadas
• Edita tu información cuando quieras

🎯 ¿POR QUÉ ELEGIR BISONTE?

✓ Interfaz intuitiva y fácil de usar
✓ Proceso de envío en menos de 5 minutos
✓ Soporte al cliente 24/7
✓ Integración con las mejores transportadoras
✓ Precios competitivos
✓ 100% seguro y confiable

📱 FUNCIONALIDADES

• Cotizador inteligente con tarifas en tiempo real
• Sistema de pago integrado con MercadoPago
• Gestión de remitentes y destinatarios
• Historial completo de envíos
• Notificaciones push
• Modo offline para consultar información guardada
• Autenticación segura con Google Sign-In

🔒 SEGURIDAD Y PRIVACIDAD

Tus datos están protegidos con los más altos estándares de seguridad:
• Encriptación end-to-end
• Autenticación segura con Firebase
• Cumplimiento con políticas de privacidad
• Datos almacenados de forma segura

💬 SOPORTE

¿Necesitas ayuda? Contáctanos:
• Email: soporte@bisonteapp.com
• Web: https://www.bisonteapp.com
• WhatsApp: [NÚMERO_DE_SOPORTE]

📈 ÚNETE A MILES DE USUARIOS

Miles de personas ya confían en Bisonte Logística para sus envíos. 
¡Descarga ahora y descubre lo fácil que es enviar paquetes!

---

Bisonte Logística - Conectando Colombia 🇨🇴
```

---

### 6. Categoría y Tipo de Contenido

- **Categoría**: Negocios
- **Tipo de aplicación**: Aplicación
- **Clasificación de contenido**: 
  - Para todas las edades (E - Everyone)
  - Sin violencia, contenido sexual, lenguaje ofensivo

---

### 7. Política de Privacidad

**OBLIGATORIO** - Debes tener una URL pública con tu política de privacidad.

Ya tienes la página en: `https://www.bisonteapp.com/politica-datos`

**Verificar que incluya**:
- Qué datos recopilas
- Cómo usas los datos
- Con quién compartes los datos
- Cómo los usuarios pueden solicitar eliminación de datos
- Información de contacto

---

### 8. Configuración de Precios

- **Tipo**: Aplicación gratuita
- **Contiene anuncios**: SÍ (AdMob configurado)
- **Compras en la app**: NO (los pagos son por servicios de envío, no IAP)
- **Países de distribución**: Colombia (o selecciona todos los países)

---

## 🚀 Proceso de Carga en Play Console

### Paso 1: Crear Nueva Aplicación

1. Ir a Play Console: https://play.google.com/console
2. Click en "Crear aplicación"
3. Llenar datos básicos:
   - Nombre: Bisonte Logística
   - Idioma predeterminado: Español (Latinoamérica)
   - Tipo: Aplicación
   - Gratis/Pago: Gratis

### Paso 2: Configurar Ficha de Play Store

En el menú lateral, completar todas las secciones:

#### a) Información principal
- Título de la app
- Descripción corta
- Descripción completa
- Ícono (512x512)
- Gráfico de funciones (1024x500)
- Categoría

#### b) Recursos gráficos
- Capturas de pantalla de teléfono (mínimo 2)
- Capturas de tablet 7" (opcional)
- Capturas de tablet 10" (opcional)
- Video de YouTube (opcional pero recomendado)

#### c) Datos de contacto
- Email: soporte@bisonteapp.com
- Sitio web: https://www.bisonteapp.com
- Teléfono: [OPCIONAL]

#### d) Política de privacidad
- URL: https://www.bisonteapp.com/politica-datos

### Paso 3: Clasificación de Contenido

1. Ir a "Clasificación de contenido"
2. Completar cuestionario:
   - ¿Contiene violencia? NO
   - ¿Contiene contenido sexual? NO
   - ¿Contiene lenguaje ofensivo? NO
   - ¿Es una app de noticias? NO
   - ¿Permite interacción entre usuarios? NO
3. Obtener clasificación automática

### Paso 4: Público Objetivo y Contenido

1. **Público objetivo**: 
   - Adultos (18+)
   - Aplicación empresarial/logística

2. **Anuncios**:
   - ¿Contiene anuncios? SÍ
   - Tipo: AdMob (Google Mobile Ads)

3. **Permisos**:
   - Revisar automáticamente desde el AAB
   - Justificar INTERNET (para cotizaciones y pagos)
   - Justificar ACCESS_NETWORK_STATE (para verificar conectividad)

### Paso 5: Crear Nueva Versión

1. Ir a "Producción" → "Crear nueva versión"
2. Subir el AAB: `app-release.aab`
3. Play Store validará el archivo automáticamente
4. Llenar "Notas de la versión":

```
Versión 1.0.5 - Lanzamiento inicial

✨ Novedades:
• Cotizador de envíos en tiempo real
• Integración con MercadoPago para pagos seguros
• Auto-completado de datos desde el perfil
• Gestión completa de envíos
• Seguimiento en tiempo real
• Autenticación con Google Sign-In
• Interfaz intuitiva y moderna

🎯 Características:
• Cotiza y envía en menos de 5 minutos
• Múltiples métodos de pago
• Historial completo de envíos
• Notificaciones en tiempo real
• Soporte 24/7
```

### Paso 6: Revisar y Publicar

1. Play Console verificará todos los requisitos
2. Revisar checklist de publicación
3. Click en "Revisar versión"
4. Si todo está OK, click en "Iniciar implementación en producción"

---

## ⏱️ Tiempos de Revisión

- **Primera publicación**: 2-7 días hábiles
- **Actualizaciones posteriores**: 1-3 días hábiles
- Google puede solicitar información adicional

---

## 🔍 Verificaciones Pre-Publicación

Antes de subir, verifica:

### Funcionalidad
- [ ] La app abre correctamente
- [ ] Login con Google funciona
- [ ] Cotizador calcula correctamente
- [ ] MercadoPago procesa pagos
- [ ] AdMob muestra anuncios
- [ ] Deep links funcionan
- [ ] Navegación es fluida
- [ ] No hay crashes

### Contenido
- [ ] No hay texto placeholder o "Lorem ipsum"
- [ ] No hay errores ortográficos
- [ ] Imágenes cargan correctamente
- [ ] Colores y diseño son consistentes

### Configuración
- [ ] Version code incrementado
- [ ] Firma de release configurada
- [ ] Permisos correctos en manifest
- [ ] google-services.json incluido
- [ ] AdMob App ID es de producción
- [ ] URLs apuntan a producción

---

## 📊 Después de Publicar

### 1. Monitoreo Inicial

- **Consola de Firebase**: Crashes y errores
- **Play Console**: Descargas, calificaciones, reviews
- **Analytics**: Uso de funciones, conversiones

### 2. Responder Reviews

- Responde a comentarios positivos y negativos
- Soluciona problemas reportados
- Actualiza la app regularmente

### 3. Marketing

- Comparte el link de Play Store
- Crea contenido promocional
- Solicita reviews a usuarios satisfechos

---

## 🔗 Enlaces Importantes

- **Play Console**: https://play.google.com/console
- **Firebase Console**: https://console.firebase.google.com
- **AdMob**: https://apps.admob.com
- **Repositorio**: https://github.com/3000bisonte/Bisonte-modificado

---

## 🆘 Solución de Problemas Comunes

### Error: "You uploaded an APK that is signed with a key that is also used to sign APKs"

**Solución**: Genera un nuevo keystore diferente al de debug.

### Error: "You need to use a different package name"

**Solución**: El package name `com.bisonteapp` debe estar disponible. Si está tomado, cambia a `com.bisontelogistica` o similar.

### Error: "Upload failed: APK or Android App Bundle file is malformed"

**Solución**: 
1. Limpia el build: `cd android && .\gradlew clean`
2. Vuelve a generar el AAB
3. Verifica la firma con `jarsigner -verify`

### La app no aparece en Play Store después de publicar

**Solución**: 
- Espera 2-24 horas para que se indexe
- Busca por package name: `com.bisonteapp`
- Verifica que esté en "Producción" no en "Testing"

---

## ✅ Checklist Final

Antes de subir a Play Store:

- [ ] VersionCode incrementado (actualmente en 5)
- [ ] Keystore generado y guardado de forma segura
- [ ] gradle.properties configurado
- [ ] AAB generado y firmado
- [ ] AAB verificado con jarsigner
- [ ] Screenshots tomados (mínimo 2)
- [ ] Feature graphic creado (1024x500)
- [ ] Descripción completa redactada
- [ ] Política de privacidad accesible
- [ ] Clasificación de contenido completada
- [ ] Configuración de AdMob verificada
- [ ] Firebase configurado correctamente
- [ ] App testeada en dispositivo real
- [ ] Todos los links funcionan
- [ ] No hay crashs evidentes

---

## 📞 Soporte

Si necesitas ayuda durante el proceso:

1. **Documentación oficial**: https://support.google.com/googleplay/android-developer
2. **Stack Overflow**: Tag [android-app-bundle]
3. **Capacitor Discord**: https://discord.gg/UPYYRhtyzp

---

**¡Éxito con tu publicación en Google Play Store! 🎉**

*Última actualización: Noviembre 2025*
*Versión de la guía: 1.0*
