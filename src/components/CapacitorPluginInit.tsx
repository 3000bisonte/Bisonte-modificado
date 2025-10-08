'use client';

import { useEffect } from 'react';

type CapacitorModule = typeof import('@capacitor/core');
type CapacitorGlobal = CapacitorModule['Capacitor'];
type CapacitorPlugins = CapacitorGlobal['Plugins'];
type BisonteAuthModule = typeof import('@bisonte/capacitor-bisonte-auth');
type BisonteAuthPlugin = BisonteAuthModule['BisonteAuth'];
type AugmentedPlugins = (CapacitorPlugins & { BisonteAuth?: BisonteAuthPlugin }) | undefined;

/**
 * Componente para inicializar plugins de Capacitor en el lado cliente
 * Debe importar explícitamente el plugin BisonteAuth para que esté disponible
 */
export default function CapacitorPluginInit() {
  useEffect(() => {
    // Solo ejecutar en el lado cliente
    if (typeof window !== 'undefined') {
      void initializeCapacitorPlugins();
    }
  }, []);

  return null; // No renderiza nada
}

async function initializeCapacitorPlugins() {
  try {
    console.log('🔌 Inicializando plugins de Capacitor...');

    // Importar el plugin BisonteAuth explícitamente de forma dinámica
    const { BisonteAuth } = await import('@bisonte/capacitor-bisonte-auth');

    if (!BisonteAuth) {
      console.warn('❌ Error: Plugin BisonteAuth no pudo ser importado');
      return;
    }

    // Hacer el plugin disponible globalmente para compatibilidad
    if (typeof window === 'undefined') {
      return;
    }

    window.BisonteAuth = BisonteAuth;

    const capacitorModule: CapacitorModule = await import('@capacitor/core');
    const capacitor: CapacitorGlobal = capacitorModule.Capacitor;
    const plugins = capacitor.Plugins as AugmentedPlugins;

    if (!plugins) {
      console.warn('⚠️ Capacitor.Plugins no está disponible.');
      return;
    }

    if (plugins.BisonteAuth) {
      console.log('✅ BisonteAuth encontrado en Capacitor.Plugins');
      return;
    }

    plugins.BisonteAuth = BisonteAuth;
    console.log('✅ BisonteAuth registrado manualmente en Capacitor.Plugins');
  } catch (error) {
    console.error('❌ Error inicializando plugins de Capacitor:', error);
  }
}