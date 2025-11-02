"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function RegistroExitoso() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const handleIrALogin = () => {
    console.log("🔄 [RegistroExitoso] Usuario eligió ir a login");
    // Limpiar datos temporales
    localStorage.removeItem("nombreRegistro");
    localStorage.removeItem("emailRegistro");
    router.push("/");
  };

  const handleIrAHome = async () => {
    console.log("🔄 [RegistroExitoso] Usuario eligió iniciar sesión e ir a home");
    
    // Pedir la contraseña al usuario
    const password = prompt(`Por favor, ingresa tu contraseña para iniciar sesión:\n\nCorreo: ${email}`);
    
    if (!password) {
      console.log("❌ Usuario canceló el inicio de sesión");
      return;
    }

    setLoading(true);
    
    try {
      console.log("🔐 Intentando login con:", email);
      
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password: password,
      });
      
      console.log("📡 Resultado login:", res);
      
      if (res?.ok && !res?.error) {
        console.log("✅ Login exitoso, redirigiendo a /home");
        
        // Limpiar datos temporales
        localStorage.removeItem("nombreRegistro");
        localStorage.removeItem("emailRegistro");
        
        // Redirigir a home
        router.push("/home");
        router.refresh();
      } else {
        console.error("❌ Error en login:", res?.error);
        alert("Error al iniciar sesión. Por favor, verifica tu contraseña e intenta nuevamente.");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error en handleIrAHome:", error);
      alert("Error de conexión. Por favor, intenta nuevamente.");
      setLoading(false);
    }
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

    return () => {
      clearTimeout(loadingTimer);
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
          Usuario registrado: <span className="text-[#41e0b3] font-semibold">{email}</span>
        </p>

        <div className="bg-[#41e0b3] bg-opacity-10 border border-[#41e0b3] rounded-lg px-4 py-3 mb-6">
          <p className="text-center text-gray-200 text-sm">
            ¿Qué deseas hacer ahora?
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleIrAHome}
            className="w-full bg-[#41e0b3] text-white font-bold py-3 rounded hover:bg-[#2bbd8c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión e ir al Home"
            )}
          </button>
          
          <button
            onClick={handleIrALogin}
            className="w-full bg-transparent border-2 border-[#41e0b3] text-[#41e0b3] font-bold py-3 rounded hover:bg-[#41e0b3] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Ir a página de inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}