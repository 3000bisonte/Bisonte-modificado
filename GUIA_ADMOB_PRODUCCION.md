# 🎯 Guía AdMob para Generar Ingresos en Producción

## 📊 Estado Actual

### ✅ Configuración Detectada
```
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431
NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-1352045169606160/7908962294
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-1352045169606160/7029983134
```

**Tu Cuenta AdMob:** `1352045169606160`

---

## 🚨 CRÍTICO: Configuración para Recibir Pagos

### Paso 1: Verificar que NO estés en Modo Test

#### En Vercel (PRODUCCIÓN):
1. Ve a: https://vercel.com/3000bisonte/bisonte-app/settings/environment-variables
2. **VERIFICA** que las variables de AdMob tengan tus IDs REALES (no los de Google Test):
   ```
   ❌ INCORRECTO (IDs de prueba - NO generan ingresos):
   NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-3940256099942544~3347511713
   
   ✅ CORRECTO (Tus IDs reales - SÍ generan ingresos):
   NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431
   ```

3. **ACTUALIZA** las variables en Vercel con tus IDs reales:
   ```env
   NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431
   NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-1352045169606160/7908962294
   NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-1352045169606160/7029983134
   NODE_ENV=production
   ```

4. **REDEPLOY** después de actualizar:
   ```bash
   git add .
   git commit -m "fix: Configurar AdMob IDs reales en producción"
   git push origin main
   ```

---

### Paso 2: Configurar Tu Cuenta AdMob (Google AdMob Console)

#### A. Verificar Aplicación Registrada
1. Ve a: https://apps.admob.com/
2. **Inicia sesión** con tu cuenta de Google
3. Ve a **"Apps"** → Verifica que aparezca tu app: **"Bisonte Logística"**
4. Si NO aparece:
   - Click en **"Add App"**
   - Selecciona **"Android"**
   - Package Name: `com.bisonteapp`
   - Nombre: `Bisonte Logística`

#### B. Configurar Información de Pago
🔴 **MUY IMPORTANTE**: Sin esto NO recibirás pagos

1. Ve a **"Payments"** en el menú lateral
2. Click en **"Add Payment Method"**
3. Ingresa tu información:
   - **País:** Colombia
   - **Nombre del titular**
   - **Dirección completa**
   - **Método de pago:**
     - **Transferencia bancaria** (recomendado para Colombia)
     - O **Cheque** (más lento)
   - **NIT o Cédula** (para transferencia bancaria)
   - **Banco y número de cuenta**

4. **Umbral de pago**: $100 USD (predeterminado)
   - Cuando acumules $100 USD, Google te pagará automáticamente

#### C. Verificar Estado de la Cuenta
1. Ve a **"Account"** → **"Settings"**
2. Verifica:
   - ✅ **Account Status**: Active
   - ✅ **Payment Information**: Complete
   - ✅ **Address Verification**: Verified (si se requiere)

---

### Paso 3: Configurar Unidades de Anuncios

#### A. Anuncio de Recompensa (Rewarded Ad)
1. Ve a **"Apps"** → **"Bisonte Logística"** → **"Ad units"**
2. Encuentra la unidad: `ca-app-pub-1352045169606160/7908962294`
3. Verifica configuración:
   - **Type**: Rewarded
   - **Status**: Active ✅
   - **eCPM floor**: Puedes establecer un mínimo (ej: $1.00 USD)
   - **Ad filtering**: Revisa categorías sensibles si quieres bloquearlas

#### B. Banner Ad
1. Encuentra: `ca-app-pub-1352045169606160/7029983134`
2. Configuración:
   - **Type**: Banner
   - **Status**: Active ✅
   - **Size**: 320x50 (estándar)

---

## 💰 Cómo Maximizar Ingresos

### 1. eCPM (Ingresos por 1000 impresiones)
- **Rewarded Ads**: $1-$10 USD por 1000 vistas (más rentable)
- **Banner Ads**: $0.50-$3 USD por 1000 impresiones

### 2. Optimización de Anuncios de Recompensa
En tu app, el usuario recibe **$2,013 COP de descuento** por ver un anuncio.

**Estrategia óptima:**
- Muestra anuncios cuando el usuario esté **comprometido** (antes de pagar)
- NO muestres más de **3-5 anuncios por usuario por día** (para evitar fatiga)
- Asegúrate de que el **costo del envío > descuento** (ya lo tienes)

