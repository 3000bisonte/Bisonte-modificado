// Servicio de precarga global de anuncios
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook para precargar anuncios cuando el usuario inicia sesión
 * Se ejecuta una sola vez por sesión para mejorar el rendimiento
 */
export function useAdPreloader() {
  const { data: session, status } = useSession();
  const hasPreloaded = useRef(false);
  const preloadTimer = useRef(null);

  useEffect(() => {
    // Solo precargar si el usuario está autenticado y no se ha precargado antes
    if (status === 'authenticated' && !hasPreloaded.current) {
      console.log('🚀 Iniciando precarga INMEDIATA de anuncios desde Home...');
      
      // 🚀 PRECARGA INMEDIATA - No esperar para tener anuncios listos más rápido
      preloadTimer.current = setTimeout(() => {
        preloadAds();
        hasPreloaded.current = true;
      }, 100); // Solo 100ms para permitir que React termine de renderizar
    }

    return () => {
      if (preloadTimer.current) {
        clearTimeout(preloadTimer.current);
      }
    };
  }, [status]);
}

/**
 * Función principal de precarga de anuncios
 */
async function preloadAds() {
  const startTime = performance.now();
  
  try {
    console.log('📺 [AdPreloader] Iniciando precarga desde Home...');
    
    // Verificar si estamos en un entorno que soporta anuncios
    if (typeof window === 'undefined') {
      console.log('⏭️ [AdPreloader] Entorno servidor, saltando precarga');
      return;
    }

    // Importación dinámica para evitar errores en SSR
    const { default: AdMobService } = await import('./AdMobService');
    
    // Verificar si es una plataforma nativa
    const isNative = await checkIfNative();
    
    if (!isNative) {
      console.log('⏭️ [AdPreloader] No es plataforma nativa, saltando precarga');
      return;
    }

    // Inicializar AdMob si no está inicializado
    const initialized = await AdMobService.initialize();
    
    if (!initialized) {
      console.log('⚠️ [AdPreloader] No se pudo inicializar AdMob');
      return;
    }

    console.log('✅ [AdPreloader] AdMob inicializado');

    // Precargar anuncio recompensado (el más importante)
    try {
      console.log('📺 [AdPreloader] Precargando anuncio recompensado...');
      const adStartTime = performance.now();
      
      await AdMobService.prepareRewardAd();
      
      const adLoadTime = ((performance.now() - adStartTime) / 1000).toFixed(2);
      console.log(`✅ [AdPreloader] Anuncio precargado en ${adLoadTime}s`);
    } catch (error) {
      console.warn('⚠️ [AdPreloader] Error precargando anuncio:', error.message);
    }

    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 [AdPreloader] Precarga completada en ${totalTime}s total`);
    
  } catch (error) {
    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ [AdPreloader] Error después de ${totalTime}s:`, error);
    // No lanzamos el error para no interrumpir la app
  }
}

/**
 * Verifica si estamos en una plataforma nativa (iOS o Android)
 */
async function checkIfNative() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  } catch {
    return false;
  }
}

/**
 * Función para forzar recarga de anuncios (útil después de mostrar uno)
 */
export async function reloadAd() {
  try {
    console.log('🔄 Recargando anuncio...');
    const { default: AdMobService } = await import('./AdMobService');
    await AdMobService.prepareRewardAd();
    console.log('✅ Anuncio recargado');
  } catch (error) {
    console.warn('⚠️ Error recargando anuncio:', error);
  }
}

/**
 * Obtener estado de precarga de anuncios
 */
export async function getAdStatus() {
  try {
    const { default: AdMobService } = await import('./AdMobService');
    return {
      isReady: AdMobService.isRewardAdReady?.() || false,
      lastPrepareTime: AdMobService.getLastPrepareTime?.() || null
    };
  } catch {
    return {
      isReady: false,
      lastPrepareTime: null
    };
  }
}

// Exportar el hook como default
export default useAdPreloader;
