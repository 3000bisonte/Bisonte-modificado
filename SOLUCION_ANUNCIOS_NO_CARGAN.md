# 🔧 Solución: Anuncios No Se Están Mostrando

## 📋 Problema Reportado
Los anuncios antes funcionaban pero ahora muestran "No hay anuncios para mostrar"

## 🔍 Causas Identificadas

### 1. **Cooldown Muy Restrictivo** ⏱️
- **Antes**: 5 segundos de cooldown en error
- **Ahora**: 2 segundos de cooldown en error
- **Problema**: El cooldown largo impedía reintentar cargar anuncios rápidamente

### 2. **Single-Flight Bloqueado** 🚫
- Si un intento de carga fallaba, el siguiente intento debía esperar todo el cooldown
- **Solución**: Agregado retorno temprano si el anuncio ya está listo

### 3. **Estado de Inicialización Muy Estricto** ⚠️
- Las verificaciones de inicialización podían bloquear la carga
- **Solución**: Mejorado el logging para ver exactamente dónde falla

### 4. **Posibles Causas Externas**

#### A) **Cuenta de AdMob en Revisión** 🔍
Los anuncios pueden no mostrarse si:
- La cuenta de AdMob es nueva (menos de 24-48h)
- Los Ad Units están en revisión
- Hay cambios recientes en la configuración

