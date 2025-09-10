"use client";
import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";

export default function ProvidersDebugPage() {
  const [providers, setProviders] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProviders();
        setProviders(p);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <pre style={{whiteSpace: 'pre-wrap', color: '#ddd', background: '#111', padding: 16, borderRadius: 8}}>
      {error ? `Error: ${error}` : JSON.stringify(providers, null, 2)}
    </pre>
  );
}
