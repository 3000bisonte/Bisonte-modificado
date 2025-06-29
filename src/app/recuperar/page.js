"use client";
import { useState } from "react";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    // Aquí deberías llamar a tu API para enviar el correo de recuperación
    // Ejemplo:
    // await fetch("/api/recuperar", { method: "POST", body: JSON.stringify({ email }) });
    setTimeout(() => {
      setMsg("Si el correo está registrado, recibirás un mensaje para recuperar tu contraseña.");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form onSubmit={handleSend} className="bg-white p-8 rounded-lg shadow max-w-xs w-full">
        <h2 className="text-xl font-bold mb-4 text-center text-[#41e0b3]">Recuperar contraseña</h2>
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full mb-4 px-3 py-2 rounded border"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded hover:bg-[#2bbd8c] transition"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
        {msg && <p className="mt-4 text-center text-sm text-gray-700">{msg}</p>}
      </form>
    </div>
  );
}