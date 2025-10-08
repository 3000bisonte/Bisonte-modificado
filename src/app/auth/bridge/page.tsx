"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";

const DiagnosticsWidget = dynamic(() => import("@/components/DiagnosticsWidget"), { ssr: false });

export default function AuthBridge() {
  const { status } = useSession();
  const search = useSearchParams();
  const target = useMemo(() => {
    const raw = search.get('to') || '/home';
    try {
      // Only allow same-origin internal paths that start with a single '/'
      if (!raw || typeof raw !== 'string') {return '/home';}
      if (!raw.startsWith('/')) {return '/home';}
      if (raw.startsWith('//')) {return '/home';}
      // avoid api/auth/login loops
      if (raw.startsWith('/api')) {return '/home';}
      if (raw.startsWith('/auth')) {return '/home';}
      if (raw.startsWith('/login')) {return '/home';}
      return raw;
    } catch {
      return '/home';
    }
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const notify = (payload: unknown) => {
      try {
        // React Native WebView
        const webView = (window as Window & { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView;
        webView?.postMessage(JSON.stringify(payload));
      } catch (rnError) {
        // Silently ignore RN WebView errors
        console.error('RN WebView error:', rnError);
      }
      try {
        // iOS WKWebView bridge example (if implemented)
        const webkit = (window as Window & { webkit?: { messageHandlers?: { bridge?: { postMessage: (msg: unknown) => void } } } }).webkit;
        webkit?.messageHandlers?.bridge?.postMessage(payload);
      } catch (wkError) {
        // Silently ignore WKWebView errors
        console.error('WKWebView error:', wkError);
      }
      try {
        // Fallback to parent frame (if embedded)
        window.parent?.postMessage(payload, '*');
      } catch (postMessageError) {
        // Silently ignore postMessage errors
        console.error('postMessage error:', postMessageError);
      }
    };

    const finalize = async () => {
      notify({ type: 'auth', status: 'success', target });
      await Promise.resolve(); // Make async meaningful
      window.location.replace(target);
    };

  const check = async (attempt = 0): Promise<void> => {
      if (cancelled) {return;}
      if (status === 'loading') {
        // poll a few times in case the session hydrates slowly in webview
        if (attempt < 40) {
          setTimeout(() => {
            void check(attempt + 1);
          }, 200);
        } else {
          // after retries, go to root
          window.location.replace('/');
        }
        return;
      }
      if (status === 'authenticated') {
        await finalize();
        return;
      }
      if (status === 'unauthenticated') {
        window.location.replace('/');
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [status, target]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Finalizando autenticación…</p>
        </div>
      </div>
      <DiagnosticsWidget />
    </>
  );
}
