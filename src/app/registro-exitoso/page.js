"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegistroExitoso() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");

  /**
   * Navega a la pantalla de inicio
   */
  const handleComenzar = () => {
    router.push("/home");
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("bienvenidaMostrada"); // Esto fuerza mostrar la bienvenida
      // Leer el nombre del registro
      const nombreGuardado = localStorage.getItem("nombreRegistro") || "";
      setNombre(nombreGuardado);
    }, 500); // puedes ajustar el tiempo si lo deseas
  }, []);

  if (loading) {
    return null; // O un spinner de carga si lo prefieres
  }

  return (
    <div className="w-screen h-screen min-h-screen flex items-center justify-center bg-[#18191A]">
      <div className="bg-[#18191A] w-full max-w-md rounded-lg flex flex-col items-center justify-center py-10 px-4">
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-[#41e0b3] bg-opacity-30 p-4">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#41e0b3" />
                <polyline
                  points="30,55 45,70 70,40"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2 text-center">
          ¡Registro exitoso!
        </h2>
        {nombre && (
          <p className="text-[#41e0b3] text-lg font-semibold text-center mb-2">
            {nombre}
          </p>
        )}
        <p className="text-gray-200 text-center mb-2">
          Gracias por registrarte en Bisonte. Ya puedes cotizar tus envíos
        </p>

        <button
          onClick={handleComenzar}
          className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded mt-2 hover:bg-[#2bbd8c] transition"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}