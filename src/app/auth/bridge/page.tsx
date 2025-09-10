"use client";
import { useEffect } from "react";

export default function AuthBridge() {
  useEffect(() => {
    try {
      // Notify React Native / Capacitor WebView if available
      (window as any).ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "auth", status: "success" })
      );
    } catch {}

    const target = "/home";
    // Replace history to avoid showing intermediate route
    window.location.replace(target);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Finalizando autenticación…</p>
      </div>
    </div>
  );
}
