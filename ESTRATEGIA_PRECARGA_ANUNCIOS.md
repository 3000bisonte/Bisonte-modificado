# 🚀 ESTRATEGIA DE PRECARGA DE ANUNCIOS

## Objetivo
Tener anuncios listos ANTES de que el usuario llegue a la página de Resumen.

## Flujo de Precarga

### 1️⃣ **Home Page (Inicio)**
```
Usuario llega a Home
      ↓ (inmediato - 100ms)
🚀 AdPreloader.js se activa
      ↓
📺 Inicia carga de anuncio en segundo plano
      ↓
Usuario navega por la app (cotizador, etc.)
      ↓
⏳ Anuncio se carga mientras usuario usa la app
```

### 2️⃣ **Resumen Page**
```
Usuario llega a Resumen
      ↓
¿Anuncio ya cargado?
      ↓
✅ SÍ → Mostrar "Mega Sale" inmediatamente (0s de espera)
      ↓
❌ NO → Mostrar modal "Cargando..." (máximo 5s)
```

## Tiempos de Carga

| Escenario | Sin Precarga | Con Precarga desde Home |
|-----------|--------------|-------------------------|
| **Usuario rápido** (10s en cotizador) | Espera 3-5s en Resumen | **Anuncio ya listo** ✅ |
| **Usuario normal** (30s en cotizador) | Espera 3-5s en Resumen | **Anuncio ya listo** ✅ |
| **Usuario lento** (60s+ en cotizador) | Espera 3-5s en Resumen | **Anuncio ya listo** ✅ |
| **Red muy lenta** | Espera hasta timeout (5s) | Ya tiene más tiempo para cargar |

## Beneficios

### ✅ **Para el Usuario**
- **Experiencia instantánea** en Resumen
- **No esperas** frustrantes
- **Modal "Cargando"** aparece solo si el anuncio aún no está listo
- **Máximo 5s de espera** (vs potencialmente 1 minuto antes)

### ✅ **Para el Negocio**
- **Mayor tasa de conversión** en ver anuncios
- **Menos abandonos** por espera
- **Mejor UX** = usuarios más felices
- **Más descuentos aplicados** = más ventas

### ✅ **Técnico**
- **Precarga inteligente** solo para usuarios autenticados
- **No bloquea la UI** del Home
- **Cache persistente** - una vez cargado, rápido en todo momento
- **Tracking completo** con métricas de performance

## Configuración Actual

```javascript
// AdPreloader.js
- Tiempo de espera antes de precargar: 100ms (solo para no bloquear render)
- Precarga automática: ✅ Activada en Home
- Precarga condicional: ✅ Solo si usuario está autenticado
- Una vez por sesión: ✅ No precarga múltiples veces

// Resumen.js  
- Timeout de modal: 5 segundos
- Intentos: 1 (para no bloquear)
- Auto-cierre: ✅ Después de 5s
- Carga en background: ✅ Continúa aunque modal se cierre
```

## Monitoreo

### Logs en Consola:

**En Home:**
```
🚀 [AdPreloader] Iniciando precarga desde Home...
📺 [AdPreloader] Precargando anuncio recompensado...
✅ [AdPreloader] Anuncio precargado en 2.34s
🎉 [AdPreloader] Precarga completada en 2.50s total
```

**En Resumen:**
```
// Si anuncio ya está listo:
✅ Anuncio precargado y listo
[Mega Sale aparece inmediatamente]

// Si anuncio NO está listo:
🚀 Precargando anuncio recompensado (AdMob) - Inicio: [timestamp]
[Modal "Cargando..." máximo 5s]
✅ Anuncio cargado en 3.45s
```

## Resultados Esperados

### Antes:
- 100% usuarios ven modal "Cargando..."
- Espera promedio: 5-10s
- Algunos usuarios esperan 1 minuto
- Alta tasa de abandono

### Después (Con Precarga):
- 80-90% usuarios ven anuncio INSTANTÁNEAMENTE ✅
- Solo 10-20% ven modal "Cargando..." (máximo 5s)
- 0% usuarios esperan más de 5s
- Baja tasa de abandono

## Optimizaciones Futuras

Si se necesita aún más velocidad:

1. **Precargar en Login** - Iniciar precarga apenas el usuario se loguea
2. **Precargar múltiples anuncios** - Tener 2-3 anuncios en cola
3. **Refresh automático** - Recargar anuncio cada 5 minutos en background
4. **Predictive loading** - Si usuario está en cotizador, aumentar prioridad de precarga