### 3. Medición de Resultados
En AdMob Console:
- Ve a **"Reports"**
- Filtra por:
  - **Ad Unit**: Selecciona tu Rewarded Ad
  - **Date Range**: Últimos 7 días
- Métricas clave:
  - **Impressions**: Número de anuncios vistos
  - **Estimated Earnings**: Ingresos estimados
  - **eCPM**: Ganancia por 1000 impresiones

---

## 🧪 Testing en Producción (Sin Afectar Ingresos)

### Usar Device Test IDs
Para probar sin afectar tus estadísticas:

1. **Obtén tu Device ID de Android:**
   ```bash
   # Conecta tu teléfono y ejecuta:
   adb shell settings get secure android_id
   ```

2. **Agrega tu Device Test ID en `.env.local`:**
   ```env
   NEXT_PUBLIC_ADMOB_TEST_DEVICES=TU_DEVICE_ID_AQUI
   ```

3. **En AdMob Console:**
   - Ve a **"Settings"** → **"Test Devices"**
   - Agrega tu Device ID
   - Tus impresiones NO contarán en estadísticas

---

## ⚠️ Advertencias Importantes

### 1. NO Clicks Fraudulentos
🚨 **NUNCA hagas lo siguiente o Google te suspenderá:**
- ❌ Hacer click en tus propios anuncios
- ❌ Pedir a amigos/familiares que hagan click
- ❌ Usar bots o scripts para generar clicks
- ❌ Recargar la app repetidamente para ver más anuncios

### 2. Cumplimiento de Políticas
Revisa: https://support.google.com/admob/answer/6128543
- ✅ Contenido apropiado
- ✅ No anuncios en apps de menores de 13 años (si aplica)
- ✅ Política de privacidad visible
- ✅ No anuncios engañosos

### 3. Tiempo de Activación
- Después de configurar pagos: **48-72 horas** para activarse completamente
- Primeros datos en reportes: **24 horas** después de las primeras impresiones
- Primer pago: Cuando alcances **$100 USD** (entre el día 21 y fin de mes)

---

## 📈 Ejemplo de Ingresos Estimados

### Escenario: 1000 usuarios activos por mes

**Anuncios de Recompensa:**
- 60% de usuarios ven anuncio = 600 impresiones/mes
- eCPM promedio = $5.00 USD
- Ingresos = (600 / 1000) × $5.00 = **$3.00 USD/mes**

**Con 10,000 usuarios:**
- 6000 impresiones/mes
- Ingresos = **$30.00 USD/mes**

**Con 100,000 usuarios:**
- 60,000 impresiones/mes
- Ingresos = **$300.00 USD/mes**

---

## ✅ Checklist de Configuración

- [ ] Variables de AdMob en Vercel actualizadas con IDs reales
- [ ] App desplegada en producción (www.bisonteapp.com)
- [ ] Cuenta AdMob activa y verificada
- [ ] Información de pago configurada
- [ ] Dirección verificada (si se requiere)
- [ ] Unidades de anuncios activas
- [ ] Device Test ID configurado para testing
- [ ] Política de privacidad visible en la app
- [ ] App publicada en Google Play Store
- [ ] Primeras impresiones generadas
- [ ] Reportes monitoreados en AdMob Console

---

## 🔗 Links Útiles

- **AdMob Console**: https://apps.admob.com/
- **Reportes**: https://apps.admob.com/#reports
- **Configuración de Pagos**: https://apps.admob.com/#payments
- **Políticas de AdMob**: https://support.google.com/admob/answer/6128543
- **Centro de Ayuda**: https://support.google.com/admob/

---

## 🆘 Problemas Comunes

### Problema 1: No veo ingresos después de varios días
**Solución:**
1. Verifica en Vercel que estás usando IDs reales (no de test)
2. Confirma en AdMob Console que las impresiones están registradas
3. Espera 24-48 horas para que aparezcan datos en reportes

### Problema 2: "Cuenta en revisión"
**Solución:**
- Es normal para cuentas nuevas
- Espera 24-72 horas
- Los anuncios seguirán mostrándose y generando ingresos

### Problema 3: No recibo pagos
**Solución:**
1. Verifica que configuraste método de pago
2. Confirma que alcanzaste el umbral ($100 USD)
3. Revisa que tu dirección esté verificada
4. Los pagos se procesan entre el día 21 y fin de mes

---

**Próximo paso:** Ejecuta el script de testing para validar la configuración
```bash
node scripts/test-admob-config.js
```
