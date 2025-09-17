"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { isWebViewRuntime, buildBridgeCallback, isCapacitorRuntime } from "@/lib/ua";
import { requestGoogleIdToken } from "@/lib/nativeBridge";

function jsonShort(obj: any, max = 800) {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > max ? s.slice(0, max) + "\n…" : s;
  } catch { return String(obj); }
}

export default function DiagnosticsWidget() {
  const [visible, setVisible] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [nativeDiag, setNativeDiag] = useState<any>(null);

  useEffect(() => {
    const hashDiag = typeof window !== 'undefined' && window.location.hash.includes('diag');
    setVisible(isWebViewRuntime() || hashDiag);
  }, []);

  useEffect(() => {
    if (!visible) return;
    try {
      const nav = navigator as any;
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (nav.standalone === true);
      const hasRNWebView = !!(window as any).ReactNativeWebView;
      const hasWKBridge = !!((window as any).webkit && (window as any).webkit.messageHandlers);
      const hasCapacitor = !!(window as any).Capacitor;
      let capPlugins: any = undefined;
      try {
        const w: any = window as any;
        capPlugins = {
          FirebaseAuthentication: !!(w.Capacitor?.Plugins?.FirebaseAuthentication || w.FirebaseAuthentication),
          GoogleAuth: !!(w.Capacitor?.Plugins?.GoogleAuth || w.GoogleAuth),
          BisonteAuth: !!(w.Capacitor?.Plugins?.BisonteAuth || w.BisonteAuth),
        };
      } catch {}
      const hasSW = !!navigator.serviceWorker;
      let cookieEnabled = false;
      try { document.cookie = `diag_widget=1; path=/`; cookieEnabled = document.cookie.includes('diag_widget=1'); } catch {}
      let ls=false, ss=false; try { localStorage.setItem('dw','1'); ls = localStorage.getItem('dw')==='1'; localStorage.removeItem('dw'); } catch {}
      try { sessionStorage.setItem('dw','1'); ss = sessionStorage.getItem('dw')==='1'; sessionStorage.removeItem('dw'); } catch {}
      setClient({
        userAgent: navigator.userAgent,
        isWebViewRuntime: isWebViewRuntime(),
        hasRNWebView, hasWKBridge, hasCapacitor,
        capPlugins,
        isStandalone, cookieEnabled, localStorage: ls, sessionStorage: ss, hasServiceWorker: hasSW,
        href: window.location.href,
      });
    } catch (e) { setClient({ error: String(e) }); }
  }, [visible]);

  const serverCheck = async (op?: 'set'|'clear', kind?: 'none'|'lax'|'client'|'all') => {
    const u = new URL('/api/diag', window.location.origin);
    if (op==='set') u.searchParams.set('setcookie', kind || 'none');
    if (op==='clear') u.searchParams.set('clear', kind ? (kind==='all'?'1':kind==='none'?'diag_server_none':kind==='lax'?'diag_server_lax':'diag_client') : '1');
    const res = await fetch(u.toString(), { credentials: 'include' });
    const data = await res.json();
    setServer(data);
  };

  const signInNative = async () => {
    const bridge = new URL(buildBridgeCallback('/home'), window.location.origin);
    bridge.searchParams.set('wv','1');
    const token = await requestGoogleIdToken(15000);
    if (!token) {
      alert('No se recibió idToken desde la app nativa. Verifica la integración en Capacitor (plugin Google/FirebaseAuth).');
      return;
    }
    await signIn('credentials', { idToken: token, redirect: true, callbackUrl: bridge.toString() });
  };

  const signInCCT = async () => {
    try {
      const w: any = window as any;
      const BA = w.Capacitor?.Plugins?.BisonteAuth || w.BisonteAuth;
      if (!BA || typeof BA.googleSignInCCT !== 'function') {
        alert('Plugin BisonteAuth.googleSignInCCT no disponible.');
        return;
      }
      const res = await BA.googleSignInCCT();
      const idToken = res?.idToken || res?.token;
      if (!idToken) {
        alert('El plugin no devolvió idToken.');
        return;
      }
      const bridge = new URL(buildBridgeCallback('/home'), window.location.origin);
      bridge.searchParams.set('wv','1');
      await signIn('credentials', { idToken, redirect: true, callbackUrl: bridge.toString() });
    } catch (e:any) {
      alert('Error en CCT: ' + (e?.message || e));
    }
  };

  const testCapacitorPlugins = async () => {
    const w: any = window as any;
    const out: any = { when: new Date().toISOString() };
    try {
      const BA = w.Capacitor?.Plugins?.BisonteAuth || w.BisonteAuth;
      out.BisonteAuth = {
        available: !!(BA && typeof BA.googleSignInCCT === 'function')
      };
      if (out.BisonteAuth.available) {
        try {
          const res = await BA.googleSignInCCT();
          out.BisonteAuth.result = res;
          out.BisonteAuth.idTokenLen = (res?.idToken || res?.token)?.length || 0;
        } catch (e:any) {
          out.BisonteAuth.error = e?.message || String(e);
        }
      }
    } catch {}
    try {
      const CFA = w.Capacitor?.Plugins?.FirebaseAuthentication || w.FirebaseAuthentication;
      out.FirebaseAuthentication = { available: !!(CFA && typeof CFA.signInWithGoogle === 'function') };
      if (out.FirebaseAuthentication.available) {
        try {
          const res = await CFA.signInWithGoogle();
          out.FirebaseAuthentication.result = res;
          const t = res?.credential?.idToken || res?.idToken || res?.accessToken;
          out.FirebaseAuthentication.idTokenLen = (t && typeof t === 'string') ? t.length : 0;
        } catch (e:any) {
          out.FirebaseAuthentication.error = e?.message || String(e);
        }
      }
    } catch {}
    try {
      const CGA = w.Capacitor?.Plugins?.GoogleAuth || w.GoogleAuth;
      out.GoogleAuth = { available: !!(CGA && typeof CGA.signIn === 'function') };
      if (out.GoogleAuth.available) {
        try {
          if (typeof CGA.initialize === 'function') {
            await CGA.initialize();
            out.GoogleAuth.initialized = true;
          }
        } catch (e:any) {
          out.GoogleAuth.initError = e?.message || String(e);
        }
        try {
          const res = await CGA.signIn();
          out.GoogleAuth.result = res;
          const t = res?.authentication?.idToken || res?.idToken;
          out.GoogleAuth.idTokenLen = (t && typeof t === 'string') ? t.length : 0;
        } catch (e:any) {
          out.GoogleAuth.error = e?.message || String(e);
        }
      }
    } catch {}
    setNativeDiag(out);
  };

  if (!visible) return null;

  return (
    <div style={{position:'fixed', bottom: 8, right: 8, zIndex: 9999}}>
      <div className="bg-gray-900/95 text-gray-100 border border-gray-700 rounded shadow-xl p-3 w-[92vw] max-w-[420px]">
        <div className="flex items-center justify-between mb-2">
          <strong>Diag Widget</strong>
          <button className="text-sm text-gray-300" onClick={()=>setVisible(false)}>ocultar</button>
        </div>
        <div className="text-xs">
          <div className="mb-2">
            <div className="font-semibold">Cliente</div>
            <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(client)}</pre>
          </div>
          <div className="mb-2">
            <div className="font-semibold">Servidor</div>
            <div className="flex gap-2 mb-1 flex-wrap">
              <button className="px-2 py-0.5 bg-teal-600 rounded" onClick={()=>serverCheck()}>Check</button>
              <button className="px-2 py-0.5 bg-sky-600 rounded" onClick={()=>serverCheck('set','none')}>Set None</button>
              <button className="px-2 py-0.5 bg-amber-600 rounded" onClick={()=>serverCheck('set','lax')}>Set Lax</button>
              <button className="px-2 py-0.5 bg-indigo-600 rounded" onClick={()=>serverCheck('set','client')}>Set Client</button>
              <button className="px-2 py-0.5 bg-rose-600 rounded" onClick={()=>serverCheck('clear','all')}>Clear all</button>
            </div>
            <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(server)}</pre>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-2 py-0.5 bg-blue-600 rounded" onClick={signInNative}>Nativo (Capacitor)</button>
            <button className="px-2 py-0.5 bg-emerald-600 rounded" onClick={signInCCT}>CCT (Custom Tabs)</button>
            <button className="px-2 py-0.5 bg-fuchsia-700 rounded" onClick={testCapacitorPlugins}>Test Plugins</button>
            <a className="px-2 py-0.5 bg-gray-700 rounded" href="/diagnostic" target="_blank" rel="noreferrer">/diagnostic</a>
          </div>
          {nativeDiag && (
            <div className="mt-2">
              <div className="font-semibold">Capacitor Plugins</div>
              <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(nativeDiag, 1600)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
