'use client';

import { useEffect } from 'react';

/**
 * Componente para inicializar plugins de Capacitor en el lado cliente
 * Debe importar explícitamente el plugin BisonteAuth para que esté disponible
 */
export default function CapacitorPluginInit() {
  useEffect(() => {
    // Solo ejecutar en el lado cliente
    if (typeof window !== 'undefined') {
      initializeCapacitorPlugins();
    }
  }, []);

  return null; // No renderiza nada
}

async function initializeCapacitorPlugins() {
  try {
    console.log('🔌 Inicializando plugins de Capacitor...');
    
    // Importar el plugin BisonteAuth explícitamente
    const { BisonteAuth } = await import('@bisonte/capacitor-bisonte-auth');
    
    // Verificar que el plugin se registró correctamente
    if (BisonteAuth) {
      console.log('✅ Plugin BisonteAuth importado y disponible');
      
      // Hacer el plugin disponible globalmente para compatibilidad
      if (typeof window !== 'undefined') {
        // Asegurar que window.BisonteAuth esté disponible
        (window as any).BisonteAuth = BisonteAuth;
        
        // También verificar Capacitor.Plugins
        const { Capacitor } = await import('@capacitor/core');
        const capacitorAny = Capacitor as any;
        if (capacitorAny.Plugins) {
          console.log('🔍 Plugins registrados en Capacitor:', Object.keys(capacitorAny.Plugins));
          
          if (capacitorAny.Plugins.BisonteAuth) {
            console.log('✅ BisonteAuth encontrado en Capacitor.Plugins');
          } else {
            console.log('⚠️ BisonteAuth no encontrado en Capacitor.Plugins, pero disponible como import');
            // Hacer disponible manualmente si no está registrado
            capacitorAny.Plugins.BisonteAuth = BisonteAuth;
          }
        }
      }
    } else {
      console.log('❌ Error: Plugin BisonteAuth no pudo ser importado');
    }
  } catch (error) {
    console.error('❌ Error inicializando plugins de Capacitor:', error);
  }
}