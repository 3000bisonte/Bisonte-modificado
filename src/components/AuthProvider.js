// 🛡️ Contexto de autenticación robusto con manejo de seguridad avanzado
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Tipos de eventos de seguridad
const SecurityEvents = {
  SESSION_EXPIRED: 'session_expired',
  CONCURRENT_SESSION: 'concurrent_session',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  FORCED_LOGOUT: 'forced_logout'
};

// Estados de autenticación
const AuthStates = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Contexto de autenticación
const AuthContext = createContext({});

/**
 * 🔒 Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  
  return context;
}

/**
 * 🛡️ Provider de autenticación con seguridad robusta
 */
export function AuthProvider({ children }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // Estados locales
  const [authState, setAuthState] = useState(AuthStates.LOADING);
  const [user, setUser] = useState(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Referencias para cleanup
  const sessionCheckInterval = useRef(null);
  const activityTimeout = useRef(null);
  
  // Configuración de seguridad
  const SECURITY_CONFIG = {
    sessionCheckInterval: 60000, // 1 minuto
    inactivityTimeout: 30 * 60 * 1000, // 30 minutos
    maxConcurrentSessions: 3,
    sessionRefreshThreshold: 5 * 60 * 1000, // 5 minutos antes de expirar
  };

  /**
   * 🔍 Verificar integridad de la sesión
   */
  const verifySessionIntegrity = useCallback(async () => {
    try {
      if (!session?.user?.id) return false;

      const response = await fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.user.id,
          lastActivity: lastActivity
        })
      });

      if (!response.ok) {
        console.warn('[Auth] Session verification failed:', response.status);
        return false;
      }

      const data = await response.json();
      return data.valid;

    } catch (error) {
      console.error('[Auth] Session verification error:', error);
      return false;
    }
  }, [session, lastActivity]);

  /**
   * 🚨 Manejar logout por seguridad
   */
  const handleSecurityLogout = useCallback(async (reason = 'security_policy') => {
    try {
      console.warn(`[Auth] Security logout triggered: ${reason}`);
      
      // Limpiar storage local
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      
      // Mostrar notificación al usuario
      const messages = {
        session_expired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        concurrent_session: 'Se detectó una sesión activa en otro dispositivo.',
        suspicious_activity: 'Se detectó actividad sospechosa. Se cerró la sesión por seguridad.',
        forced_logout: 'Sesión cerrada por el administrador.',
        inactivity: 'Sesión cerrada por inactividad.',
        default: 'Sesión cerrada por motivos de seguridad.'
      };
      
      toast.error(messages[reason] || messages.default, {
        duration: 6000,
        icon: '🔒'
      });
      
      // Cerrar sesión
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      });
      
      // Redirigir después de un delay
      setTimeout(() => {
        router.push('/login?reason=' + reason);
      }, 1000);

    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Forzar redirección en caso de error
      window.location.href = '/login?reason=error';
    }
  }, [router]);

  /**
   * 📊 Actualizar actividad del usuario
   */
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    
    // Reiniciar timeout de inactividad
    if (activityTimeout.current) {
      clearTimeout(activityTimeout.current);
    }
    
    activityTimeout.current = setTimeout(() => {
      handleSecurityLogout('inactivity');
    }, SECURITY_CONFIG.inactivityTimeout);
    
  }, [handleSecurityLogout, SECURITY_CONFIG.inactivityTimeout]);

  /**
   * 🔄 Refrescar sesión si está próxima a expirar
   */
  const refreshSessionIfNeeded = useCallback(async () => {
    if (!session) return;

    try {
      const currentTime = Date.now();
      const sessionExp = session.expires ? new Date(session.expires).getTime() : 0;
      const timeUntilExpiry = sessionExp - currentTime;

      // Refrescar si queda menos del threshold
      if (timeUntilExpiry < SECURITY_CONFIG.sessionRefreshThreshold) {
        console.log('[Auth] Refreshing session...');
        await update();
      }
    } catch (error) {
      console.error('[Auth] Session refresh error:', error);
    }
  }, [session, update, SECURITY_CONFIG.sessionRefreshThreshold]);

  /**
   * 🔒 Verificación periódica de seguridad
   */
  const performSecurityCheck = useCallback(async () => {
    if (!session || authState !== AuthStates.AUTHENTICATED) return;

    try {
      // Verificar integridad de la sesión
      const isValid = await verifySessionIntegrity();
      
      if (!isValid) {
        setSessionValid(false);
        await handleSecurityLogout('session_expired');
        return;
      }

      // Refrescar sesión si es necesario
      await refreshSessionIfNeeded();

      setSessionValid(true);

    } catch (error) {
      console.error('[Auth] Security check error:', error);
      setSessionValid(false);
    }
  }, [session, authState, verifySessionIntegrity, handleSecurityLogout, refreshSessionIfNeeded]);

  /**
   * 🚀 Inicialización del proveedor
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (status === 'loading') {
          setAuthState(AuthStates.LOADING);
          return;
        }

        if (status === 'authenticated' && session?.user) {
          if (mounted) {
            setUser(session.user);
            setAuthState(AuthStates.AUTHENTICATED);
            updateActivity();
          }
        } else {
          if (mounted) {
            setUser(null);
            setAuthState(AuthStates.UNAUTHENTICATED);
          }
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mounted) {
          setAuthState(AuthStates.ERROR);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [status, session, updateActivity]);

  /**
   * 🕐 Configurar verificaciones periódicas
   */
  useEffect(() => {
    if (authState === AuthStates.AUTHENTICATED) {
      // Iniciar verificación periódica
      sessionCheckInterval.current = setInterval(
        performSecurityCheck,
        SECURITY_CONFIG.sessionCheckInterval
      );

      // Listeners de actividad
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => updateActivity();
      
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      // Cleanup
      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
        }
        
        if (activityTimeout.current) {
          clearTimeout(activityTimeout.current);
        }
        
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [authState, performSecurityCheck, updateActivity, SECURITY_CONFIG.sessionCheckInterval]);

  /**
   * 🔓 Logout manual del usuario
   */
  const logout = useCallback(async (reason = 'user_logout') => {
    try {
      setAuthState(AuthStates.LOADING);
      
      // Limpiar timers
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
      
      // Limpiar storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Logout de NextAuth
      await signOut({
        redirect: false,
        callbackUrl: '/login'
      });
      
      // Mostrar mensaje de confirmación
      if (reason === 'user_logout') {
        toast.success('Sesión cerrada correctamente', {
          icon: '👋'
        });
      }
      
      // Redirigir
      router.push('/login');
      
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      toast.error('Error al cerrar sesión');
      // Forzar recarga en caso de error
      window.location.href = '/login';
    }
  }, [router]);

  /**
   * 🔄 Refrescar datos del usuario
   */
  const refreshUser = useCallback(async () => {
    try {
      const newSession = await getSession();
      if (newSession?.user) {
        setUser(newSession.user);
        return newSession.user;
      }
      return null;
    } catch (error) {
      console.error('[Auth] User refresh error:', error);
      return null;
    }
  }, []);

  /**
   * ✅ Verificar si el usuario tiene un rol específico
   */
  const hasRole = useCallback((requiredRole) => {
    if (!user?.role) return false;
    
    const roleHierarchy = {
      'user': 1,
      'collector': 2,
      'admin': 3
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }, [user]);

  /**
   * 🛡️ Verificar permisos para una acción
   */
  const canPerform = useCallback((action, resource) => {
    if (!user) return false;
    
    // Definir permisos por rol
    const permissions = {
      admin: ['*'], // Todos los permisos
      collector: ['read', 'create', 'update'],
      user: ['read', 'create']
    };
    
    const userPermissions = permissions[user.role] || [];
    
    return userPermissions.includes('*') || userPermissions.includes(action);
  }, [user]);

  // Valor del contexto
  const contextValue = {
    // Estados
    authState,
    user,
    isLoading: authState === AuthStates.LOADING,
    isAuthenticated: authState === AuthStates.AUTHENTICATED,
    sessionValid,
    lastActivity,
    
    // Métodos de autenticación
    logout,
    refreshUser,
    
    // Métodos de autorización
    hasRole,
    canPerform,
    
    // Información de sesión
    session,
    
    // Estado de la aplicación
    isAdmin: user?.role === 'admin',
    isCollector: user?.role === 'collector' || user?.role === 'admin',
    isUser: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;