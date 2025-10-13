import React from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string | null;
}

/**
 * NotificationModal - Modal reutilizable para mostrar notificaciones con diseño elegante
 */
export default function NotificationModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  details 
}: NotificationModalProps) {
  if (!isOpen) {
    return null;
  }

  const typeConfig = {
    success: {
      bg: "bg-green-100",
      border: "border-green-500",
      icon: "text-green-600",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-500",
      icon: "text-red-600",
      iconPath: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    warning: {
      bg: "bg-amber-100",
      border: "border-amber-500",
      icon: "text-amber-600",
      iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      icon: "text-blue-600",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-8 max-w-md w-full mx-4 transform animate-scale-in">
        {/* Icon */}
        <div className={`w-20 h-20 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${config.border} shadow-lg`}>
          <svg className={`w-10 h-10 ${config.icon}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-700 text-center mb-4 text-base leading-relaxed">
          {message}
        </p>

        {/* Details (optional) */}
        {details && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-600 whitespace-pre-line font-mono">
              {details}
            </p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#2bbd8c] hover:to-[#41e0b3] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
