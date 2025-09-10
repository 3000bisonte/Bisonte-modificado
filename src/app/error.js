"use client";
export default function GlobalError({ error, reset }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Algo salió mal</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error?.message || '')}</pre>
      <button onClick={() => reset()}>Reintentar</button>
    </div>
  );
}
