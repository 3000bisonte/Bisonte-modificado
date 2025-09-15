"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { isWebViewRuntime, buildBridgeCallback } from "@/lib/ua";

export default function DiagnosticPage() {
  const { status, data: session } = useSession();
  const [client, setClient] = useState<any>({});
  const [serverEcho, setServerEcho] = useState<any>(null);
  const [cookieValue, setCookieValue] = useState<string>("");

  useEffect(() => {
    try {
      const nav = navigator as any;
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (nav.standalone === true);
      const hasRNWebView = !!(window as any).ReactNativeWebView;
      const hasWKBridge = !!((window as any).webkit && (window as any).webkit.messageHandlers);
      const hasCapacitor = !!(window as any).Capacitor;
      const hasSW = !!navigator.serviceWorker;

      // cookie test
      let cookieEnabled = false;
      try {
        document.cookie = `diag_test=1; path=/`;
        cookieEnabled = document.cookie.indexOf('diag_test=1') !== -1;
      } catch {}

      // storage tests
      let ls = false, ss = false;
      try { localStorage.setItem('diag', '1'); ls = localStorage.getItem('diag') === '1'; localStorage.removeItem('diag'); } catch {}
      try { sessionStorage.setItem('diag', '1'); ss = sessionStorage.getItem('diag') === '1'; sessionStorage.removeItem('diag'); } catch {}

      setClient({
        userAgent: navigator.userAgent,
        isWebViewRuntime: isWebViewRuntime(),
        hasRNWebView,
        hasWKBridge,
        hasCapacitor,
        isStandalone,
        cookieEnabled,
        localStorage: ls,
        sessionStorage: ss,
        hasServiceWorker: hasSW,
        referrer: document.referrer,
        location: window.location.href,
      });
      setCookieValue(document.cookie || "");
    } catch (e) {
      setClient({ error: String(e) });
    }
  }, []);

  const fetchServer = async (opts?: { setCookie?: boolean; clear?: boolean }) => {
    const url = new URL('/api/diag', window.location.origin);
    if (opts?.setCookie) url.searchParams.set('setcookie', '1');
    if (opts?.clear) url.searchParams.set('clear', '1');
    const res = await fetch(url.toString(), { credentials: 'include' });
    const data = await res.json();
    setServerEcho(data);
    setCookieValue(document.cookie || "");
  };

  const testSignInBridge = async () => {
    const base = isWebViewRuntime() ? buildBridgeCallback('/home') : '/home';
    const url = new URL(base, window.location.origin);
    if (isWebViewRuntime()) url.searchParams.set('wv', '1');
    await signIn('google', { callbackUrl: url.toString(), redirect: true });
  };

  const testSignInDirect = async () => {
    await signIn('google', { callbackUrl: `${window.location.origin}/home`, redirect: true });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-900 text-gray-100">
      <h1 className="text-2xl font-semibold mb-4">Diagnóstico WebView vs Navegador</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Cliente</h2>
          <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(client, null, 2)}</pre>
          <div className="mt-2">
            <div className="text-xs text-teal-300">Session status: {status}</div>
            <div className="text-xs text-teal-300">User: {session?.user?.email || 'none'}</div>
          </div>
        </section>
        <section className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Servidor</h2>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button className="px-3 py-1 bg-teal-600 rounded" onClick={() => fetchServer()}>Server check</button>
            <button className="px-3 py-1 bg-sky-600 rounded" onClick={() => fetchServer({ setCookie: true })}>Set test cookie (SameSite=None)</button>
            <button className="px-3 py-1 bg-yellow-600 rounded" onClick={() => setCookieValue(document.cookie || "")}>Read cookies</button>
            <button className="px-3 py-1 bg-rose-600 rounded" onClick={() => fetchServer({ clear: true })}>Clear test cookie</button>
          </div>
          <pre className="text-xs whitespace-pre-wrap break-all">{serverEcho ? JSON.stringify(serverEcho, null, 2) : '—'}</pre>
          <div className="mt-2">
            <div className="text-xs text-teal-300">document.cookie: {cookieValue || 'none'}</div>
          </div>
        </section>
      </div>

      <section className="bg-gray-800 rounded-lg p-4 mt-6">
        <h2 className="text-lg font-medium mb-2">Pruebas de inicio de sesión</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="px-3 py-1 bg-blue-600 rounded" onClick={testSignInBridge}>Google Sign-In (Bridge)</button>
          <button className="px-3 py-1 bg-indigo-600 rounded" onClick={testSignInDirect}>Google Sign-In (Direct)</button>
          <a className="px-3 py-1 bg-gray-700 rounded" href="/auth/bridge?to=%2Fhome">Abrir Bridge manual</a>
        </div>
        <p className="mt-2 text-xs text-gray-300">Usa esta página dentro del WebView y en el navegador del teléfono. Las diferencias te ayudarán a detectar por qué el WebView se comporta distinto.</p>
      </section>
    </div>
  );
}
