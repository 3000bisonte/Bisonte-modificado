/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { useCallback, useEffect, useState } from 'react';

import { ADMOB_CONFIG } from '../config/admob.config';

const NATIVE_PLATFORMS = new Set(['ios', 'android']);

const runtimeState = {
  initialized: false,
  rewardReady: false,
  lastPrepareAt: null,
  preparing: false,
  preparePromise: null,
  cooldownUntil: 0,
};

const markInitialized = (value) => {
  runtimeState.initialized = Boolean(value);
  if (!value) {
    runtimeState.rewardReady = false;
    runtimeState.lastPrepareAt = null;
  }
};

const markRewardReady = (value) => {
  runtimeState.rewardReady = Boolean(value);
  if (value) {
    runtimeState.lastPrepareAt = Date.now();
  }
};

const consumeRewardReady = () => {
  runtimeState.rewardReady = false;
};

/**
 * @param {unknown} detail
 * @returns {{stage: string, detail: unknown, message?: string, timestamp: string}}
 */
const createAdError = (stage, detail) => {
  let message;
  if (typeof detail === 'string') {
    message = detail;
  } else if (detail && typeof detail === 'object') {
    const maybeMessage = Reflect.get(detail, 'message');
    if (typeof maybeMessage === 'string') {
      message = maybeMessage;
    }
  }

  return {
    stage,
    detail,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * @param {string} source
 * @param {unknown} payload
 * @returns {{source: string, payload: unknown, timestamp: string}}
 */
const createRewardSnapshot = (source, payload) => ({
  source,
  payload,
  timestamp: new Date().toISOString(),
});

const isCapacitorNative = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    let platform;

    if (typeof Capacitor?.getPlatform === 'function') {
      platform = Capacitor.getPlatform();
    } else if (typeof Capacitor?.platform === 'string') {
      platform = Capacitor.platform;
    }

    return typeof platform === 'string' && NATIVE_PLATFORMS.has(platform.toLowerCase());
  } catch (error) {
    console.warn('AdMobService: no fue posible determinar la plataforma Capacitor', error);
    return false;
  }
};

