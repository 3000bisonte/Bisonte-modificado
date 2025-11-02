"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Componente que monitorea cambios de usuario y limpia datos de formularios
 * Se debe usar en el layout principal para que funcione en toda la app
 */
export default function FormCleanupMonitor() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    // Obtener el email del usuario actual
    const currentUserEmail = session?.user?.email;
    
    // Obtener el último usuario guardado
    const lastUserEmail = localStorage.getItem('lastActiveUser');

    console.log('🔍 [FormCleanup] Verificando usuario:', {
      current: currentUserEmail || 'guest',
      last: lastUserEmail || 'none',
      status
    });

    // Si hay un cambio de usuario, limpiar todos los formularios
    if (lastUserEmail && lastUserEmail !== currentUserEmail) {
      console.warn('⚠️ [FormCleanup] CAMBIO DE USUARIO DETECTADO - Limpiando formularios');
      
      // Lista de keys a limpiar
      const formKeys = [
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

      // Limpiar localStorage
      formKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`  🗑️ Limpiando: ${key}`);
          localStorage.removeItem(key);
        }
      });

      // Limpiar sessionStorage
      sessionStorage.removeItem('origenPago');
      sessionStorage.removeItem('pagoEnProceso');
      sessionStorage.removeItem('timestampPago');

      console.log('✅ [FormCleanup] Limpieza completada');
    }

    // Actualizar el último usuario activo
    if (currentUserEmail) {
      localStorage.setItem('lastActiveUser', currentUserEmail);
      console.log('💾 [FormCleanup] Usuario activo actualizado:', currentUserEmail);
    } else if (status === 'unauthenticated') {
      // Si el usuario cerró sesión, limpiar todo
      console.log('🚪 [FormCleanup] Usuario cerró sesión - Limpiando todo');
      localStorage.removeItem('lastActiveUser');
      
      const formKeys = [
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

      formKeys.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    }
  }, [session, status]);

  // Este componente no renderiza nada visible
  return null;
}
