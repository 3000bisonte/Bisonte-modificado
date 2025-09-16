"use client";

import { isWebViewRuntime, isCapacitorRuntime } from "./ua";

/**
 * Request a Google ID Token from the host app when running inside a WebView.
 * Protocols supported:
 * - ReactNativeWebView: window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_ID_TOKEN' }))
 *   and host should call window.__BisonteProvideIdToken(token) or postMessage back with { type:'ID_TOKEN', idToken }
 * - iOS WKWebView (optional): window.webkit.messageHandlers.bridge.postMessage({ type: 'REQUEST_ID_TOKEN' })
 * - Generic parent frame postMessage as a fallback
 */
export async function requestGoogleIdToken(timeoutMs = 12000) {
  if (typeof window === "undefined") return null;
  if (!isWebViewRuntime()) return null;

  // Capacitor: intentamos usar plugins conocidos antes del postMessage
  try {
    if (isCapacitorRuntime()) {
      const w = window;
      // Capacitor Firebase Authentication plugin
      const CFA = (w).Capacitor?.Plugins?.FirebaseAuthentication || (w).FirebaseAuthentication;
      if (CFA && typeof CFA.signInWithGoogle === 'function') {
        const res = await CFA.signInWithGoogle();
        const t = res?.credential?.idToken || res?.idToken || res?.accessToken;
        if (t && typeof t === 'string' && t.split('.').length === 3) return t;
      }
      // Capacitor Google Auth plugin (@codetrix-studio/capacitor-google-auth o similar)
      const CGA = (w).Capacitor?.Plugins?.GoogleAuth || (w).GoogleAuth;
      if (CGA && typeof CGA.signIn === 'function') {
        const res = await CGA.signIn();
        const t = res?.authentication?.idToken || res?.idToken;
        if (t && typeof t === 'string' && t.split('.').length === 3) return t;
      }
    }
  } catch {}

  return await new Promise((resolve) => {
    let settled = false;
    let timer;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      try { delete window.__BisonteProvideIdToken; } catch {}
      if (timer) clearTimeout(timer);
    };

    const finish = (token) => {
      if (settled) return;
      cleanup();
      if (typeof token === "string" && token.length > 100) {
        resolve(token);
      } else {
        resolve(null);
      }
    };

    const onMessage = (event) => {
      try {
        const data = event?.data;
        if (!data) return;
        // Accept either raw string token or JSON with idToken
        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data);
            if (parsed && (parsed.idToken || parsed.token) && (parsed.type === "ID_TOKEN" || parsed.type === "idToken" || !parsed.type)) {
              return finish(parsed.idToken || parsed.token);
            }
            // If it's a bare string token
            if (data.split(".").length === 3) {
              return finish(data);
            }
          } catch {
            // Bare string not JSON
            if (data.split(".").length === 3) return finish(data);
          }
        } else if (typeof data === "object") {
          const maybe = data?.idToken || data?.token;
          if (maybe && (data.type === "ID_TOKEN" || data.type === "idToken" || !data.type)) {
            return finish(maybe);
          }
        }
      } catch {}
    };

    window.addEventListener("message", onMessage);
    // Expose a direct function the host can call
    try { window.__BisonteProvideIdToken = (t) => finish(t); } catch {}

    // Proactively request the token from host containers
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "REQUEST_ID_TOKEN" })); } catch {}
    try { window.webkit?.messageHandlers?.bridge?.postMessage({ type: "REQUEST_ID_TOKEN" }); } catch {}
    try { window.parent?.postMessage({ type: "REQUEST_ID_TOKEN" }, "*"); } catch {}

    timer = setTimeout(() => finish(null), timeoutMs);
  });
}
