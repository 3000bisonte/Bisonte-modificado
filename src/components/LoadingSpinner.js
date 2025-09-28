// 🎨 Componente de Loading Spinner reutilizable
'use client';

import React from 'react';

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'blue', 
  text = null,
  className = '',
  fullScreen = false 
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const spinnerClass = `
    animate-spin rounded-full border-2 border-t-transparent
    ${sizeClasses[size]} ${colorClasses[color]} ${className}
  `.trim();

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClass}></div>
      {text && (
        <p className="mt-3 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}