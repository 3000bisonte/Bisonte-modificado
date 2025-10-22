# DEBUG: Modal "Cargando anuncio" no se cierra

## Problema
El modal vuelve a aparecer inmediatamente después de cerrarlo.

## Condición actual de isLoading
```javascript
isLoading={!userClosedAdModal && costoTotal > 0 && (adState === "loading" || adState === "preloading" || (adState === "error" && !showAdErrorModal && !hideAdErrorModal))}
```

## Posibles causas

1. **React no actualiza rápido el estado** - `userClosedAdModal` tarda en cambiar
2. **El componente se re-renderiza antes de actualizar** - Timing issue
3. **Hay algún useEffect que está cambiando adState continuamente**

## Solución propuesta
Usar un **ref** en lugar de state para tener un cambio instantáneo.
