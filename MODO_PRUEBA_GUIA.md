# 🧪 Modo Prueba - Envíos Gratuitos Temporales

## ✅ Estado Actual

**🟢 MODO PRUEBA ACTIVO**

Todos los envíos son **GRATUITOS** (costo $0) independientemente del peso, dimensiones o destino.

---

## 🎯 ¿Para Qué Sirve?

El modo prueba te permite:
- ✅ Probar el flujo completo de envíos sin pagar
- ✅ Verificar que el registro de envíos funciona correctamente
- ✅ Testear la integración con Mercado Pago (aunque no se procesará pago real)
- ✅ Validar que los envíos aparecen en "Mis Envíos"
- ✅ Probar el sistema de anuncios para descuentos

---

## 🔧 Cómo Activar/Desactivar

### **Método 1: Archivo de Configuración (Recomendado)**

Edita el archivo: `src/config/testMode.js`

```javascript
export const TEST_MODE = {
  // 🧪 Cambiar a false para DESACTIVAR modo prueba
  FORCE_FREE_SHIPPING: true,  // ← Cambiar este valor
  
  VERBOSE_LOGGING: true,
  TEST_MODE_MESSAGE: "🧪 MODO PRUEBA: Todos los envíos son gratuitos temporalmente",
};
```

**Para ACTIVAR modo prueba:**
```javascript
FORCE_FREE_SHIPPING: true,  // ✅ Envíos gratis
```

**Para DESACTIVAR modo prueba:**
```javascript
FORCE_FREE_SHIPPING: false,  // ❌ Cobra normalmente
```

### **Método 2: Variables de Entorno (Alternativo)**

También puedes controlarlo con una variable de entorno en `.env.local`:

```bash
# Agregar esta línea para activar modo prueba
NEXT_PUBLIC_TEST_MODE=true

# O comentarla/eliminarla para desactivar
# NEXT_PUBLIC_TEST_MODE=true
```

---

## 🎨 Indicadores Visuales

Cuando el modo prueba está **ACTIVO**, verás:

### **1. Banner en el Cotizador**
```
⚠️ 🧪 MODO PRUEBA: Todos los envíos son gratuitos temporalmente
   Para desactivar, edita: src/config/testMode.js
```

### **2. Advertencia en Console (F12)**
```
⚠️ ADVERTENCIA: MODO PRUEBA ACTIVO ⚠️
🧪 Todos los envíos son GRATUITOS. 
   Recuerda desactivar TEST_MODE.FORCE_FREE_SHIPPING 
   antes de ir a producción.
📝 Archivo a modificar: src/config/testMode.js
```

### **3. Logs de Cálculo**
```javascript
🧪 MODO PRUEBA ACTIVO: 
   Costo calculado: $35,000 → Aplicando: $0 (GRATIS)
```

---

## 📋 Flujo de Testing

### **Con Modo Prueba ACTIVO (Recomendado para ahora)**

1. **Cotizador**
   - Llena todos los campos
   - Ve que muestra "Costo Total: $0" (aunque debería ser más)
   - Banner naranja indica que está en modo prueba

2. **Resumen**
   - Verás "Envío GRATUITO" 
   - Botón dice "Confirmar Envío Gratis"
   - NO muestra botón de "Pagar con Mercado Pago"
   - NO muestra opción de ver anuncios

3. **Registro**
   - Al confirmar, se registra el envío con:
     - `metodoPago: "GRATUITO"`
     - `montoTotal: 0`
     - `pagado: true`
     - `PaymentId: "FREE-xxxxx"`

4. **Mis Envíos**
   - El envío aparece inmediatamente
   - Muestra como "Envío Gratuito"

### **Con Modo Prueba DESACTIVADO (Producción)**

1. **Cotizador**
   - Llena todos los campos
   - Muestra costo real calculado (ej: $35,000)
   - NO aparece banner naranja

2. **Resumen**
   - Si costo > 0: Muestra botón "Pagar con Mercado Pago"
   - Muestra opción de ver anuncios para descuento
   - Solo si después de anuncios llega a $0, permite envío gratis

3. **Mercado Pago**
   - Redirige a página de pago
   - Muestra formulario Payment Brick
   - Procesa pago real con tarjeta

