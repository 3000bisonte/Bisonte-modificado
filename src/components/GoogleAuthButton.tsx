'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

/**
 * Google Auth Button Component
 * Uses NextAuth Google provider for web, Firebase for Capacitor mobile
 * Firebase imports only loaded in mobile environment to avoid build issues
 */
export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if we're in Capacitor environment
    setIsCapacitor(typeof window !== 'undefined' && !!(window as any).Capacitor);
  }, []);

  const handleMobileSignIn = async () => {
    try {
      console.log('GoogleAuthButton: Mobile environment detected, but using NextAuth for compatibility...');
      
      // Por ahora, usar NextAuth incluso en móvil para evitar problemas de build
      // TODO: Implementar Firebase nativo cuando resolvamos las dependencias de build
      const result = await signIn('google', { callbackUrl: '/home' });
      console.log('GoogleAuthButton: NextAuth sign-in initiated:', result);
    } catch (error) {
      console.error('GoogleAuthButton: Mobile sign-in error:', error);
      throw error;
    }
  };

  const handleWebSignIn = async () => {
    console.log('GoogleAuthButton: Starting NextAuth web sign-in...');
    const result = await signIn('google', { callbackUrl: '/home' });
    console.log('GoogleAuthButton: NextAuth sign-in initiated:', result);
  };

  const handleSignIn = async () => {
    console.log('GoogleAuthButton: Starting sign-in process...', { isCapacitor });
    setIsLoading(true);
    
    try {
      if (isCapacitor) {
        await handleMobileSignIn();
      } else {
        await handleWebSignIn();
      }
    } catch (error) {
      console.error('GoogleAuthButton: Error:', error);
      alert('Error al iniciar sesión: ' + (error?.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button 
        disabled 
        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium py-3 px-4 rounded-xl opacity-70 cursor-not-allowed flex items-center justify-center gap-3 text-sm sm:text-base"
      >
        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Iniciando sesión...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium py-3 px-4 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm sm:text-base"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Continuar con Google</span>
    </button>
  );
}

export default GoogleAuthButton;