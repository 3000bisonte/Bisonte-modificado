"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

import type { BisonteAuthPlugin } from "@bisonte/capacitor-bisonte-auth/dist/esm/definitions";

type MaybeCapacitorWindow = Window & {
  Capacitor?: {
    Plugins?: {
      BisonteAuth?: BisonteAuthPlugin;
    };
  };
  BisonteAuth?: BisonteAuthPlugin;
};

async function tryNativeGoogleIdToken(_timeout = 12000): Promise<string> {
  try {
    const bridge = window as MaybeCapacitorWindow;
    const plugin = bridge.Capacitor?.Plugins?.BisonteAuth ?? bridge.BisonteAuth;

    if (!plugin || typeof plugin.googleSignInCCT !== "function") {
      throw new Error("Plugin nativo BisonteAuth no disponible");
    }

    const result = await plugin.googleSignInCCT();

    if (!result?.idToken) {
      throw new Error("No se recibió idToken del plugin nativo");
    }

    return result.idToken;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error en flujo nativo";
    throw new Error(message);
  }
}

export default function GoogleLoginButton({ callbackUrl = "/home" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    // Detecta WebView por heurística
    const ua = (navigator.userAgent || "").toLowerCase();
    const isWV = /\bwv\b|webview|; wv\)|gsa\//i.test(ua);
    try {
      if (isWV) {
        // Prioriza nativo en WebView
        const idToken = await tryNativeGoogleIdToken();
        await signIn("credentials", { idToken, callbackUrl });
      } else {
        // Usa provider web en navegador normal
        await signIn("google", { callbackUrl });
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
        onClick={() => {
          void handleClick();
        }}
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><g><path d="M44.5 20H24V28.5H35.9C34.5 33.1 30.7 36 25.9 36C19.8 36 14.7 30.9 14.7 24.8C14.7 18.7 19.8 13.6 25.9 13.6C28.7 13.6 31.2 14.6 33.1 16.3L38.1 11.3C34.7 8.3 30.6 6.5 25.9 6.5C15.7 6.5 7.1 15.1 7.1 25.3C7.1 35.5 15.7 44.1 25.9 44.1C36.1 44.1 44.7 35.5 44.7 25.3C44.7 23.7 44.6 22.3 44.5 20Z" fill="#4285F4"/><path d="M6.5 14.7L13.1 19.7C15.1 16.1 19.1 13.6 25.9 13.6C28.7 13.6 31.2 14.6 33.1 16.3L38.1 11.3C34.7 8.3 30.6 6.5 25.9 6.5C15.7 6.5 7.1 15.1 7.1 25.3C7.1 35.5 15.7 44.1 25.9 44.1C36.1 44.1 44.7 35.5 44.7 25.3C44.7 23.7 44.6 22.3 44.5 20H24V28.5H35.9C34.5 33.1 30.7 36 25.9 36C19.8 36 14.7 30.9 14.7 24.8C14.7 18.7 19.8 13.6 25.9 13.6C28.7 13.6 31.2 14.6 33.1 16.3L38.1 11.3C34.7 8.3 30.6 6.5 25.9 6.5C15.7 6.5 7.1 15.1 7.1 25.3C7.1 35.5 15.7 44.1 25.9 44.1C36.1 44.1 44.7 35.5 44.7 25.3C44.7 23.7 44.6 22.3 44.5 20Z" fill="#34A853"/><path d="M44.5 20H24V28.5H35.9C34.5 33.1 30.7 36 25.9 36C19.8 36 14.7 30.9 14.7 24.8C14.7 18.7 19.8 13.6 25.9 13.6C28.7 13.6 31.2 14.6 33.1 16.3L38.1 11.3C34.7 8.3 30.6 6.5 25.9 6.5C15.7 6.5 7.1 15.1 7.1 25.3C7.1 35.5 15.7 44.1 25.9 44.1C36.1 44.1 44.7 35.5 44.7 25.3C44.7 23.7 44.6 22.3 44.5 20Z" fill="#FBBC05"/><path d="M44.5 20H24V28.5H35.9C34.5 33.1 30.7 36 25.9 36C19.8 36 14.7 30.9 14.7 24.8C14.7 18.7 19.8 13.6 25.9 13.6C28.7 13.6 31.2 14.6 33.1 16.3L38.1 11.3C34.7 8.3 30.6 6.5 25.9 6.5C15.7 6.5 7.1 15.1 7.1 25.3C7.1 35.5 15.7 44.1 25.9 44.1C36.1 44.1 44.7 35.5 44.7 25.3C44.7 23.7 44.6 22.3 44.5 20Z" fill="#EA4335"/></g></svg>
        {loading ? "Ingresando..." : "Ingresar con Google"}
      </button>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
    </div>
  );
}
