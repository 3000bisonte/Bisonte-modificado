import { AdMob } from '@capacitor-community/admob';
import { useEffect, useState } from 'react';
import { ADMOB_CONFIG } from '../config/admob.config';

export const AdMobService = {
  async initialize() {
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
    try {
      const result = await AdMob.showRewardVideo();
      console.log('🎁 Anuncio recompensado completado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error mostrando anuncio recompensado:', error);
      throw error;
    }
  },

  async showBanner() {
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

  useEffect(() => {
    initializeAdMob();
  }, []);

  const initializeAdMob = async () => {
    setIsLoading(true);
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
    if (!isRewardedReady) {
      throw new Error('Anuncio recompensado no está listo');
    }

    setIsLoading(true);
    try {
      const result = await AdMobService.showRewardedAd();
      // Preparar el siguiente anuncio
      setTimeout(() => {
        AdMobService.prepareRewardedAd().then(setIsRewardedReady);
      }, 1000);
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const showBanner = () => AdMobService.showBanner();
  const hideBanner = () => AdMobService.hideBanner();

  return {
    isInitialized,
    isRewardedReady,
    isLoading,
    showRewardedAd,
    showBanner,
    hideBanner,
    reinitialize: initializeAdMob
  };
}

export default AdMobService;