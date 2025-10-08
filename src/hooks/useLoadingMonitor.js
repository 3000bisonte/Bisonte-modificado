// 🎣 Hook para monitorear automáticamente estados isLoading
'use client';

import { useEffect, useRef } from 'react';

import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

/**
 * Hook que monitorea un estado isLoading y activa la pantalla global
 * después de 3 segundos si el loading persiste
 * 
 * @param {boolean} isLoading - Estado de loading a monitorear
 * @param {string} loadingId - ID único para este loading (opcional)
 * @param {string} message - Mensaje personalizado para la pantalla (opcional)
 * 
 * @example
 * const [isLoading, setIsLoading] = useState(false);
 * useLoadingMonitor(isLoading, 'payment-button', 'Procesando pago...');
 */
export function useLoadingMonitor(isLoading, loadingId = null, message = null) {
  const { registerLoading, unregisterLoading, updateLoadingMessage } = useGlobalLoading();
  const cleanupRef = useRef(null);
  const idRef = useRef(loadingId || `loading-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isLoading) {
      // Actualizar mensaje si se proporciona
      if (message) {
        updateLoadingMessage(message);
      }

      // Registrar el loading y obtener función de cleanup
      cleanupRef.current = registerLoading(idRef.current);
      console.log(`🔍 Monitoreando loading: ${idRef.current}`);
    } else {
      // Si el loading se desactiva, hacer cleanup
      if (cleanupRef.current) {
        console.log(`✅ Loading completado: ${idRef.current}`);
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }

    // Cleanup al desmontar o cuando isLoading cambia
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isLoading, message, registerLoading, unregisterLoading, updateLoadingMessage]);
}

/**
 * Hook para monitorear múltiples estados de loading
 * 
 * @param {Object} loadingStates - Objeto con estados de loading { id: isLoading }
 * @param {string} message - Mensaje global para todos los loadings
 * 
 * @example
 * useMultipleLoadingMonitor({
 *   'payment': isPaymentLoading,
 *   'validation': isValidating,
 *   'submission': isSubmitting
 * }, 'Procesando tu solicitud...');
 */
export function useMultipleLoadingMonitor(loadingStates, message = null) {
  const { registerLoading, updateLoadingMessage } = useGlobalLoading();
  const cleanupsRef = useRef(new Map());

  useEffect(() => {
    if (message) {
      updateLoadingMessage(message);
    }

    // Revisar cada estado de loading
    Object.entries(loadingStates).forEach(([id, isLoading]) => {
      if (isLoading && !cleanupsRef.current.has(id)) {
        // Registrar nuevo loading
        const cleanup = registerLoading(id);
        cleanupsRef.current.set(id, cleanup);
        console.log(`🔍 Monitoreando loading múltiple: ${id}`);
      } else if (!isLoading && cleanupsRef.current.has(id)) {
        // Limpiar loading completado
        const cleanup = cleanupsRef.current.get(id);
        if (cleanup) {
          cleanup();
          cleanupsRef.current.delete(id);
          console.log(`✅ Loading múltiple completado: ${id}`);
        }
      }
    });

    // Cleanup al desmontar
    return () => {
      cleanupsRef.current.forEach((cleanup) => {
        if (cleanup) {
          cleanup();
        }
      });
      cleanupsRef.current.clear();
    };
  }, [loadingStates, message, registerLoading, updateLoadingMessage]);
}
