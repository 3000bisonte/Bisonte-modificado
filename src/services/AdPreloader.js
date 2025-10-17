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
      console.log('🚀 Iniciando precarga global de anuncios...');
      
      // Esperar un momento para no bloquear la carga inicial de la app
      preloadTimer.current = setTimeout(() => {
        preloadAds();
        hasPreloaded.current = true;
      }, 2000); // 2 segundos después de que la app cargue
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
  try {
    console.log('📺 Precargando anuncios en segundo plano...');
    
    // Verificar si estamos en un entorno que soporta anuncios
    if (typeof window === 'undefined') {
      console.log('⏭️ Entorno servidor, saltando precarga de anuncios');
      return;
    }

    // Importación dinámica para evitar errores en SSR
    const { default: AdMobService } = await import('./AdMobService');
    
    // Verificar si es una plataforma nativa
    const isNative = await checkIfNative();
    
    if (!isNative) {
      console.log('⏭️ No es plataforma nativa, saltando precarga de anuncios');
      return;
    }

    // Inicializar AdMob si no está inicializado
    const initialized = await AdMobService.initialize();
    
    if (!initialized) {
      console.log('⚠️ No se pudo inicializar AdMob para precarga');
      return;
    }

    console.log('✅ AdMob inicializado para precarga');

    // Precargar anuncio recompensado (el más importante)
    try {
      console.log('📺 Precargando anuncio recompensado...');
      await AdMobService.prepareRewardAd();
      console.log('✅ Anuncio recompensado precargado exitosamente');
    } catch (error) {
      console.warn('⚠️ No se pudo precargar anuncio recompensado:', error.message);
    }

    // Opcional: Precargar banner (si lo usas)
    // Los banners normalmente se cargan rápido, pero puedes inicializarlos aquí
    
    console.log('🎉 Precarga de anuncios completada');
    
  } catch (error) {
    console.error('❌ Error en precarga de anuncios:', error);
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