**Cómo verificar:**
1. Ir a [AdMob Console](https://apps.admob.com/)
2. Verificar estado de la app
3. Revisar estado de los Ad Units

#### B) **Sin Inventario de Anuncios** 📦
Google puede no tener anuncios para mostrar si:
- La app tiene poco tráfico
- La ubicación geográfica tiene poco inventario
- El nicho/categoría tiene competencia baja

**Esto es NORMAL y no es un error del código**

#### C) **Problema de Red** 🌐
- Sin conexión a internet
- Firewall bloqueando AdMob
- DNS no resolviendo dominios de Google

#### D) **IDs de Test vs Producción** 🔑
En `admob.config.js`:
- **Desarrollo**: Usa IDs de prueba de Google (siempre hay anuncios)
- **Producción**: Usa tus IDs reales (puede no haber inventario)

**Verificar en consola:**
```
NODE_ENV: production
NEXT_PUBLIC_ADMOB_REWARDED_ID: ca-app-pub-1352045169606160/7908962294
```

## ✅ Soluciones Implementadas

### 1. Cooldown Optimizado
```javascript
// Éxito: 1s (antes 2s)
runtimeState.cooldownUntil = Date.now() + 1000;

// Error: 2s (antes 5s)
runtimeState.cooldownUntil = Date.now() + 2000;
```

### 2. Retorno Temprano si Ya Está Listo
```javascript
if (runtimeState.rewardReady) {
  console.log('✅ Anuncio YA está listo - No recargar');
  return true;
}
```

### 3. Herramientas de Debug Mejoradas

#### A) Botón DEBUG Mejorado 📱
Muestra:
- Estado de AdMob Service
- Estado del Componente
- Datos del Envío
- Configuración de IDs
- Cooldown restante
- Última precarga

#### B) Botón FORZAR RECARGA 🔄
- Aparece cuando hay errores
- Ignora cooldowns
- Fuerza recarga inmediata

### 4. Logging Detallado
Ahora muestra:
- Ad Unit ID usado
- Modo Testing activo/inactivo
- Detalles completos del error
- Mensajes específicos para "No fill"

## 🚀 Cómo Usar las Nuevas Herramientas

### Paso 1: Abrir la App en Dispositivo Móvil
Los anuncios **SOLO** funcionan en dispositivos iOS/Android reales

### Paso 2: Ir a Pantalla Resumen
Después de cotizar un envío

### Paso 3: Presionar Botón DEBUG 📱
Se abrirá un alert con información completa:
```
📱 ESTADO DE ANUNCIOS:

🔧 AdMob Service:
  - Inicializado: ✅
  - Anuncio listo: ❌
  - Preparando: ⏸️
  - Cooldown restante: 0s
  - Última precarga: 10:30:45

🎯 Estado del Componente:
  - adState: idle
  - isRewardedReady: ❌
  - adMobInitialized: ✅
  ...
```

### Paso 4: Verificar Causas

#### ✅ Si Anuncio Listo = ✅
El anuncio está cargado, debería aparecer el modal MegaSale

#### ❌ Si Anuncio Listo = ❌
Revisar:
1. **Inicializado = ❌**: AdMob no se inicializó
2. **Testing Mode = ❌**: Estás en producción (puede no haber anuncios)
3. **Cooldown > 0s**: Está en cooldown, espera

### Paso 5: Forzar Recarga (si es necesario)
Si `Anuncio listo = ❌` y `Cooldown = 0s`:
1. Presionar botón **🔄 RECARGAR ANUNCIO**
2. Esperar 3-5 segundos
3. Presionar DEBUG nuevamente
4. Verificar si ahora `Anuncio listo = ✅`

## 📊 Diagnóstico de Problemas

### Escenario 1: "No fill" en Testing Mode
**Síntomas:**
- Testing Mode = ✅
- Error: "No hay anuncios disponibles (No fill)"

**Causa:** IDs de test de Google no tienen anuncios
**Solución:** Cambiar a IDs de producción o esperar

### Escenario 2: "No fill" en Production Mode
**Síntomas:**
- Testing Mode = ❌
- Error: "No hay anuncios disponibles (No fill)"

**Causa:** Google no tiene inventario para tu app/ubicación
**Solución:** Esperar 24-48h, aumentar tráfico de la app

### Escenario 3: AdMob No Inicializado
**Síntomas:**
- Inicializado = ❌
- Error: "AdMob no está inicializado correctamente"

**Causa:** Error en la inicialización de Capacitor
**Solución:** 
1. Verificar que estás en dispositivo real (no web)
2. Verificar instalación de `@capacitor-community/admob`
3. Rebuild de la app nativa

### Escenario 4: Error de Red
**Síntomas:**
- Error: "Error de red al cargar anuncio"

**Causa:** Sin conexión o firewall
**Solución:**
1. Verificar conexión WiFi/datos móviles
2. Desactivar VPN si está activa
3. Reiniciar app

## 🔧 Comandos de Verificación

### Verificar Variables de Entorno
```bash
# En terminal del proyecto
echo $env:NEXT_PUBLIC_ADMOB_APP_ID
echo $env:NEXT_PUBLIC_ADMOB_REWARDED_ID
```

### Ver Logs en Tiempo Real (Android)
```bash
# Conectar dispositivo Android
npx cap run android

# Ver logs filtrados
adb logcat | Select-String "AdMob|admob"
```

### Ver Logs en Tiempo Real (iOS)
```bash
# Abrir Xcode
npx cap open ios

# Ver consola en Xcode > View > Debug Area > Activate Console
```

## 📝 Checklist de Solución

- [ ] **Paso 1**: Presionar botón DEBUG y copiar información
- [ ] **Paso 2**: Verificar `Inicializado = ✅`
- [ ] **Paso 3**: Verificar `Testing Mode` coincide con ambiente
- [ ] **Paso 4**: Si `Anuncio listo = ❌`, presionar FORZAR RECARGA
- [ ] **Paso 5**: Esperar 5 segundos
- [ ] **Paso 6**: Presionar DEBUG nuevamente
- [ ] **Paso 7**: Si sigue `❌`, revisar logs de la app nativa
- [ ] **Paso 8**: Verificar cuenta de AdMob no tenga advertencias

## 🆘 Si Nada Funciona

### Opción 1: Usar IDs de Prueba Temporalmente
Editar `.env.local` o `.env.production`:
```env
# IDs de prueba de Google (SIEMPRE tienen anuncios)
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-3940256099942544~3347511713
NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-3940256099942544/5224354917
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-3940256099942544/6300978111
```

Luego rebuild:
```bash
npm run build
npx cap sync
npx cap run android  # o ios
```

### Opción 2: Verificar en AdMob Console
1. Ir a https://apps.admob.com/
2. Apps > Tu App
3. Verificar:
   - Estado: Active
   - Ad Units: Active
   - Serving Status: Serving (verde)

### Opción 3: Contactar Soporte
Si después de 48h sigues sin anuncios con IDs reales:
1. Ir a AdMob Console
2. Help > Contact Support
3. Describir: "No ad inventory for rewarded ad unit"

## 🎯 Resumen

Los cambios implementados:
1. ✅ Cooldown reducido (5s → 2s)
2. ✅ Retorno temprano si anuncio listo
3. ✅ Botón DEBUG mejorado
4. ✅ Botón FORZAR RECARGA
5. ✅ Logging detallado con IDs

**Próximos pasos:**
1. Rebuild de la app nativa
2. Instalar en dispositivo real
3. Usar botón DEBUG para diagnosticar
4. Compartir resultados del DEBUG

## 📞 Soporte

Si necesitas ayuda adicional, comparte:
1. Screenshot del botón DEBUG
2. Logs de la consola nativa (adb logcat o Xcode)
3. Screenshot de AdMob Console mostrando estado de Ad Units
