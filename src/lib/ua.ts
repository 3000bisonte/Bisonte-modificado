export interface WebViewBridgeWindow extends Window {
  ReactNativeWebView?: {
    postMessage?: (message: string) => void;
  } | null;
  Capacitor?: {
    Plugins?: Record<string, unknown>;
  } | null;
  capacitor?: unknown;
  CapacitorNative?: unknown;
  webkit?: {
    messageHandlers?: Record<string, {
      postMessage?: (payload: Record<string, unknown>) => void;
    } | undefined>;
  };
}

export function isWebViewUA(ua: string): boolean {
  const normalized = ua.toLowerCase();
  // Common indicators: Android WebView (wv), generic webview, iOS WKWebView patterns
  return /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(normalized);
}

export function isWebViewRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const extendedWindow = window as WebViewBridgeWindow;

  if (extendedWindow.ReactNativeWebView) {
    return true;
  }

  if (extendedWindow.Capacitor) {
    return true;
  }

  if (extendedWindow.webkit?.messageHandlers) {
    return true;
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent ?? '' : '';
  return isWebViewUA(userAgent);
}

export function isCapacitorRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const extendedWindow = window as WebViewBridgeWindow;
  return Boolean(extendedWindow.Capacitor || extendedWindow.capacitor || extendedWindow.CapacitorNative);
}

export function buildBridgeCallback(to: string = '/home'): string {
  const target = typeof to === 'string' && to.trim() ? to.trim() : '/home';
  return `/auth/bridge?to=${encodeURIComponent(target)}`;
}
