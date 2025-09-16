"use client";
import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
const DiagnosticsWidget = dynamic(() => import("@/components/DiagnosticsWidget"), { ssr: false });
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AuthBridge() {
  const { status } = useSession();
  const search = useSearchParams();
  const target = useMemo(() => {
    const raw = search.get('to') || '/home';
    try {
      // Only allow same-origin internal paths that start with a single '/'
      if (!raw || typeof raw !== 'string') return '/home';
      if (!raw.startsWith('/')) return '/home';
      if (raw.startsWith('//')) return '/home';
      // avoid api/auth/login loops
      if (raw.startsWith('/api')) return '/home';
      if (raw.startsWith('/auth')) return '/home';
      if (raw.startsWith('/login')) return '/home';
      return raw;
    } catch {
      return '/home';
    }
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const notify = (payload: any) => {
      try {
        // React Native WebView
        (window as any).ReactNativeWebView?.postMessage(JSON.stringify(payload));
      } catch {}
      try {
        // iOS WKWebView bridge example (if implemented)
        (window as any).webkit?.messageHandlers?.bridge?.postMessage(payload);
      } catch {}
      try {
        // Fallback to parent frame (if embedded)
        window.parent?.postMessage(payload, '*');
      } catch {}
    };

    const finalize = () => {
      notify({ type: 'auth', status: 'success', target });
      window.location.replace(target);
    };

  const check = async (attempt = 0) => {
      if (cancelled) return;
      if (status === 'loading') {
        // poll a few times in case the session hydrates slowly in webview
        if (attempt < 40) {
          setTimeout(() => check(attempt + 1), 200);
        } else {
          // after retries, go to root
          window.location.replace('/');
        }
        return;
      }
      if (status === 'authenticated') return finalize();
      if (status === 'unauthenticated') {
        window.location.replace('/');
      }
    };

    check();
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
