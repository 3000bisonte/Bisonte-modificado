// Minimal AdMob config for web/PWA builds; safe defaults for non-native environments

const RAW_ENV = (typeof window !== 'undefined' ? (document.querySelector('meta[name="admob-env"]')?.content || '') : (process.env.NODE_ENV || '')).trim().toLowerCase();
const IS_PRODUCTION = RAW_ENV === 'production' || process.env.NODE_ENV === 'production';

const GOOGLE_TEST = {
  APP: 'ca-app-pub-3940256099942544~3347511713',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111'
};

function chooseId(kind, real, test) {
  // En desarrollo, usar IDs de prueba (tienen anuncios garantizados)
  if (!IS_PRODUCTION) {
    console.log(`[AdMob Config] Usando ${kind} TEST ID (desarrollo):`, test);
    return test;
  }
  
  // En producción, validar que el ID real sea válido
  if (real && real.length > 10 && !real.includes('XXXX') && real !== test) {
    console.log(`[AdMob Config] Usando ${kind} REAL ID (producción):`, real);
    return real;
  }
  
  // Fallback a test ID si el real no es válido
  console.warn(`[AdMob Config] ⚠️ ${kind} REAL ID inválido, usando TEST ID:`, test);
  return test;
}

const REAL_IDS = {
  APP: process.env.NEXT_PUBLIC_ADMOB_APP_ID || '',
  REWARDED: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || '',
  BANNER: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || ''
};

export const ADMOB_CONFIG = {
  APP_ID: chooseId('APP', REAL_IDS.APP, GOOGLE_TEST.APP),
  REWARDED_AD_UNIT_ID: chooseId('REWARDED', REAL_IDS.REWARDED, GOOGLE_TEST.REWARDED),
  BANNER_AD_UNIT_ID: chooseId('BANNER', REAL_IDS.BANNER, GOOGLE_TEST.BANNER),
  SETTINGS: {
    isTesting: process.env.NODE_ENV !== 'production',
  },
  REWARD_SETTINGS: {
    DISCOUNT_AMOUNT: 2013,
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
  return { isValid: errors.length === 0, errors, isProduction: IS_PRODUCTION, usingTestIds };
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
