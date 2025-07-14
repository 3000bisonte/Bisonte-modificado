"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function RegistroExitoso() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleComenzar = async () => {
    if (!email || !password) {
      console.log("❌ No hay credenciales guardadas");
      router.push("/");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    
    try {
      console.log("🔄 Intentando login automático con:", email);
      
      // ✅ USAR SIGNIN CON CONFIGURACIÓN ESPECÍFICA
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password: password,
        callbackUrl: "/home"
      });
      
      console.log("📡 Resultado login:", res);
      
      if (res?.ok && !res?.error) {
        console.log("✅ Login exitoso");
        
        // ✅ LIMPIAR DATOS DEL LOCALSTORAGE
        localStorage.removeItem("nombreRegistro");
        localStorage.removeItem("emailRegistro");
        localStorage.removeItem("passwordRegistro");
        localStorage.removeItem("bienvenidaMostrada");
        
        // ✅ NAVEGAR A HOME CON DELAY PARA ASEGURAR SESIÓN
        setTimeout(() => {
          router.push("/home");
          router.refresh();
        }, 1000);
        
      } else {
        console.log("❌ Error en login:", res?.error);
        setError("No se pudo iniciar sesión automáticamente. Serás redirigido al login.");
        
        // ✅ REDIRECT A LOGIN DESPUÉS DE 3 SEGUNDOS
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Error en handleComenzar:", error);
      setError("Error de conexión. Serás redirigido al login.");
      
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }
    
    setIsLoggingIn(false);
  };

  const handleIrALogin = () => {
    // ✅ LIMPIAR DATOS Y IR A LOGIN
    localStorage.removeItem("nombreRegistro");
    localStorage.removeItem("emailRegistro");
    localStorage.removeItem("passwordRegistro");
    router.push("/");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      
      // ✅ LEER DATOS DEL REGISTRO
      const nombreGuardado = localStorage.getItem("nombreRegistro") || "";
      const emailGuardado = localStorage.getItem("emailRegistro") || "";
      const passwordGuardado = localStorage.getItem("passwordRegistro") || "";
      
      console.log("📋 Datos del registro:", { 
        nombre: nombreGuardado, 
        email: emailGuardado, 
        tienePassword: !!passwordGuardado 
      });
      
      setNombre(nombreGuardado);
      setEmail(emailGuardado);
      setPassword(passwordGuardado);
      
      // ✅ SI NO HAY DATOS, IR A LOGIN
      if (!emailGuardado || !passwordGuardado) {
        console.log("⚠️ No hay datos de registro, redirigiendo a login");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }, 1000);

    return () => clearTimeout(timer);
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
        
        <p className="text-gray-200 text-center mb-4">
          Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a cotizar tus envíos
        </p>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={handleComenzar}
            className="w-full bg-[#41e0b3] text-white font-bold py-3 rounded hover:bg-[#2bbd8c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoggingIn || !email || !password}
          >
            {isLoggingIn ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </span>
            ) : (
              "Comenzar"
            )}
          </button>
          
          <button
            onClick={handleIrALogin}
            className="w-full bg-transparent border border-[#41e0b3] text-[#41e0b3] font-bold py-3 rounded hover:bg-[#41e0b3] hover:text-white transition"
            disabled={isLoggingIn}
          >
            Ir a inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}