'use client';
import { createContext, useContext } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const authSession = useAuthSession();

  // Mantener compatibilidad con código existente
  const contextValue = {
    ...authSession,
    // Aliases para compatibilidad
    user: authSession.user,
    isLoading: authSession.loading,
    isAuthenticated: authSession.isAuthenticated,
    login: authSession.signIn,
    logout: authSession.signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}