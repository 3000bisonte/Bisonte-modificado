// 🎯 Contexto Global de Loading - Monitorea estados isLoading
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const GlobalLoadingContext = createContext();

export function GlobalLoadingProvider({ children }) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Estamos procesando tu solicitud...');
  const loadingTimersRef = useRef(new Map());
  const loadingCountRef = useRef(0);

  /**
   * Registra un nuevo estado de loading
   * Si el loading permanece activo por más de 3 segundos, activa la pantalla global
   */
  const registerLoading = useCallback((loadingId) => {
    // Incrementar contador de loadings activos
    loadingCountRef.current += 1;

    // Crear timer de 3 segundos para este loading
    const timer = setTimeout(() => {
      console.log(`⏱️ Loading ${loadingId} excedió 3 segundos - Activando pantalla global`);
      setIsGlobalLoading(true);
    }, 3000);

    loadingTimersRef.current.set(loadingId, timer);

    return () => {
      // Cleanup: cancelar timer y decrementar contador
      const existingTimer = loadingTimersRef.current.get(loadingId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        loadingTimersRef.current.delete(loadingId);
      }

      loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);

      // Si no hay más loadings activos, desactivar pantalla global
      if (loadingCountRef.current === 0) {
        setIsGlobalLoading(false);
      }
    };
  }, []);

  /**
   * Desregistra un loading manualmente
   */
  const unregisterLoading = useCallback((loadingId) => {
    const timer = loadingTimersRef.current.get(loadingId);
    if (timer) {
      clearTimeout(timer);
      loadingTimersRef.current.delete(loadingId);
    }

    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);

    if (loadingCountRef.current === 0) {
      setIsGlobalLoading(false);
    }
  }, []);

  /**
   * Actualiza el mensaje de la pantalla de loading
   */
  const updateLoadingMessage = useCallback((message) => {
    setLoadingMessage(message || 'Estamos procesando tu solicitud...');
  }, []);

  /**
   * Fuerza la activación/desactivación de la pantalla global
   */
  const setGlobalLoadingState = useCallback((isLoading, message) => {
    setIsGlobalLoading(isLoading);
    if (message) {
      setLoadingMessage(message);
    }
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      loadingTimersRef.current.forEach(timer => clearTimeout(timer));
      loadingTimersRef.current.clear();
    };
  }, []);

  const value = {
    isGlobalLoading,
    loadingMessage,
    registerLoading,
    unregisterLoading,
    updateLoadingMessage,
    setGlobalLoadingState
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading debe usarse dentro de GlobalLoadingProvider');
  }
  return context;
}
