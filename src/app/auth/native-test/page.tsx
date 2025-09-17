"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { requestGoogleIdToken } from "@/lib/nativeBridge";
import { buildBridgeCallback } from "@/lib/ua";

export default function NativeTestPage() {
  const [log, setLog] = useState<string>("");

  const append = (m: string) => setLog((prev) => prev + (prev ? "\n" : "") + m);

  const run = async () => {
    append("Solicitando idToken al host...");
    const token = await requestGoogleIdToken(15000);
    if (!token) {
      append("No se recibió idToken. En WebView está deshabilitado el OAuth web. Verifica el plugin nativo.");
      return;
    }
    append(`idToken recibido (${token.length} chars). Iniciando sesión...`);
    const cb = new URL(buildBridgeCallback("/home"), window.location.origin);
    cb.searchParams.set("wv", "1");
    await signIn("credentials", { idToken: token, redirect: true, callbackUrl: cb.toString() });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Prueba Nativa WebView</h1>
      <button
        className="px-4 py-2 bg-teal-600 rounded hover:bg-teal-700"
        onClick={run}
      >
        Probar Sign-In Nativo
      </button>
      <pre className="mt-6 w-full max-w-2xl bg-black/40 p-4 rounded whitespace-pre-wrap">{log}</pre>
    </div>
  );
}
