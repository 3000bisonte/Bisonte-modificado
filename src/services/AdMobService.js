/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { useEffect, useState } from 'react';

import { ADMOB_CONFIG } from '../config/admob.config';

const NATIVE_PLATFORMS = new Set(['ios', 'android']);

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
    return isCapacitorNative();
  },

  async initialize() {
    if (!this.isSupported()) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('ℹ️ AdMobService: se omitió la inicialización (plataforma no nativa)');
      }
      return false;
    }

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
        initializeForTesting: true,
      });
      
      console.log('✅ AdMob inicializado correctamente');
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
      await AdMob.prepareRewardVideo({
        adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
        isTesting: ADMOB_CONFIG.SETTINGS.isTesting,
      });
      
      console.log('📺 Anuncio recompensado preparado');
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
      const result = await AdMob.showRewardVideo();
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
export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRewardedReady, setIsRewardedReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    void initializeAdMob();
  }, []);

  const initializeAdMob = async () => {
    setIsLoading(true);
    const supported = AdMobService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsInitialized(false);
      setIsRewardedReady(false);
      setIsLoading(false);
      return;
    }

    const success = await AdMobService.initialize();
    setIsInitialized(success);
    
    if (success) {
      // Preparar anuncio recompensado automáticamente
      const rewardedReady = await AdMobService.prepareRewardedAd();
      setIsRewardedReady(rewardedReady);
    }
    
    setIsLoading(false);
  };

  const showRewardedAd = async () => {
    if (!isSupported) {
      throw new Error('AdMob no está disponible en esta plataforma');
    }

    if (!isRewardedReady) {
      throw new Error('Anuncio recompensado no está listo');
    }

    setIsLoading(true);
    try {
      const result = await AdMobService.showRewardedAd();
      // Preparar el siguiente anuncio
      setTimeout(() => {
        void AdMobService.prepareRewardedAd().then(setIsRewardedReady);
      }, 1000);
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

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
    showBanner,
    hideBanner,
    reinitialize: initializeAdMob
  };
}

export default AdMobService;