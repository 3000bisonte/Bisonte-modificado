"use client";

/**
 * COMPONENTE RECREADO COMPLETAMENTE
 * Modal de carga de anuncios - Versión simplificada y funcional
 */
export default function AdLoadingIndicator({
  isLoading = false,
  hasTimeout = false,
  progress = 0,
  currentAttempt = 0,
  maxAttempts = 2,
  onContinueWithoutAd = null,
  onRetry = null,
}) {
  // Si no está cargando, no mostrar nada
  if (!isLoading) return null;

  // Función para cerrar el modal
  const handleClose = () => {
    console.log("🚫 Cerrando modal de anuncio");
    if (onContinueWithoutAd) {
      onContinueWithoutAd();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        // Cerrar si se hace clic en el fondo
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 transform transition-all relative">
        
        {/* X GIGANTE ROJA EN LA ESQUINA SUPERIOR DERECHA */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-3 -right-3 w-14 h-14 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-all duration-200 z-50 shadow-2xl border-4 border-white text-2xl font-bold cursor-pointer"
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>
        
        {/* Icono animado de video */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto">
            {hasTimeout ? (
              // Icono de reloj cuando hay timeout
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ) : (
              // Spinner con icono de video
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-[#41e0b3] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#41e0b3]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold mb-2">
          {hasTimeout ? (
            <span className="text-orange-600">⏰ Anuncio tardando...</span>
          ) : (
            <span className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] bg-clip-text text-transparent">
              Cargando anuncio
            </span>
          )}
        </h3>

        {/* Mensaje de estado */}
        <p className="text-gray-600 text-sm mb-4">
          {hasTimeout ? (
            <>
              Los anuncios están tardando más de lo esperado.
              <br />
              <span className="font-semibold text-orange-600">
                Intento {currentAttempt} de {maxAttempts}
              </span>
            </>
          ) : (
            'Esto puede tardar unos segundos...'
          )}
        </p>

        {/* BOTÓN GRANDE PARA CERRAR - SIEMPRE VISIBLE */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white py-4 px-6 rounded-lg text-base font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg mb-4 cursor-pointer"
        >
          ✕ CERRAR Y CONTINUAR SIN DESCUENTO
        </button>

        {/* Barra de progreso */}
        {!hasTimeout && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-[#41e0b3] via-[#35d4a4] to-[#2bbd8c] transition-all duration-500 ease-out relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        )}

        {/* Porcentaje */}
        {!hasTimeout && progress > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            {Math.round(progress)}% completado
          </p>
        )}

        {/* Botones cuando hay timeout y se agotaron intentos */}
        {hasTimeout && currentAttempt >= maxAttempts && (
          <div className="flex flex-col gap-2 mt-6">
            {onRetry && (
              <button
                type="button"
                className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#35d4a4] hover:to-[#23a878] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg cursor-pointer"
                onClick={onRetry}
              >
                🔄 Reintentar cargar anuncio
              </button>
            )}
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg cursor-pointer"
              onClick={handleClose}
            >
              Continuar sin descuento
            </button>
          </div>
        )}

        {/* Mensaje de reintento automático */}
        {hasTimeout && currentAttempt < maxAttempts && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 Reintentando automáticamente...
            </p>
          </div>
        )}

        {/* MENSAJE PERSONALIZADO CON TU TEXTO */}
        {!hasTimeout && (
          <div className="mt-2">
            <div className="p-3 bg-gradient-to-r from-[#41e0b3]/10 to-[#2bbd8c]/10 rounded-lg border border-[#41e0b3]/20">
              <p className="text-xs text-gray-600">
                💡 <span className="font-semibold">¿Sabías?</span> Recibirás un descuento en tu envío al ver los anuncios
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
