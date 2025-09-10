'use client';
import { useState, useEffect } from 'react';
import { getCurrentAdMobConfig } from '../../config/admob.config';
import { getAdConfigForEnvironment } from '../../config/web-ads.config';

export default function AdTestPage() {
  const [testResults, setTestResults] = useState({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    runAdMobTests();
  }, []);

  const runAdMobTests = () => {
    if (typeof window === 'undefined') return;

    const results = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        hasWindow: typeof window !== 'undefined',
        userAgent: navigator?.userAgent?.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      },
      admobNative: {
        hasAdMob: !!(window.admob || window.AdMob),
        hasPlugins: !!window.plugins,
        hasCordova: !!window.cordova,
        hasAdMobPlugins: !!(window.plugins?.AdMob || window.cordova?.plugins?.AdMob),
        windowObjects: Object.keys(window).filter(key => 
          key.toLowerCase().includes('admob') || 
          key.toLowerCase().includes('ad')
        )
      },
      device: {
        isMobile: /Mobile|Android|iPhone|iPad/.test(navigator?.userAgent || ''),
        isAndroid: /Android/.test(navigator?.userAgent || ''),
        isIOS: /iPhone|iPad|iPod/.test(navigator?.userAgent || ''),
        platform: navigator?.platform || 'Unknown',
        standalone: window.navigator?.standalone || false,
        displayMode: window.matchMedia?.('(display-mode: standalone)')?.matches || false
      }
    };

    setTestResults(results);
  };

  const testAdMobFunction = () => {
    if (window.admob) {
      console.log('✅ AdMob detectado - Intentando mostrar banner');
      alert('AdMob nativo detectado!');
    } else {
      console.log('❌ AdMob no está disponible');
      alert('AdMob no disponible - modo web');
    }
  };

  const testWebAds = () => {
    console.log('🌐 Configuración de anuncios web');
    alert('Anuncio web simulado completado');
  };

  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen">Cargando pruebas de anuncios...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">🧪 Pruebas de Anuncios</h1>
        <p className="text-gray-600 mb-4">
          Esta página permite probar la configuración de AdMob y anuncios web.
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={testAdMobFunction}
        >
          🎯 Probar AdMob Nativo
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={testWebAds}
        >
          🌐 Probar Anuncios Web
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          onClick={runAdMobTests}
        >
          🔄 Actualizar Tests
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🌍 Entorno</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">NODE_ENV:</span> {testResults?.environment?.nodeEnv}</p>
            <p><span className="font-medium">Es Producción:</span> {testResults?.environment?.isProduction ? '✅' : '❌'}</p>
            <p><span className="font-medium">Window disponible:</span> {testResults?.environment?.hasWindow ? '✅' : '❌'}</p>
            <p><span className="font-medium">Timestamp:</span> {testResults?.environment?.timestamp}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📱 AdMob Nativo</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">AdMob disponible:</span> {testResults?.admobNative?.hasAdMob ? '✅' : '❌'}</p>
            <p><span className="font-medium">Plugins disponibles:</span> {testResults?.admobNative?.hasPlugins ? '✅' : '❌'}</p>
            <p><span className="font-medium">Cordova disponible:</span> {testResults?.admobNative?.hasCordova ? '✅' : '❌'}</p>
            <p><span className="font-medium">AdMob Plugins:</span> {testResults?.admobNative?.hasAdMobPlugins ? '✅' : '❌'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📱 Dispositivo</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Es móvil:</span> {testResults?.device?.isMobile ? '✅' : '❌'}</p>
            <p><span className="font-medium">Es Android:</span> {testResults?.device?.isAndroid ? '✅' : '❌'}</p>
            <p><span className="font-medium">Es iOS:</span> {testResults?.device?.isIOS ? '✅' : '❌'}</p>
            <p><span className="font-medium">Plataforma:</span> {testResults?.device?.platform}</p>
            <p><span className="font-medium">Standalone:</span> {testResults?.device?.standalone ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Instrucciones</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Los anuncios nativos solo funcionan en APK compilado</li>
          <li>• Los anuncios web funcionan en navegador y APK</li>
          <li>• Verificar que las IDs de AdMob sean correctas</li>
          <li>• Comprobar que los permisos estén configurados</li>
        </ul>
      </div>
    </div>
  );
}
