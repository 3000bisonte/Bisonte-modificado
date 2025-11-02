/**
 * 🛡️ Hook de React para protección CSRF
 */

import { useState, useEffect } from 'react';
import { getCsrfToken, initCsrfToken } from '@/lib/csrf';

/**
 * Hook para obtener y gestionar el token CSRF
 * 
 * @returns {Object} { csrfToken, loading, refresh }
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  const refreshToken = () => {
    setLoading(true);
    const newToken = initCsrfToken();
    setCsrfToken(newToken);
    setLoading(false);
  };
  
  useEffect(() => {
    // Intentar obtener token existente
    let token = getCsrfToken();
    
    // Si no existe o expiró, generar uno nuevo
    if (!token) {
      token = initCsrfToken();
    }
    
    setCsrfToken(token);
    setLoading(false);
  }, []);
  
  return { 
    csrfToken, 
    loading, 
    refresh: refreshToken 
  };
}