export const AdMobService = {
  isSupported() {
    if (!isCapacitorNative()) {
      return false;
    }

    if (typeof AdMob?.initialize !== 'function') {
      return false;
    }

    return true;
  },

  async initialize() {
    if (!this.isSupported()) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('ℹ️ AdMobService: se omitió la inicialización (plataforma no nativa)');
      }
      markInitialized(false);
      return false;
    }

    try {
      // Evitar inicializaciones múltiples
      if (runtimeState.initialized) {
        return true;
      }

      // ✅ Producción: Solo requestTrackingAuthorization, SIN testingDevices ni initializeForTesting
      const initializeOptions = {
        requestTrackingAuthorization: true,
      };

      await AdMob.initialize(initializeOptions);
      console.log('✅ AdMob inicializado en modo producción');
      markInitialized(true);
      markRewardReady(false);
      
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar AdMob:', error);
      markInitialized(false);
      return false;
    }
  },

  async prepareRewardedAd() {
    if (!this.isSupported()) {
      console.log('⏭️ AdMob no soportado en esta plataforma');
      return false;
    }

    // ✅ Si ya está listo, retornar inmediatamente
    if (runtimeState.rewardReady) {
      console.log('✅ Anuncio YA está listo - No recargar');
      return true;
    }

    // ✅ CRÍTICO: Asegurar que AdMob esté inicializado antes de preparar
    if (!runtimeState.initialized) {
      console.warn('⚠️ AdMob no está inicializado, inicializando ahora...');
      const success = await this.initialize();
      if (!success) {
        console.error('❌ No se pudo inicializar AdMob para preparar anuncio');
        return false;
      }
    }

    // ⚡ COOLDOWN - Esperar si está activo en lugar de rechazar
    const now = Date.now();
    if (runtimeState.cooldownUntil && now < runtimeState.cooldownUntil) {
      const remaining = runtimeState.cooldownUntil - now;
      console.log(`⏳ Cooldown activo - Esperando ${Math.ceil(remaining / 1000)}s antes de continuar...`);
      
      // ✅ ESPERAR el cooldown en lugar de retornar false inmediatamente
      await new Promise(resolve => setTimeout(resolve, remaining));
      console.log(`✅ Cooldown completado - Continuando con prepare...`);
    }

    // Single-flight: si ya hay un prepare en curso, esperar ese resultado
    if (runtimeState.preparing && runtimeState.preparePromise) {
      console.log('🔄 Ya hay un prepare en curso, esperando resultado...');
      try {
        const ok = await runtimeState.preparePromise;
        return ok;
      } catch {
        return false;
      }
    }

    runtimeState.preparing = true;
    runtimeState.preparePromise = (async () => {
      try {
        console.log('🚀 Preparando anuncio recompensado...');
        console.log(`   - Ad Unit ID: ${ADMOB_CONFIG.REWARDED_AD_UNIT_ID}`);
        
        // ✅ Pasar EXPLÍCITAMENTE isTesting:false para garantizar modo producción
        const prepareOptions = {
          adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
          isTesting: false,
        };
        
        const info = await AdMob.prepareRewardVideoAd(prepareOptions);
        
        console.log('✅ Anuncio recompensado preparado exitosamente', info);
        markRewardReady(true);
        
        // ⚡ Cooldown REDUCIDO de 1s (antes 2s) para permitir recarga más rápida
        runtimeState.cooldownUntil = Date.now() + 1000;
        return true;
      } catch (error) {
        // Manejo detallado de errores de Capacitor
        console.error('❌ Error preparando anuncio recompensado:', error);
        
        // Extraer información útil del CapacitorException
        if (error && typeof error === 'object') {
          const code = error.code;
          const message = error.message;
          const data = error.data;
          
          console.error('📋 Detalles del error:', {
            code: code ?? 'undefined',
            message: message ?? 'No message',
            data: data ?? 'undefined',
            errorType: error.constructor?.name ?? 'Unknown'
          });
          
          // Errores comunes de AdMob
          if (message && typeof message === 'string') {
            if (message.includes('No fill')) {
              console.warn('⚠️ No hay anuncios disponibles en este momento (No fill) - Esto es normal si los anuncios aún están en revisión');
            } else if (message.includes('Network')) {
              console.warn('⚠️ Error de red al cargar anuncio - Verifica tu conexión a internet');
            } else if (message.includes('not initialized')) {
              console.error('❌ AdMob no está inicializado correctamente');
            }
          }
        }
        
        markRewardReady(false);
        
        // ⚡ COOLDOWN REDUCIDO en error de 2s (antes 5s) para permitir retry más rápido
        runtimeState.cooldownUntil = Date.now() + 2000;
        return false;
      } finally {
        runtimeState.preparing = false;
        runtimeState.preparePromise = null;
      }
    })();

    try {
      const ok = await runtimeState.preparePromise;
      return ok;
    } catch {
      return false;
    }
  },

  async showRewardedAd() {
    if (!this.isSupported()) {
      throw new Error('AdMob no está disponible en esta plataforma');
    }

    try {
      consumeRewardReady();
      const result = await AdMob.showRewardVideoAd();
      console.log('🎁 Anuncio recompensado completado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error mostrando anuncio recompensado:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  },

  async showBanner() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const bannerOptions = {
        adId: ADMOB_CONFIG.BANNER_AD_UNIT_ID,
        margin: 0,
        position: 'BOTTOM_CENTER',
        isTesting: false,
      };
      
      await AdMob.showBanner(bannerOptions);
      
      console.log('📱 Banner publicitario mostrado');
      return true;
    } catch (error) {
      console.error('❌ Error mostrando banner:', error);
      return false;
    }
  },

  async hideBanner() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      await AdMob.hideBanner();
      console.log('🚫 Banner publicitario oculto');
      return true;
    } catch (error) {
      console.error('❌ Error ocultando banner:', error);
      return false;
    }
  },

  wasInitialized() {
    return runtimeState.initialized;
  },

  wasRewardReady() {
    return runtimeState.rewardReady;
  },

  // 🆕 Método para forzar recarga ignorando cooldown (útil para debugging)
  async forceReloadAd() {
    console.log('🔄 FORZANDO recarga de anuncio (ignorando cooldown)...');
    // Resetear cooldown y estado de preparación
    runtimeState.cooldownUntil = 0;
    runtimeState.preparing = false;
    runtimeState.preparePromise = null;
    
    // Preparar anuncio
    return await this.prepareRewardedAd();
  },

  // 🆕 Obtener estado completo para debugging
  getDebugState() {
    return {
      initialized: runtimeState.initialized,
      rewardReady: runtimeState.rewardReady,
      preparing: runtimeState.preparing,
      lastPrepareAt: runtimeState.lastPrepareAt,
      cooldownUntil: runtimeState.cooldownUntil,
      cooldownRemaining: runtimeState.cooldownUntil ? Math.max(0, Math.ceil((runtimeState.cooldownUntil - Date.now()) / 1000)) : 0,
      config: {
        appId: ADMOB_CONFIG.APP_ID,
        rewardedId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
        bannerId: ADMOB_CONFIG.BANNER_AD_UNIT_ID,
        isTesting: false,
      }
    };
  }
};

