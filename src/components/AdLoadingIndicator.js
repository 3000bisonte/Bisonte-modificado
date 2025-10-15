"use client";

/**
 * Componente de indicador de carga de anuncios con timeout y barra de progreso
 * Muestra el estado de carga y permite al usuario continuar si tarda demasiado
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
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 transform transition-all">
        {/* Icono animado */}
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
              // Spinner normal
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
            "Esto puede tardar unos segundos..."
          )}
        </p>

        {/* Barra de progreso - Solo si no hay timeout */}
        {!hasTimeout && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-[#41e0b3] via-[#35d4a4] to-[#2bbd8c] transition-all duration-500 ease-out relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        )}

        {/* Indicador de porcentaje */}
        {!hasTimeout && progress > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            {Math.round(progress)}% completado
          </p>
        )}

        {/* Botones de acción cuando hay timeout */}
        {hasTimeout && currentAttempt >= maxAttempts && (
          <div className="flex flex-col gap-2 mt-6">
            {onRetry && (
              <button
                type="button"
                className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#35d4a4] hover:to-[#23a878] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                onClick={onRetry}
              >
                🔄 Reintentar cargar anuncio
              </button>
            )}
            {onContinueWithoutAd && (
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                onClick={onContinueWithoutAd}
              >
                Continuar sin descuento
              </button>
            )}
          </div>
        )}

        {/* Mensaje de espera cuando aún hay intentos */}
        {hasTimeout && currentAttempt < maxAttempts && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 Reintentando automáticamente...
            </p>
          </div>
        )}

        {/* Tips mientras espera */}
        {!hasTimeout && (
          <div className="mt-4 p-3 bg-gradient-to-r from-[#41e0b3]/10 to-[#2bbd8c]/10 rounded-lg border border-[#41e0b3]/20">
            <p className="text-xs text-gray-600">
              💡 <span className="font-semibold">¿Sabías?</span> Ver anuncios te da hasta{" "}
              <span className="font-bold text-[#2bbd8c]">$15,000 de descuento</span> en tu envío
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
