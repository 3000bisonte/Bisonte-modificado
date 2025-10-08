'use client';

import { useEffect } from 'react';

import {
  extendHomeSticky,
  setLastActivity,
} from '../utils/homeStickyStorage';

/**
 * Custom hook para manejar el sticky home (mantener usuario en home por 30 días)
 * y registrar actividad del usuario
 */
export function useHomeSticky(userId: string | null, isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Extender el sticky home por 30 días más
    extendHomeSticky(userId || undefined);

    // Registrar la actividad actual
    if (typeof window !== 'undefined') {
      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;
      setLastActivity(userId || undefined, Date.now(), currentPath || '/home');
    }
  }, [isAuthenticated, userId]);
}
