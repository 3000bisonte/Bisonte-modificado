"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ValidarToken() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Expresión regular para contraseña segura
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    // Validación de token (debe ser 6 dígitos)
    if (!/^\d{6}$/.test(token)) {
      setError("El código debe tener 6 dígitos.");
      setLoading(false);
      return;
    }

    // Validación de contraseña segura
    if (!passwordRegex.test(newPassword)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."
      );
      setLoading(false);
      return;
    }

    // Envía la solicitud al backend
    const res = await fetch("/api/recuperar/validar-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await res.json();
    if (data.ok) {
      router.push("/recuperar/exito");
      return;
    } else if (data.error === "Usuario no encontrado") {
      setError("Ese usuario no está registrado. Usa el mismo correo con el que te registraste.");
    } else {
      setError(data.error || "Error al actualizar la contraseña.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 px-4">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl border-2 border-[#41e0b3]/20 p-8 flex flex-col items-center">
        <h2 className="text-2xl font-extrabold mb-2 text-[#18191A] text-center">Restablecer contraseña</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="rounded-xl px-4 py-3 bg-white border border-[#41e0b3]/30 focus:border-[#41e0b3] text-gray-800 focus:outline-none text-base shadow"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Código recibido"
            className="rounded-xl px-4 py-3 bg-white border border-[#41e0b3]/30 focus:border-[#41e0b3] text-gray-800 focus:outline-none text-base shadow"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            maxLength={6}
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            className="rounded-xl px-4 py-3 bg-white border border-[#41e0b3]/30 focus:border-[#41e0b3] text-gray-800 focus:outline-none text-base shadow"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold py-3 rounded-xl shadow-lg hover:from-[#2bbd8c] hover:to-[#41e0b3] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        {msg && (
          <div className="mt-4 text-center">
            <p className="text-[#41e0b3] text-sm">{msg}</p>
          </div>
        )}
        <div className="w-full flex justify-center mt-6">
          <a
            href="/"
            className="text-[#41e0b3] text-sm font-semibold hover:underline transition"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}