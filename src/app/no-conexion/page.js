"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NoConexion() {
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      router.back();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verificar el estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    setRetrying(true);
    // Simular intento de reconexión
    setTimeout(() => {
      if (navigator.onLine) {
        router.back();
      } else {
        setRetrying(false);
      }
    }, 2000);
  };

  if (isOnline) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-[#18191A] px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fade-in">
          {/* Barra superior */}
          <div className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] h-2"></div>
          
          {/* Contenido principal */}
          <div className="p-8">
            {/* Ilustración animada */}
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-[#41e0b3]/10 rounded-full animate-ping-slow"></div>
                <div className="absolute inset-4 bg-[#41e0b3]/20 rounded-full animate-ping-slow animation-delay-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className="w-20 h-20 text-[#41e0b3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
                      className="text-red-500"
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Texto */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-3">Sin conexión a internet</h1>
              <p className="text-gray-400 mb-8">
                No se pudo conectar con los servidores de Bisonte. Por favor verifica tu conexión a internet e inténtalo nuevamente.
              </p>
              
              {/* Botón para reintentar */}
              <button 
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-3 px-4 bg-[#41e0b3] hover:bg-[#2bbd8c] text-gray-900 font-medium rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
              >
                {retrying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path className="opacity-25" d="M4 4h16v16H4z" />
                      <path className="opacity-75" d="M4 4h16v16H4z" />
                    </svg>
                    Reconectando...
                  </>
                ) : (
                  "Reintentar conexión"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}