4. **Mis Envíos**
   - El envío aparece después de pago aprobado
   - Muestra `PaymentId` real de Mercado Pago

---

## 🚀 Cuándo Desactivar el Modo Prueba

**DESACTIVA el modo prueba cuando:**
- ✅ Ya terminaste de probar el flujo completo
- ✅ Verificaste que los envíos se registran correctamente
- ✅ Probaste que aparecen en "Mis Envíos"
- ✅ Estás listo para recibir pagos reales
- ✅ Vas a lanzar a producción

**MANTÉN ACTIVO el modo prueba si:**
- 🔄 Aún estás probando funcionalidades
- 🔄 Quieres mostrar demo a clientes sin cobrar
- 🔄 Estás testeando la interfaz
- 🔄 No has configurado Mercado Pago en producción

---

## ⚠️ IMPORTANTE: Antes de Producción

### **Checklist Pre-Producción**

- [ ] Desactivar modo prueba (`FORCE_FREE_SHIPPING: false`)
- [ ] Verificar variables de MP en producción:
  - [ ] `MP_ENVIRONMENT=production`
  - [ ] `MP_ACCESS_TOKEN_PROD` configurado
  - [ ] `NEXT_PUBLIC_MP_PUBLIC_KEY_PROD` configurado
- [ ] Hacer commit y push de cambios
- [ ] Esperar deploy de Vercel
- [ ] Probar un pago real con tarjeta de prueba
- [ ] Verificar que cálculo de costos funciona bien
- [ ] Confirmar que pagos se registran correctamente

---

## 🔍 Verificación Rápida

### **¿Cómo sé si está activo o no?**

**Modo Prueba ACTIVO:**
```javascript
// En Console (F12)
⚠️ ADVERTENCIA: MODO PRUEBA ACTIVO ⚠️

// En Cotizador
[Banner naranja visible]
Costo Total: $0 (siempre)

// En Resumen
Botón: "Confirmar Envío Gratis"
```

**Modo Prueba DESACTIVADO:**
```javascript
// En Console (F12)
[Sin advertencia de modo prueba]

// En Cotizador
[Sin banner naranja]
Costo Total: $35,000 (costo real)

// En Resumen
Botón: "Pagar con Mercado Pago"
```

---

## 📝 Registro de Cambios

### **15 de Octubre, 2025**
- ✅ Creado sistema de modo prueba centralizado
- ✅ Agregado `src/config/testMode.js`
- ✅ Implementado banner visual en cotizador
- ✅ Agregados logs en console
- ✅ Actualizado `Cotizador.js` para usar configuración
- ✅ **Estado inicial: ACTIVO** para facilitar testing

---

## 🎓 Ejemplos de Uso

### **Ejemplo 1: Desarrollo Local**
```javascript
// testMode.js
FORCE_FREE_SHIPPING: true  // ✅ Gratis para probar rápido
```

### **Ejemplo 2: Demo para Cliente**
```javascript
// testMode.js
FORCE_FREE_SHIPPING: true  // ✅ Demo sin cobrar
TEST_MODE_MESSAGE: "🎁 Demo: Envíos gratuitos para esta presentación"
```

### **Ejemplo 3: Producción**
```javascript
// testMode.js
FORCE_FREE_SHIPPING: false  // ❌ Cobra normalmente
```

---

## 📞 Preguntas Frecuentes

**P: ¿Los envíos en modo prueba se guardan en la base de datos?**  
R: Sí, se guardan normalmente con `metodoPago: "GRATUITO"` y `montoTotal: 0`.

**P: ¿Puedo desactivar el modo prueba sin hacer deploy?**  
R: Solo si estás en desarrollo local. En Vercel necesitas hacer commit y push.

**P: ¿El modo prueba afecta los anuncios de AdMob?**  
R: No, los anuncios funcionan igual. Pero como el costo ya es $0, no tiene sentido verlos para descuento.

**P: ¿Qué pasa si olvido desactivarlo en producción?**  
R: Todos los envíos serán gratis y perderás dinero. Por eso hay advertencias visuales.

---

**Archivo de Configuración:** `src/config/testMode.js`  
**Última Actualización:** 15 de Octubre, 2025  
**Estado Actual:** 🟢 **ACTIVO** (Envíos Gratuitos)
