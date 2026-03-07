// Minimal AdMob config for web/PWA builds; safe defaults for non-native environments
// ⚠️ IMPORTANTE: En producción SIEMPRE se usan IDs reales y isTesting=false

// IDs reales de producción de AdMob (hardcoded como respaldo definitivo)
const PRODUCTION_IDS = {
  APP: 'ca-app-pub-1352045169606160~5443732431',
  REWARDED: 'ca-app-pub-1352045169606160/7908962294',
  BANNER: 'ca-app-pub-1352045169606160/7029983134',
};

const GOOGLE_TEST = {
  APP: 'ca-app-pub-3940256099942544~3347511713',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

// 🧪 MODO DE PRUEBA: Cambiar a true SOLO para desarrollo local
const FORCE_TEST_IDS = false; // ✅ FALSE = Producción | TRUE = Solo desarrollo

// Determinar si estamos en producción
// En el build de Next.js, process.env.NODE_ENV se reemplaza en build-time
// Para la app móvil siempre debe ser producción
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || typeof window !== 'undefined';

function chooseId(kind, envId, hardcodedId, testId) {
  if (FORCE_TEST_IDS) {
    return testId;
  }
  
  // Verificar si el ID del env es válido (no vacío, no placeholder, no es un test ID)
  if (envId && envId.length > 10 && !envId.includes('XXXX') && !envId.startsWith('ca-app-pub-3940256099942544')) {
    return envId;
  }
  
  // Siempre usar el ID hardcoded de producción como respaldo
  return hardcodedId;
}

const ENV_IDS = {
  APP: process.env.NEXT_PUBLIC_ADMOB_APP_ID || '',
  REWARDED: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || '',
  BANNER: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || '',
};

export const ADMOB_CONFIG = {
  APP_ID: chooseId('APP', ENV_IDS.APP, PRODUCTION_IDS.APP, GOOGLE_TEST.APP),
  REWARDED_AD_UNIT_ID: chooseId('REWARDED', ENV_IDS.REWARDED, PRODUCTION_IDS.REWARDED, GOOGLE_TEST.REWARDED),
  BANNER_AD_UNIT_ID: chooseId('BANNER', ENV_IDS.BANNER, PRODUCTION_IDS.BANNER, GOOGLE_TEST.BANNER),
  SETTINGS: {
    // ✅ FORZAR isTesting=false en producción para NUNCA mostrar "Anuncio de prueba"
    isTesting: FORCE_TEST_IDS === true ? true : false,
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
  const usingTestIds = [GOOGLE_TEST.APP, GOOGLE_TEST.REWARDED, GOOGLE_TEST.BANNER]
    .some((id) => Object.values(ADMOB_CONFIG).includes(id));
  if (usingTestIds && !FORCE_TEST_IDS) {
    errors.push('⚠️ Se detectaron IDs de test en producción');
  }
  return { isValid: errors.length === 0, errors, isProduction: !FORCE_TEST_IDS, usingTestIds, isTesting: ADMOB_CONFIG.SETTINGS.isTesting };
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
