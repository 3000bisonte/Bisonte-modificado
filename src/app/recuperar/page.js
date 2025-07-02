"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Recuperar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    try {
      // Llama a tu API real de recuperación
      const res = await fetch("/api/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.usuarioExiste) {
          setMsg("Si el correo está registrado, recibirás un mensaje para recuperar tu contraseña.");
          // Redirige automáticamente
          router.push("/recuperar/validar-token");
        } else {
          setError("No encontramos tu usuario.");
        }
      } else {
        setError("Ocurrió un error. Intenta nuevamente.");
      }
    } catch (err) {
      setError("Ocurrió un error de red. Intenta más tarde.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 px-4">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl border-2 border-[#41e0b3]/20 p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M12 17v.01M9 21h6a2 2 0 002-2v-7a2 2 0 00-2-2h-1V7a3 3 0 10-6 0v3H7a2 2 0 00-2 2v7a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-2 text-[#18191A] text-center">Recuperar contraseña</h2>
        <p className="text-[#41e0b3] text-center mb-6 text-sm">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
        <form onSubmit={handleSend} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="rounded-xl px-4 py-3 bg-white border border-[#41e0b3]/30 focus:border-[#41e0b3] text-gray-800 focus:outline-none text-base shadow"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold py-3 rounded-xl shadow-lg hover:from-[#2bbd8c] hover:to-[#41e0b3] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        {msg && <p className="mt-4 text-center text-sm text-[#41e0b3]">{msg}</p>}
        <div className="w-full flex justify-center mt-6">
          <a
            href="/LoginForm"
            className="text-[#41e0b3] text-sm font-semibold hover:underline transition"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}