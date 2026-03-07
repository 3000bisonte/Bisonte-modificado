// Configuración de AdMob para producción
// ✅ IDs de producción hardcodeados - NO se usan IDs de prueba de Google

// IDs reales de producción de AdMob
const PRODUCTION_IDS = {
  APP: 'ca-app-pub-1352045169606160~5443732431',
  REWARDED: 'ca-app-pub-1352045169606160/7908962294',
  BANNER: 'ca-app-pub-1352045169606160/7029983134',
};

// Prefijo de IDs de prueba de Google (para filtrado de seguridad)
const GOOGLE_TEST_PREFIX = 'ca-app-pub-3940256099942544';

/**
 * Selecciona el ID de anuncio apropiado.
 * Prioriza env var si es un ID válido de producción, sino usa hardcoded.
 * NUNCA retorna un ID de prueba de Google.
 */
function resolveAdId(envId, productionId) {
  // Si hay un env var válido que NO sea un ID de prueba de Google, usarlo
  if (
    envId &&
    envId.length > 10 &&
    !envId.includes('XXXX') &&
    !envId.startsWith(GOOGLE_TEST_PREFIX)
  ) {
    return envId;
  }

  // Siempre usar el ID de producción hardcoded como respaldo seguro
  return productionId;
}

export const ADMOB_CONFIG = {
  APP_ID: resolveAdId(process.env.NEXT_PUBLIC_ADMOB_APP_ID, PRODUCTION_IDS.APP),
  REWARDED_AD_UNIT_ID: resolveAdId(process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID, PRODUCTION_IDS.REWARDED),
  BANNER_AD_UNIT_ID: resolveAdId(process.env.NEXT_PUBLIC_ADMOB_BANNER_ID, PRODUCTION_IDS.BANNER),
  SETTINGS: {
    // ✅ SIEMPRE false en producción - NUNCA debe ser true en la app publicada
    isTesting: false,
  },
  REWARD_SETTINGS: {
    DISCOUNT_AMOUNT: 988,
    REWARD_TYPE: 'discount',
    CURRENCY: 'COP',
  },
};

export function validateAdMobConfig() {
  const errors = [];
  if (!ADMOB_CONFIG.APP_ID) {errors.push('APP_ID vacío');}
  if (!ADMOB_CONFIG.REWARDED_AD_UNIT_ID) {errors.push('REWARDED_AD_UNIT_ID vacío');}
  if (!ADMOB_CONFIG.BANNER_AD_UNIT_ID) {errors.push('BANNER_AD_UNIT_ID vacío');}

  const allIds = [ADMOB_CONFIG.APP_ID, ADMOB_CONFIG.REWARDED_AD_UNIT_ID, ADMOB_CONFIG.BANNER_AD_UNIT_ID];
  const usingTestIds = allIds.some((id) => id.startsWith(GOOGLE_TEST_PREFIX));
  if (usingTestIds) {
    errors.push('⚠️ Se detectaron IDs de test de Google en la configuración');
  }

  return {
    isValid: errors.length === 0,
    errors,
    isProduction: true,
    usingTestIds,
    isTesting: ADMOB_CONFIG.SETTINGS.isTesting,
  };
}

export function getCurrentAdMobConfig() {
  return {
    ...ADMOB_CONFIG,
    validation: validateAdMobConfig(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };
}

export default ADMOB_CONFIG;
