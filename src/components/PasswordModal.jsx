"use client";

import { useState } from 'react';

/**
 * Modal seguro para solicitar contraseña
 * Reemplaza el uso inseguro de prompt()
 */
export default function PasswordModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  email = '',
  title = 'Confirma tu contraseña',
  placeholder = 'Contraseña'
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    onConfirm(password);
    setPassword(''); // Limpiar después de enviar
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            {email && (
              <p className="text-sm text-gray-600">
                Usuario: <span className="font-semibold text-[#41e0b3]">{email}</span>
              </p>
            )}
          </div>

          {/* Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={placeholder}
                autoFocus
                autoComplete="current-password"
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  error ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-[#41e0b3] focus:border-transparent`}
              />
              
              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#41e0b3] text-white font-bold py-3 rounded-lg hover:bg-[#2bbd8c] transition focus:outline-none focus:ring-2 focus:ring-[#41e0b3] focus:ring-offset-2"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
