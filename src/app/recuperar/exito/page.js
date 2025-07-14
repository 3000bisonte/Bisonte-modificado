"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExitoRecuperacion() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToLogin = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Animación de éxito */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            {/* Círculo de fondo con animación */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-full shadow-xl animate-pulse"></div>
            
            {/* Ícono de checkmark con animación */}
            <div className="relative z-10 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Efecto de ondas */}
            <div className="absolute inset-0 rounded-full border-4 border-[#41e0b3] animate-ping opacity-30"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            ¡Contraseña Actualizada!
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg text-slate-600 leading-relaxed">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-6 h-6 text-[#41e0b3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-700 font-medium">Cambio confirmado</span>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                Ahora puedes iniciar sesión con tu nueva contraseña en 
                <span className="font-semibold text-[#41e0b3]"> Bisonte Logística</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-4">
          <button
            onClick={handleGoToLogin}
            className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-[#2bbd8c] hover:to-[#41e0b3] focus:outline-none focus:ring-2 focus:ring-[#41e0b3] focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Iniciar Sesión Ahora</span>
            </span>
          </button>
          
          {/* Contador automático */}
          <div className="bg-slate-100 rounded-lg p-4 text-center">
            <p className="text-slate-600 text-sm">
              Serás redirigido automáticamente en{" "}
              <span className="font-bold text-[#41e0b3] text-lg">{countdown}</span>{" "}
              segundo{countdown !== 1 ? 's' : ''}
            </p>
            
            {/* Barra de progreso */}
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div 
                className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-blue-800 font-medium text-sm mb-1">
                  Consejos de seguridad:
                </p>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>• No compartas tu contraseña con nadie</li>
                  <li>• Usa contraseñas diferentes para cada servicio</li>
                  <li>• Cambia tu contraseña periódicamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Enlaces adicionales */}
        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => router.push("/recuperar")}
            className="inline-flex items-center text-slate-500 hover:text-[#41e0b3] text-sm font-medium transition-colors duration-200 group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ¿Necesitas cambiar otra contraseña?
          </button>
          
          <div className="text-slate-400 text-xs">
            <p>© 2024 Bisonte Logística. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}