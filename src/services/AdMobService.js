/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { useCallback, useEffect, useState } from 'react';

import { ADMOB_CONFIG } from '../config/admob.config';

const NATIVE_PLATFORMS = new Set(['ios', 'android']);
const DEFAULT_TEST_DEVICE_ID = '2077ef9a63d2b398840261c8221a0c9b';
const CONFIGURED_TEST_DEVICE_IDS = (process.env.NEXT_PUBLIC_ADMOB_TEST_DEVICES || '')
  .split(',')
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
const TEST_DEVICE_IDS = (CONFIGURED_TEST_DEVICE_IDS.length > 0
  ? CONFIGURED_TEST_DEVICE_IDS
  : [DEFAULT_TEST_DEVICE_ID]
).filter((id, index, array) => array.indexOf(id) === index);

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
      return false;
    }

    try {
      const isTesting = ADMOB_CONFIG.SETTINGS.isTesting;
      const initializeOptions = {
        requestTrackingAuthorization: true,
      };

      if (isTesting) {
        Object.assign(initializeOptions, {
          testingDevices: TEST_DEVICE_IDS,
          initializeForTesting: true,
        });
      }

      await AdMob.initialize(initializeOptions);
      console.log(
        `✅ AdMob inicializado en modo ${isTesting ? 'pruebas' : 'producción'}`,
        isTesting ? { testingDevices: TEST_DEVICE_IDS } : undefined
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar AdMob:', error);
      return false;
    }
  },

  async prepareRewardedAd() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const info = await AdMob.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
        isTesting: ADMOB_CONFIG.SETTINGS.isTesting,
      });
      
      console.log('📺 Anuncio recompensado preparado', info);
      return true;
    } catch (error) {
      console.error('❌ Error preparando anuncio recompensado:', error);
      return false;
    }
  },

  async showRewardedAd() {
    if (!this.isSupported()) {
      throw new Error('AdMob no está disponible en esta plataforma');
    }

    try {
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
      await AdMob.showBanner({
        adId: ADMOB_CONFIG.BANNER_AD_UNIT_ID,
        isTesting: ADMOB_CONFIG.SETTINGS.isTesting,
        margin: 0,
        position: 'BOTTOM_CENTER',
        npa: true
      });
      
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
  }
};

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRewardedReady, setIsRewardedReady] = useState(false);
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
      return false;
    }

    setIsLoading(true);
    try {
      const ready = await AdMobService.prepareRewardedAd();
      setIsRewardedReady(ready);
      if (ready) {
        setLastError(null);
      }
      return ready;
    } catch (error) {
      console.error('❌ Error preparando anuncio recompensado:', error);
      setIsRewardedReady(false);
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
      setIsRewardedReady(true);
      setIsLoading(false);
      setLastError(null);
    };

    /** @param {unknown} error */
    const handleFailedToLoad = (error) => {
      if (!isMounted) {
        return;
      }
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
      setLastReward(createRewardSnapshot('showRewardedAd', result));
      setLastError(null);
      // Preparar el siguiente anuncio
      setTimeout(() => {
        void prepareRewardedAd();
      }, 1000);
      
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