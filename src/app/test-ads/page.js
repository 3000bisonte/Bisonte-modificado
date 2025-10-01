'use client';

import { useCallback, useEffect, useState } from 'react';

import { getCurrentAdMobConfig } from '../../config/admob.config';
import { getAdConfigForEnvironment } from '../../config/web-ads.config';
import { useAdMob } from '../../services/AdMobService';

/**
 * @typedef {Object} WindowFlags
 * @property {boolean} hasAdmob
 * @property {boolean} hasAndroidInterface
 * @property {boolean} hasCordovaAdmob
 */

/**
 * @typedef {Object} CapacitorState
 * @property {boolean} isInitialized
 * @property {boolean} isRewardedReady
 * @property {boolean} isLoading
 */

/**
 * @typedef {Object} AdDiagSnapshot
 * @property {string} env
 * @property {string} timestamp
 * @property {WindowFlags} windowFlags
 * @property {unknown} admobConfig
 * @property {unknown} webAdsConfig
 * @property {CapacitorState} capacitorAdmob
 */

export default function AdTestPage() {
  const [diag, setDiag] = useState(/** @type {AdDiagSnapshot | null} */ (null));
  const [isClient, setIsClient] = useState(false);

  const {
    isInitialized,
    isRewardedReady,
    isLoading,
    showRewardedAd,
    showBanner,
    hideBanner,
    reinitialize,
    lastReward,
    lastError,
  } = useAdMob();

  const runDiag = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const globalWindow = window;
    const hasAdmob = Boolean(('admob' in globalWindow && globalWindow.admob) || ('AdMob' in globalWindow && globalWindow.AdMob));
    const hasAndroidInterface = 'AndroidInterface' in globalWindow;

    const cordovaValue = 'cordova' in globalWindow ? globalWindow.cordova : undefined;
    const pluginsValue = cordovaValue && typeof cordovaValue === 'object' && cordovaValue !== null && 'plugins' in cordovaValue
      ? cordovaValue.plugins
      : undefined;
    const hasCordovaAdmob = Boolean(
      pluginsValue
        && typeof pluginsValue === 'object'
        && pluginsValue !== null
        && typeof Reflect.get(pluginsValue, 'AdMob') !== 'undefined'
    );

    const info = {
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      windowFlags: {
        hasAdmob,
        hasAndroidInterface,
        hasCordovaAdmob,
      },
      admobConfig: getCurrentAdMobConfig(),
      webAdsConfig: getAdConfigForEnvironment(),
      capacitorAdmob: { isInitialized, isRewardedReady, isLoading },
    };

    setDiag(info);
    // eslint-disable-next-line no-console
    console.log('AdMob diagnostics', info);
  }, [isInitialized, isRewardedReady, isLoading]);

  useEffect(() => {
    setIsClient(true);
    runDiag();
  }, [runDiag]);

  if (!isClient) {
    return <div className="p-6">Cargando…</div>;
  }

  const envDetails = diag ? { env: diag.env, timestamp: diag.timestamp } : {};

  const windowFlags = diag?.windowFlags ?? { hasAdmob: false, hasAndroidInterface: false, hasCordovaAdmob: false };

  const admobConfig = diag?.admobConfig ?? {};
  const webAdsConfig = diag?.webAdsConfig ?? {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pruebas de Anuncios</h1>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => runDiag()} className="px-3 py-2 rounded bg-purple-600 text-white">Actualizar</button>
        <button onClick={() => { void reinitialize(); }} disabled={isLoading} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Reinicializar</button>
        <button onClick={() => { void showRewardedAd(); }} disabled={!isInitialized || !isRewardedReady || isLoading} className="px-3 py-2 rounded bg-orange-600 text-white disabled:opacity-50">Rewarded</button>
        <button onClick={() => { void showBanner(); }} disabled={!isInitialized || isLoading} className="px-3 py-2 rounded bg-yellow-500 text-white disabled:opacity-50">Mostrar banner</button>
        <button onClick={() => { void hideBanner(); }} disabled={!isInitialized} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">Ocultar banner</button>
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
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(envDetails, null, 2)}</pre>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-2">Último reward</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(lastReward || {}, null, 2)}</pre>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-2">Último error</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(lastError || {}, null, 2)}</pre>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Flags de ventana</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(windowFlags, null, 2)}</pre>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Config AdMob</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(admobConfig, null, 2)}</pre>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-2">Config Web Ads</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(webAdsConfig, null, 2)}</pre>
      </div>
    </div>
  );
}