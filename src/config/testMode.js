/**
 * Configuración de Modo Prueba
 * 
 * Este archivo permite activar/desactivar funcionalidades de testing
 * de forma centralizada sin tener que modificar múltiples archivos.
 */

export const TEST_MODE = {
  /**
   * Fuerza todos los envíos a ser GRATUITOS (costo $0)
   * 
   * IMPORTANTE: Cambiar a `false` cuando vayas a producción
   * 
   * @type {boolean}
   */
  FORCE_FREE_SHIPPING: false, // ✅ DESACTIVADO - Costos reales

  /**
   * Muestra logs detallados de debugging en consola
   * 
   * @type {boolean}
   */
  VERBOSE_LOGGING: false, // ✅ DESACTIVADO - Menos logs en producción

  /**
   * Mensaje que se muestra en el cotizador cuando está en modo prueba
   * 
   * @type {string}
   */
  TEST_MODE_MESSAGE: "🧪 MODO PRUEBA: Todos los envíos son gratuitos temporalmente",
};

/**
 * Helper para obtener el costo según el modo de prueba
 * 
 * @param {number} calculatedCost - Costo calculado normalmente
 * @returns {number} - Costo final (0 si está en modo prueba, o el costo calculado)
 */
export function getTestModeCost(calculatedCost) {
  if (TEST_MODE.FORCE_FREE_SHIPPING) {
    if (TEST_MODE.VERBOSE_LOGGING) {
      console.log(`🧪 MODO PRUEBA ACTIVO: Costo calculado: $${calculatedCost.toLocaleString('es-CO')} → Aplicando: $0 (GRATIS)`);
    }
    return 0;
  }
  return calculatedCost;
}

/**
 * Helper para mostrar banner de modo prueba
 * 
 * @returns {string|null} - Mensaje a mostrar, o null si no está en modo prueba
 */
export function getTestModeBanner() {
  return TEST_MODE.FORCE_FREE_SHIPPING ? TEST_MODE.TEST_MODE_MESSAGE : null;
}

// Advertencia en consola si el modo prueba está activo
if (typeof window !== 'undefined' && TEST_MODE.FORCE_FREE_SHIPPING) {
  console.warn(
    '%c⚠️ ADVERTENCIA: MODO PRUEBA ACTIVO ⚠️',
    'background: #ff9800; color: white; font-size: 16px; padding: 10px; font-weight: bold;'
  );
  console.warn(
    '%c🧪 Todos los envíos son GRATUITOS. Recuerda desactivar TEST_MODE.FORCE_FREE_SHIPPING antes de ir a producción.',
    'background: #ff9800; color: white; font-size: 14px; padding: 5px;'
  );
  console.warn(
    '%c📝 Archivo a modificar: src/config/testMode.js',
    'background: #2196f3; color: white; font-size: 12px; padding: 5px;'
  );
}

export default TEST_MODE;
