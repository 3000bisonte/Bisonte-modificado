// 🌐 Pantalla de Loading Global
'use client';

import React from 'react';

import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

export default function GlobalLoadingScreen() {
  const { isGlobalLoading, loadingMessage } = useGlobalLoading();

  if (!isGlobalLoading) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      style={{ 
        pointerEvents: 'all',
        cursor: 'wait' 
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-fade-in">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner animado */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-[#41e0b3]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#41e0b3] rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-[#2bbd8c] rounded-full animate-spin-slow"></div>
          </div>

          {/* Mensaje */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-gray-800">
              Procesando...
            </h3>
            <p className="text-gray-600 text-sm">
              {loadingMessage}
            </p>
          </div>

          {/* Indicador de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] animate-progress"></div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Por favor, no cierres esta ventana
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-spin-slow {
          animation: spin-slow 1.5s linear infinite;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
