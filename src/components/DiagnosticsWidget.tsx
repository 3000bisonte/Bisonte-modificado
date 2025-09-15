"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { isWebViewRuntime, buildBridgeCallback } from "@/lib/ua";

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
      const hasSW = !!navigator.serviceWorker;
      let cookieEnabled = false;
      try { document.cookie = `diag_widget=1; path=/`; cookieEnabled = document.cookie.includes('diag_widget=1'); } catch {}
      let ls=false, ss=false; try { localStorage.setItem('dw','1'); ls = localStorage.getItem('dw')==='1'; localStorage.removeItem('dw'); } catch {}
      try { sessionStorage.setItem('dw','1'); ss = sessionStorage.getItem('dw')==='1'; sessionStorage.removeItem('dw'); } catch {}
      setClient({
        userAgent: navigator.userAgent,
        isWebViewRuntime: isWebViewRuntime(),
        hasRNWebView, hasWKBridge, hasCapacitor,
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

  const signInBridge = async () => {
    const base = isWebViewRuntime() ? buildBridgeCallback('/home') : '/home';
    const url = new URL(base, window.location.origin);
    if (isWebViewRuntime()) url.searchParams.set('wv','1');
    await signIn('google', { callbackUrl: url.toString(), redirect: true });
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
            <button className="px-2 py-0.5 bg-blue-600 rounded" onClick={signInBridge}>Google Bridge</button>
            <a className="px-2 py-0.5 bg-gray-700 rounded" href="/diagnostic" target="_blank" rel="noreferrer">/diagnostic</a>
          </div>
        </div>
      </div>
    </div>
  );
}