export const getAdMobRuntimeState = () => ({ ...runtimeState });

// Hook personalizado para usar AdMob en componentes React
/**
 * @returns {{
 *   isInitialized: boolean,
 *   isRewardedReady: boolean,
 *   isLoading: boolean,
 *   isSupported: boolean,
 *   showRewardedAd: () => Promise<unknown>,
 *   prepareRewardedAd: () => Promise<boolean>,
 *   showBanner: () => Promise<boolean>,
 *   hideBanner: () => Promise<boolean>,
 *   reinitialize: () => Promise<boolean>,
 *   lastReward: { source: string, payload: unknown, timestamp: string } | null,
 *   lastError: { stage: string, detail: unknown, message?: string, timestamp: string } | null,
 * }}
 */
export function useAdMob() {
  const runtimeSnapshot = getAdMobRuntimeState();
  const [isInitialized, setIsInitialized] = useState(runtimeSnapshot.initialized);
  const [isRewardedReady, setIsRewardedReady] = useState(runtimeSnapshot.rewardReady);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [lastError, setLastError] = useState(null);

  const prepareRewardedAd = useCallback(async () => {
    const supported = AdMobService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsRewardedReady(false);
      setLastError(createAdError('unsupported', 'AdMob no está disponible en esta plataforma'));
      markRewardReady(false);
      return false;
    }

    setIsLoading(true);
    try {
      const ready = await AdMobService.prepareRewardedAd();
      setIsRewardedReady(ready);
       markRewardReady(ready);
      if (ready) {
        setLastError(null);
      }
      return ready;
    } catch (error) {
      console.error('❌ Error preparando anuncio recompensado:', error);
      setIsRewardedReady(false);
      markRewardReady(false);
      setLastError(createAdError('prepare', error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeAdMob = useCallback(async () => {
    setIsLoading(true);
    const supported = AdMobService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsInitialized(false);
      setIsRewardedReady(false);
      setIsLoading(false);
      setLastError(createAdError('unsupported', 'AdMob no está disponible en esta plataforma'));
      return false;
    }

    try {
      const success = await AdMobService.initialize();
      setIsInitialized(success);

      if (success) {
        await prepareRewardedAd();
      } else {
        setIsRewardedReady(false);
      }

      return success;
    } catch (error) {
      console.error('❌ Error inicializando AdMob:', error);
      setIsInitialized(false);
      setIsRewardedReady(false);
      setLastError(createAdError('initialize', error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [prepareRewardedAd]);

  useEffect(() => {
    void initializeAdMob();
  }, [initializeAdMob]);

  useEffect(() => {
    setIsSupported(AdMobService.isSupported());
  }, []);

  useEffect(() => {
    if (!AdMobService.isSupported()) {
      return undefined;
    }

    let isMounted = true;
    /** @type {Array<Promise<import('@capacitor/core').PluginListenerHandle>>} */
    const registrations = [];

    if (typeof AdMob?.addListener !== 'function') {
      return undefined;
    }

    /**
     * @param {Promise<import('@capacitor/core').PluginListenerHandle>} promise
     */
    const register = (promise) => {
      registrations.push(promise);
      promise.catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('AdMobService: error registrando listener', error);
        }
      });
    };

    const handleLoaded = () => {
      if (!isMounted) {
        return;
      }
      markRewardReady(true);
      setIsRewardedReady(true);
      setIsLoading(false);
      setLastError(null);
    };

    /** @param {unknown} error */
    const handleFailedToLoad = (error) => {
      if (!isMounted) {
        return;
      }
      markRewardReady(false);
      setIsRewardedReady(false);
      setIsLoading(false);
      setLastError(createAdError('event:FailedToLoad', error));
    };

    /** @param {unknown} error */
    const handleFailedToShow = (error) => {
      if (!isMounted) {
        return;
      }
      setIsLoading(false);
      setLastError(createAdError('event:FailedToShow', error));
    };

    const handleDismissed = () => {
      if (!isMounted) {
        return;
      }
      markRewardReady(false);
      setIsRewardedReady(false);
    };

    const handleShowed = () => {
      if (!isMounted) {
        return;
      }
      setIsLoading(false);
    };

    /** @param {unknown} reward */
    const handleRewarded = (reward) => {
      if (!isMounted) {
        return;
      }
      setLastReward(createRewardSnapshot('event:Rewarded', reward));
      setLastError(null);
    };

    register(AdMob.addListener(RewardAdPluginEvents.Loaded, handleLoaded));
    register(AdMob.addListener(RewardAdPluginEvents.FailedToLoad, handleFailedToLoad));
    register(AdMob.addListener(RewardAdPluginEvents.FailedToShow, handleFailedToShow));
    register(AdMob.addListener(RewardAdPluginEvents.Dismissed, handleDismissed));
    register(AdMob.addListener(RewardAdPluginEvents.Showed, handleShowed));
    register(AdMob.addListener(RewardAdPluginEvents.Rewarded, handleRewarded));

    return () => {
      isMounted = false;
      registrations.forEach((registration) => {
        registration
          .then((handle) => {
            if (handle && typeof handle.remove === 'function') {
              void handle.remove();
            }
          })
          .catch(() => {
            // Ignorado
          });
      });
    };
  }, []);

  const showRewardedAd = useCallback(async () => {
    if (!isSupported) {
      throw new Error('AdMob no está disponible en esta plataforma');
    }

    if (!isRewardedReady) {
      const prepared = await prepareRewardedAd();
      if (!prepared) {
        throw new Error('Anuncio recompensado no está listo');
      }
    }

    setIsLoading(true);
    try {
      const result = await AdMobService.showRewardedAd();
      setIsRewardedReady(false);
      markRewardReady(false);
      setLastReward(createRewardSnapshot('showRewardedAd', result));
      setLastError(null);
      
      // ✅ NO auto-precargar aquí - El componente Resumen.js se encarga de la cadena
      // Esto evita conflictos de llamadas simultáneas a prepareRewardedAd()
      console.log('✅ [useAdMob] Anuncio mostrado - El caller se encargará de precargar el siguiente');
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isRewardedReady, prepareRewardedAd]);

  const showBanner = () => {
    return AdMobService.showBanner();
  };
  const hideBanner = () => {
    return AdMobService.hideBanner();
  };

  return {
    isInitialized,
    isRewardedReady,
    isLoading,
    isSupported,
    showRewardedAd,
    prepareRewardedAd,
    showBanner,
    hideBanner,
    reinitialize: initializeAdMob,
    lastReward,
    lastError,
  };
}

export default AdMobService;