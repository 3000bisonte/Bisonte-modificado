/**
 * Hook personalizado para gestionar formularios con segmentación por usuario
 * Previene la persistencia de datos entre diferentes sesiones/usuarios
 */

import { useSession } from 'next-auth/react';
import { useEffect, useCallback } from 'react';

/**
 * Genera una clave única para el usuario actual
 * @returns {string} Identificador único del usuario o 'guest'
 */
const getUserKey = (session) => {
  if (!session?.user?.email) return 'guest';
  // Usar email como identificador único
  return `user_${session.user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
};

/**
 * Lista de claves de localStorage que contienen datos de formularios
 */
const FORM_KEYS = [
  'formCotizador',
  'formDestinatario',
  'formRemitente',
  'formDataRemitente',
  'cotizacion',
  'envioRegistrado',
  'envioExitoso',
  'envioDatos',
  'ultimoEnvioId',
  'ordenesCreadas',
  'pagoRechazado',
  'pagoRechazadoMotivo',
];

/**
 * Hook para gestionar el almacenamiento de formularios por usuario
 */
export function useUserFormStorage() {
  const { data: session, status } = useSession();
  
  /**
   * Limpia todos los datos de formularios del localStorage
   */
  const clearAllFormData = useCallback(() => {
    console.log('🧹 [FormStorage] Limpiando datos de formularios...');
    FORM_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    // También limpiar sessionStorage
    sessionStorage.removeItem('origenPago');
    sessionStorage.removeItem('pagoEnProceso');
    sessionStorage.removeItem('timestampPago');
    console.log('✅ [FormStorage] Datos de formularios limpiados');
  }, []);

  /**
   * Guarda el identificador del último usuario que usó la app
   */
  const saveLastUser = useCallback((userKey) => {
    localStorage.setItem('lastUserKey', userKey);
  }, []);

  /**
   * Obtiene el identificador del último usuario
   */
  const getLastUser = useCallback(() => {
    return localStorage.getItem('lastUserKey');
  }, []);

  /**
   * Verifica si el usuario cambió y limpia los datos si es necesario
   */
  useEffect(() => {
    if (status === 'loading') return;

    const currentUserKey = getUserKey(session);
    const lastUserKey = getLastUser();

    console.log('🔍 [FormStorage] Verificando usuario:', {
      current: currentUserKey,
      last: lastUserKey,
      status,
    });

    // Si el usuario cambió (o es la primera vez), limpiar datos
    if (lastUserKey && lastUserKey !== currentUserKey) {
      console.warn('⚠️ [FormStorage] Cambio de usuario detectado');
      clearAllFormData();
    }

    // Actualizar el último usuario
    if (currentUserKey !== 'guest') {
      saveLastUser(currentUserKey);
    }
  }, [session, status, clearAllFormData, saveLastUser, getLastUser]);

  /**
   * Guarda datos en localStorage con segmentación por usuario
   */
  const setFormData = useCallback((key, value) => {
    const userKey = getUserKey(session);
    const segmentedKey = `${userKey}_${key}`;
    
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(segmentedKey, jsonValue);
      console.log(`💾 [FormStorage] Guardado: ${segmentedKey}`);
    } catch (error) {
      console.error(`❌ [FormStorage] Error guardando ${key}:`, error);
    }
  }, [session]);

  /**
   * Obtiene datos del localStorage segmentados por usuario
   */
  const getFormData = useCallback((key, defaultValue = null) => {
    const userKey = getUserKey(session);
    const segmentedKey = `${userKey}_${key}`;
    
    try {
      const item = localStorage.getItem(segmentedKey);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`❌ [FormStorage] Error leyendo ${key}:`, error);
      return defaultValue;
    }
  }, [session]);

  /**
   * Elimina datos del localStorage
   */
  const removeFormData = useCallback((key) => {
    const userKey = getUserKey(session);
    const segmentedKey = `${userKey}_${key}`;
    localStorage.removeItem(segmentedKey);
    console.log(`🗑️ [FormStorage] Eliminado: ${segmentedKey}`);
  }, [session]);

  return {
    setFormData,
    getFormData,
    removeFormData,
    clearAllFormData,
    currentUserKey: getUserKey(session),
  };
}

/**
 * Hook simple para limpiar formularios al desmontar o cerrar sesión
 */
export function useFormCleanup() {
  const { status } = useSession();
  const { clearAllFormData } = useUserFormStorage();

  useEffect(() => {
    // Limpiar al cerrar sesión
    if (status === 'unauthenticated') {
      clearAllFormData();
    }
  }, [status, clearAllFormData]);

  return { clearAllFormData };
}
