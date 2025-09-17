'use client';

import { useEffect, useState } from 'react';

export default function PluginTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testPluginAvailability();
  }, []);

  const testPluginAvailability = async () => {
    try {
      console.log('🔍 Iniciando test de disponibilidad de plugins...');
      
      const results = {
        timestamp: new Date().toISOString(),
        platform: 'unknown',
        isNative: false,
        plugins: {},
        bisonteAuth: {
          available: false,
          source: 'none',
          error: null
        }
      };

      // Verificar plataforma
      if (typeof window !== 'undefined') {
        results.platform = 'web';
        
        // Intentar importar Capacitor
        try {
          const { Capacitor } = await import('@capacitor/core');
          results.platform = Capacitor.getPlatform();
          results.isNative = Capacitor.isNativePlatform();
          
          // Verificar plugins en Capacitor
          const capacitorAny = Capacitor as any;
          if (capacitorAny.Plugins) {
            results.plugins = Object.keys(capacitorAny.Plugins);
            
            if (capacitorAny.Plugins.BisonteAuth) {
              results.bisonteAuth.available = true;
              results.bisonteAuth.source = 'Capacitor.Plugins';
            }
          }
        } catch (error) {
          console.log('Error importando Capacitor:', error);
        }

        // Verificar BisonteAuth directamente
        if (!results.bisonteAuth.available) {
          try {
            const { BisonteAuth } = await import('@bisonte/capacitor-bisonte-auth');
            if (BisonteAuth && BisonteAuth.googleSignInCCT) {
              results.bisonteAuth.available = true;
              results.bisonteAuth.source = 'direct import';
            }
          } catch (error) {
            results.bisonteAuth.error = error.message;
          }
        }

        // Verificar window globals
        if (!results.bisonteAuth.available) {
          const windowAny = window as any;
          const BA = windowAny.Capacitor?.Plugins?.BisonteAuth || windowAny.BisonteAuth;
          if (BA && BA.googleSignInCCT) {
            results.bisonteAuth.available = true;
            results.bisonteAuth.source = 'window global';
          }
        }
      }

      setTestResults(results);
      setIsLoading(false);
      
      console.log('✅ Test completado:', results);
    } catch (error) {
      console.error('❌ Error en test:', error);
      setTestResults({ error: error.message });
      setIsLoading(false);
    }
  };

  const testGoogleSignIn = async () => {
    try {
      let BA = null;
      
      // Intentar múltiples formas de obtener el plugin
      try {
        const { BisonteAuth } = await import('@bisonte/capacitor-bisonte-auth');
        BA = BisonteAuth;
      } catch (error) {
        console.log('Import directo falló, intentando window...');
        const windowAny = window as any;
        BA = windowAny.Capacitor?.Plugins?.BisonteAuth || windowAny.BisonteAuth;
      }

      if (!BA || !BA.googleSignInCCT) {
        alert('❌ Plugin BisonteAuth no disponible');
        return;
      }

      alert('🔍 Iniciando test de Google Sign-In...');
      
      const result = await BA.googleSignInCCT();
      alert(`✅ Token recibido: ${result.idToken ? 'Sí' : 'No'}\nLongitud: ${result.idToken?.length || 0}`);
      
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      console.error('Error en googleSignInCCT:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Test de Plugins de Capacitor</h1>
        <p>Cargando test...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Test de Plugins de Capacitor</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Resultados del Test</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      <div className="space-y-3">
        <button
          onClick={testPluginAvailability}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          🔄 Re-ejecutar Test
        </button>
        
        <button
          onClick={testGoogleSignIn}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          disabled={!testResults?.bisonteAuth?.available}
        >
          🔐 Test Google Sign-In
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Estado del Plugin:</strong> {testResults?.bisonteAuth?.available ? '✅ Disponible' : '❌ No disponible'}</p>
        <p><strong>Fuente:</strong> {testResults?.bisonteAuth?.source || 'N/A'}</p>
        <p><strong>Plataforma:</strong> {testResults?.platform}</p>
        <p><strong>Nativo:</strong> {testResults?.isNative ? 'Sí' : 'No'}</p>
      </div>
    </div>
  );
}