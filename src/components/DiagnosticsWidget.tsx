"use client";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { requestGoogleIdToken } from "@/lib/nativeBridge";
import { isWebViewRuntime, buildBridgeCallback } from "@/lib/ua";

interface ClientDiagnostics {
  userAgent?: string;
  isWebViewRuntime?: boolean;
  hasRNWebView?: boolean;
  hasWKBridge?: boolean;
  hasCapacitor?: boolean;
  capPlugins?: Record<string, boolean>;
  isStandalone?: boolean;
  cookieEnabled?: boolean;
  localStorage?: boolean;
  sessionStorage?: boolean;
  hasServiceWorker?: boolean;
  href?: string;
  error?: string;
}

interface ServerDiagnostics {
  [key: string]: unknown;
}

function jsonShort(obj: unknown, max = 800): string {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > max ? s.slice(0, max) + "\n…" : s;
  } catch { return String(obj); }
}

export default function DiagnosticsWidget() {
  const [visible, setVisible] = useState(false);
  const [client, setClient] = useState<ClientDiagnostics | null>(null);
  const [server, setServer] = useState<ServerDiagnostics | null>(null);
  const [nativeDiag, setNativeDiag] = useState<Record<string, unknown> | null>(null);
  const [lastIdToken, setLastIdToken] = useState<string | null>(null);
  const [verifyRes, setVerifyRes] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const hashDiag = typeof window !== 'undefined' && window.location.hash.includes('diag');
    setVisible(isWebViewRuntime() || hashDiag);
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    try {
      type ExtendedNavigator = Navigator & { standalone?: boolean };
      type ExtendedWindow = Window & {
        ReactNativeWebView?: unknown;
        webkit?: { messageHandlers?: unknown };
        Capacitor?: {
          Plugins?: {
            FirebaseAuthentication?: unknown;
            GoogleAuth?: unknown;
            BisonteAuth?: unknown;
          };
        };
        FirebaseAuthentication?: unknown;
        GoogleAuth?: unknown;
        BisonteAuth?: unknown;
      };

      const nav = navigator as ExtendedNavigator;
      const w = window as ExtendedWindow;
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (nav.standalone === true);
      const hasRNWebView = !!w.ReactNativeWebView;
      const hasWKBridge = !!(w.webkit && w.webkit.messageHandlers);
      const hasCapacitor = !!w.Capacitor;
      let capPlugins: Record<string, boolean> | undefined = undefined;
      try {
        capPlugins = {
          FirebaseAuthentication: !!(w.Capacitor?.Plugins?.FirebaseAuthentication || w.FirebaseAuthentication),
          GoogleAuth: !!(w.Capacitor?.Plugins?.GoogleAuth || w.GoogleAuth),
          BisonteAuth: !!(w.Capacitor?.Plugins?.BisonteAuth || w.BisonteAuth),
        };
      } catch {
        // Plugin detection failed
      }
      const hasSW = !!navigator.serviceWorker;
      let cookieEnabled = false;
      try { document.cookie = `diag_widget=1; path=/`; cookieEnabled = document.cookie.includes('diag_widget=1'); } catch {
        // Cookie access failed
      }
      let ls=false, ss=false; try { localStorage.setItem('dw','1'); ls = localStorage.getItem('dw')==='1'; localStorage.removeItem('dw'); } catch {
        // localStorage access failed
      }
      try { sessionStorage.setItem('dw','1'); ss = sessionStorage.getItem('dw')==='1'; sessionStorage.removeItem('dw'); } catch {
        // sessionStorage access failed
      }
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
    if (op==='set') {u.searchParams.set('setcookie', kind || 'none');}
    if (op==='clear') {u.searchParams.set('clear', kind ? (kind==='all'?'1':kind==='none'?'diag_server_none':kind==='lax'?'diag_server_lax':'diag_client') : '1');}
    const res = await fetch(u.toString(), { credentials: 'include' });
    const data = await res.json() as Record<string, unknown>;
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
    setLastIdToken(token);
    await signIn('credentials', { idToken: token, redirect: true, callbackUrl: bridge.toString() });
  };

  const signInCCT = async () => {
    try {
      type ExtendedWindow = Window & {
        Capacitor?: {
          Plugins?: {
            BisonteAuth?: {
              googleSignInCCT: () => Promise<{ idToken?: string; token?: string }>;
            };
          };
        };
        BisonteAuth?: {
          googleSignInCCT: () => Promise<{ idToken?: string; token?: string }>;
        };
      };
      const w = window as ExtendedWindow;
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
      setLastIdToken(idToken);
      const bridge = new URL(buildBridgeCallback('/home'), window.location.origin);
      bridge.searchParams.set('wv','1');
      await signIn('credentials', { idToken, redirect: true, callbackUrl: bridge.toString() });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      alert('Error en CCT: ' + errMsg);
    }
  };

  const testCapacitorPlugins = async () => {
    type ExtendedWindow = Window & {
      Capacitor?: {
        Plugins?: {
          BisonteAuth?: {
            googleSignInCCT: () => Promise<{ idToken?: string; token?: string }>;
          };
          FirebaseAuthentication?: {
            signInWithGoogle: () => Promise<{
              credential?: { idToken?: string };
              idToken?: string;
              accessToken?: string;
            }>;
          };
          GoogleAuth?: {
            initialize?: () => Promise<void>;
            signIn: () => Promise<{
              authentication?: { idToken?: string };
              idToken?: string;
            }>;
          };
        };
      };
      BisonteAuth?: {
        googleSignInCCT: () => Promise<{ idToken?: string; token?: string }>;
      };
      FirebaseAuthentication?: {
        signInWithGoogle: () => Promise<{
          credential?: { idToken?: string };
          idToken?: string;
          accessToken?: string;
        }>;
      };
      GoogleAuth?: {
        initialize?: () => Promise<void>;
        signIn: () => Promise<{
          authentication?: { idToken?: string };
          idToken?: string;
        }>;
      };
    };
    const w = window as ExtendedWindow;
    const out: Record<string, unknown> = { when: new Date().toISOString() };
    try {
      const BA = w.Capacitor?.Plugins?.BisonteAuth || w.BisonteAuth;
      out.BisonteAuth = {
        available: !!(BA && typeof BA.googleSignInCCT === 'function')
      };
      if (out.BisonteAuth && typeof out.BisonteAuth === 'object' && 'available' in out.BisonteAuth && out.BisonteAuth.available && BA) {
        try {
          const res = await BA.googleSignInCCT();
          (out.BisonteAuth as Record<string, unknown>).result = res;
          (out.BisonteAuth as Record<string, unknown>).idTokenLen = (res?.idToken || res?.token)?.length || 0;
          if (res?.idToken || res?.token) {setLastIdToken(res.idToken || res.token);}
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          (out.BisonteAuth as Record<string, unknown>).error = errMsg;
        }
      }
    } catch {
      // BisonteAuth detection failed
    }
    try {
      const CFA = w.Capacitor?.Plugins?.FirebaseAuthentication || w.FirebaseAuthentication;
      out.FirebaseAuthentication = { available: !!(CFA && typeof CFA.signInWithGoogle === 'function') };
      if (out.FirebaseAuthentication && typeof out.FirebaseAuthentication === 'object' && 'available' in out.FirebaseAuthentication && out.FirebaseAuthentication.available && CFA) {
        try {
          const res = await CFA.signInWithGoogle();
          (out.FirebaseAuthentication as Record<string, unknown>).result = res;
          const t = res?.credential?.idToken || res?.idToken || res?.accessToken;
          (out.FirebaseAuthentication as Record<string, unknown>).idTokenLen = (t && typeof t === 'string') ? t.length : 0;
          if (t && typeof t === 'string') {setLastIdToken(t);}
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          (out.FirebaseAuthentication as Record<string, unknown>).error = errMsg;
        }
      }
    } catch {
      // FirebaseAuthentication detection failed
    }
    try {
      const CGA = w.Capacitor?.Plugins?.GoogleAuth || w.GoogleAuth;
      out.GoogleAuth = { available: !!(CGA && typeof CGA.signIn === 'function') };
      if (out.GoogleAuth && typeof out.GoogleAuth === 'object' && 'available' in out.GoogleAuth && out.GoogleAuth.available && CGA) {
        try {
          if (typeof CGA.initialize === 'function') {
            await CGA.initialize();
            (out.GoogleAuth as Record<string, unknown>).initialized = true;
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          (out.GoogleAuth as Record<string, unknown>).initError = errMsg;
        }
        try {
          const res = await CGA.signIn();
          (out.GoogleAuth as Record<string, unknown>).result = res;
          const t = res?.authentication?.idToken || res?.idToken;
          (out.GoogleAuth as Record<string, unknown>).idTokenLen = (t && typeof t === 'string') ? t.length : 0;
          if (t && typeof t === 'string') {setLastIdToken(t);}
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          (out.GoogleAuth as Record<string, unknown>).error = errMsg;
        }
      }
    } catch {
      // GoogleAuth detection failed
    }
    setNativeDiag(out);
  };

  const verifyIdToken = async () => {
    if (!lastIdToken) {
      alert('No hay idToken capturado aún. Usa "Test Plugins" o "Nativo (Capacitor)" primero.');
      return;
    }
    try {
      const res = await fetch('/api/auth/verify-idtoken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: lastIdToken })
      });
      const data = await res.json() as Record<string, unknown>;
      setVerifyRes(data);
      if (!data?.ok) {
        const errorMsg = typeof data?.error === 'string' ? data.error : 'error';
        alert('Verificación fallida: ' + errorMsg);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      alert('Error verificando token: ' + errMsg);
    }
  };

  if (!visible) {return null;}

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
              <button className="px-2 py-0.5 bg-teal-600 rounded" onClick={()=>void serverCheck()}>Check</button>
              <button className="px-2 py-0.5 bg-sky-600 rounded" onClick={()=>void serverCheck('set','none')}>Set None</button>
              <button className="px-2 py-0.5 bg-amber-600 rounded" onClick={()=>void serverCheck('set','lax')}>Set Lax</button>
              <button className="px-2 py-0.5 bg-indigo-600 rounded" onClick={()=>void serverCheck('set','client')}>Set Client</button>
              <button className="px-2 py-0.5 bg-rose-600 rounded" onClick={()=>void serverCheck('clear','all')}>Clear all</button>
            </div>
            <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(server)}</pre>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-2 py-0.5 bg-blue-600 rounded" onClick={()=>void signInNative()}>Nativo (Capacitor)</button>
            <button className="px-2 py-0.5 bg-emerald-600 rounded" onClick={()=>void signInCCT()}>CCT (Custom Tabs)</button>
            <button className="px-2 py-0.5 bg-fuchsia-700 rounded" onClick={()=>void testCapacitorPlugins()}>Test Plugins</button>
            <button className="px-2 py-0.5 bg-amber-700 rounded" onClick={()=>void verifyIdToken()} disabled={!lastIdToken}>Verificar Token</button>
            <a className="px-2 py-0.5 bg-gray-700 rounded" href="/diagnostic" target="_blank" rel="noreferrer">/diagnostic</a>
          </div>
          {lastIdToken && (
            <div className="mt-2 text-[10px] text-gray-300">Token capturado: {lastIdToken.slice(0,16)}… (len {lastIdToken.length})</div>
          )}
          {nativeDiag && (
            <div className="mt-2">
              <div className="font-semibold">Capacitor Plugins</div>
              <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(nativeDiag, 1600)}</pre>
            </div>
          )}
          {verifyRes && (
            <div className="mt-2">
              <div className="font-semibold">Verificación de idToken</div>
              <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{jsonShort(verifyRes, 1600)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
