"use client";
import type { BuiltInProviderType } from "next-auth/providers/index";
import { getProviders, type ClientSafeProvider, type LiteralUnion } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ProvidersDebugPage() {
  const [providers, setProviders] = useState<Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const p = await getProviders();
        setProviders(p);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <pre style={{whiteSpace: 'pre-wrap', color: '#ddd', background: '#111', padding: 16, borderRadius: 8}}>
      {error ? `Error: ${error}` : JSON.stringify(providers, null, 2)}
    </pre>
  );
}
