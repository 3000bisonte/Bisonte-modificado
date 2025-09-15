export function isWebViewUA(ua: string): boolean {
  const u = ua.toLowerCase();
  // Common indicators: Android WebView (wv), generic webview, iOS WKWebView patterns
  return /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(u);
}

export function isWebViewRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if ((window as any).ReactNativeWebView) return true;
    if ((window as any).Capacitor) return true;
    if ((window as any).webkit && (window as any).webkit.messageHandlers) return true;
  } catch {}
  return isWebViewUA(navigator.userAgent);
}

export function buildBridgeCallback(to: string = '/home'): string {
  const target = to || '/home';
  return `/auth/bridge?to=${encodeURIComponent(target)}`;
}
