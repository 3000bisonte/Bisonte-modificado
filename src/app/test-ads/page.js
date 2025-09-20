'use client';

import { useEffect, useState } from 'react';
import { getCurrentAdMobConfig } from '../../config/admob.config';
import { getAdConfigForEnvironment } from '../../config/web-ads.config';
import { useAdMob } from '../../services/AdMobService';

export default function AdTestPage() {
  const [diag, setDiag] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const {
    isInitialized,
    isRewardedReady,
    isLoading,
    showRewardedAd,
    showBanner,
    hideBanner,
    reinitialize,
  } = useAdMob();

  useEffect(() => {
    setIsClient(true);
    runDiag();
  }, []);

  function runDiag() {
    if (typeof window === 'undefined') return;
    const info = {
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      windowFlags: {
        hasAdmob: !!(window.admob || window.AdMob),
        hasAndroidInterface: !!window.AndroidInterface,
        hasCordovaAdmob: !!(window.cordova?.plugins?.AdMob),
      },
      admobConfig: getCurrentAdMobConfig(),
      webAdsConfig: getAdConfigForEnvironment(),
      capacitorAdmob: { isInitialized, isRewardedReady, isLoading },
    };
    setDiag(info);
    console.log('AdMob diagnostics', info);
  }

  if (!isClient) return <div className="p-6">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pruebas de Anuncios</h1>

      <div className="flex flex-wrap gap-3">
        <button onClick={runDiag} className="px-3 py-2 rounded bg-purple-600 text-white">Actualizar</button>
        <button onClick={reinitialize} disabled={isLoading} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Reinicializar</button>
        <button onClick={showRewardedAd} disabled={!isInitialized || !isRewardedReady || isLoading} className="px-3 py-2 rounded bg-orange-600 text-white disabled:opacity-50">Rewarded</button>
        <button onClick={showBanner} disabled={!isInitialized || isLoading} className="px-3 py-2 rounded bg-yellow-500 text-white disabled:opacity-50">Mostrar banner</button>
        <button onClick={hideBanner} disabled={!isInitialized} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">Ocultar banner</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-2">Estado Capacitor</h2>
          <ul className="text-sm space-y-1">
            <li>Inicializado: {isInitialized ? 'Sí ✅' : 'No ❌'}</li>
            <li>Reward listo: {isRewardedReady ? 'Sí ✅' : 'No ⏳'}</li>
            <li>Cargando: {isLoading ? 'Sí ⏳' : 'No ✅'}</li>
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-2">Entorno</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(diag ? { env: diag.env, timestamp: diag.timestamp } : {}, null, 2)}</pre>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Flags de ventana</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(diag?.windowFlags || {}, null, 2)}</pre>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Config AdMob</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(diag?.admobConfig || {}, null, 2)}</pre>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Config Web Ads</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(diag?.webAdsConfig || {}, null, 2)}</pre>
      </div>
    </div>
  );
}