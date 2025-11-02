"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegistroExitoso() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(5);

  const handleIrALogin = () => {
    console.log("🔄 [RegistroExitoso] Navegando a login");
    // Limpiar datos temporales
    localStorage.removeItem("nombreRegistro");
    localStorage.removeItem("emailRegistro");
    router.push("/");
  };

  useEffect(() => {
    // Mostrar página de éxito por 1 segundo
    const loadingTimer = setTimeout(() => {
      setLoading(false);
      
      // Leer datos del registro
      const nombreGuardado = localStorage.getItem("nombreRegistro") || "";
      const emailGuardado = localStorage.getItem("emailRegistro") || "";
      
      console.log("📋 [RegistroExitoso] Datos del registro:", { 
        nombre: nombreGuardado, 
        email: emailGuardado
      });
      
      setNombre(nombreGuardado);
      setEmail(emailGuardado);
      
      // Si no hay email, redirigir inmediatamente
      if (!emailGuardado) {
        console.log("⚠️ [RegistroExitoso] No hay datos de registro, redirigiendo a login");
        router.push("/");
      }
    }, 1000);

    // Countdown automático para redirigir a login
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          console.log("⏱️ [RegistroExitoso] Countdown completado, redirigiendo a login");
          handleIrALogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(countdownInterval);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#18191A]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#41e0b3]"></div>
      </div>
    );
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
            ¡Bienvenido {nombre}!
          </p>
        )}
        
        <p className="text-gray-200 text-center mb-2">
          Tu cuenta ha sido creada exitosamente.
        </p>
        
        <p className="text-gray-400 text-center text-sm mb-6">
          Ya puedes iniciar sesión con tu correo: <span className="text-[#41e0b3] font-semibold">{email}</span>
        </p>

        <div className="bg-[#41e0b3] bg-opacity-10 border border-[#41e0b3] rounded-lg px-4 py-3 mb-6">
          <p className="text-center text-gray-200 text-sm">
            Serás redirigido al inicio de sesión en{" "}
            <span className="font-bold text-[#41e0b3] text-lg">{countdown}</span>{" "}
            segundo{countdown !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="w-full">
          <button
            onClick={handleIrALogin}
            className="w-full bg-[#41e0b3] text-white font-bold py-3 rounded hover:bg-[#2bbd8c] transition"
          >
            Ir a inicio de sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}