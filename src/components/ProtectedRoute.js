// 🛡️ Componente de protección de rutas con autorización robusta
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import LoadingSpinner from './LoadingSpinner';

/**
 * 🔒 Componente para proteger rutas que requieren autenticación
 */
export function ProtectedRoute({ 
  children, 
  requiredRole = null,
  requiredPermission = null,
  fallbackUrl = '/login',
  requireEmailVerified = false,
  showLoadingSpinner = true 
}) {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    hasRole, 
    canPerform,
    sessionValid 
  } = useAuth();
  
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        setIsCheckingAuth(true);

        // Esperar a que termine la carga inicial
        if (isLoading) {
          return;
        }

        // Verificar autenticación básica
        if (!isAuthenticated) {
          console.log('[ProtectedRoute] User not authenticated, redirecting to login');
          router.push(`${fallbackUrl}?returnUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        // Verificar validez de sesión
        if (!sessionValid) {
          console.log('[ProtectedRoute] Invalid session, redirecting to login');
          router.push(`${fallbackUrl}?reason=invalid_session`);
          return;
        }

        // Verificar email verificado si es requerido
        if (requireEmailVerified && !user?.emailVerified) {
          console.log('[ProtectedRoute] Email not verified, redirecting');
          router.push('/verify-email');
          return;
        }

        // Verificar rol requerido
        if (requiredRole && !hasRole(requiredRole)) {
          console.log(`[ProtectedRoute] Insufficient role. Required: ${requiredRole}, User: ${user?.role}`);
          router.push('/unauthorized');
          return;
        }

        // Verificar permiso específico
        if (requiredPermission && !canPerform(requiredPermission.action, requiredPermission.resource)) {
          console.log(`[ProtectedRoute] Insufficient permissions for ${requiredPermission.action} on ${requiredPermission.resource}`);
          router.push('/unauthorized');
          return;
        }

        // Todo está bien, autorizar acceso
        setIsAuthorized(true);

      } catch (error) {
        console.error('[ProtectedRoute] Authorization error:', error);
        router.push(`${fallbackUrl}?error=auth_error`);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [
    isLoading, 
    isAuthenticated, 
    user, 
    hasRole, 
    canPerform, 
    sessionValid,
    requiredRole, 
    requiredPermission, 
    requireEmailVerified,
    router, 
    pathname, 
    fallbackUrl
  ]);

  // Mostrar loading mientras se verifica
  if (isLoading || isCheckingAuth) {
    return showLoadingSpinner ? (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    ) : null;
  }

  // Mostrar contenido solo si está autorizado
  if (isAuthorized) {
    return children;
  }

  // Fallback: mostrar loading (la redirección ya se está manejando)
  return showLoadingSpinner ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="large" />
    </div>
  ) : null;
}

/**
 * 🚫 Componente para rutas que requieren rol de administrador
 */
export function AdminRoute({ children, ...props }) {
  return (
    <ProtectedRoute 
      requiredRole="admin" 
      requireEmailVerified={true}
      fallbackUrl="/unauthorized"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 📦 Componente para rutas de recolector
 */
export function CollectorRoute({ children, ...props }) {
  return (
    <ProtectedRoute 
      requiredRole="collector" 
      requireEmailVerified={true}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 👤 Componente para rutas de usuario autenticado
 */
export function UserRoute({ children, ...props }) {
  return (
    <ProtectedRoute 
      requiredRole="user"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 📧 Componente para verificar email verificado
 */
export function VerifiedEmailRoute({ children, ...props }) {
  return (
    <ProtectedRoute 
      requireEmailVerified={true}
      fallbackUrl="/verify-email"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 🔄 Componente condicional basado en rol
 */
export function RoleBasedComponent({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  requireAll = false 
}) {
  const { user, hasRole } = useAuth();

  if (!user) {
    return fallback;
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => hasRole(role))
    : allowedRoles.some(role => hasRole(role));

  return hasAccess ? children : fallback;
}

/**
 * 🔐 Componente condicional basado en permisos
 */
export function PermissionBasedComponent({ 
  children, 
  action, 
  resource, 
  fallback = null 
}) {
  const { canPerform } = useAuth();

  if (!canPerform(action, resource)) {
    return fallback;
  }

  return children;
}

/**
 * 🚀 Hook para verificación de acceso sin redirección
 */
export function useAccessControl() {
  const { user, hasRole, canPerform, isAuthenticated, sessionValid } = useAuth();

  const checkAccess = (requirements) => {
    const {
      requireAuth = true,
      requiredRole = null,
      requiredPermission = null,
      requireEmailVerified = false
    } = requirements;

    // Verificar autenticación
    if (requireAuth && !isAuthenticated) {
      return { 
        hasAccess: false, 
        reason: 'not_authenticated',
        message: 'Autenticación requerida' 
      };
    }

    // Verificar validez de sesión
    if (requireAuth && !sessionValid) {
      return { 
        hasAccess: false, 
        reason: 'invalid_session',
        message: 'Sesión inválida' 
      };
    }

    // Verificar email verificado
    if (requireEmailVerified && !user?.emailVerified) {
      return { 
        hasAccess: false, 
        reason: 'email_not_verified',
        message: 'Email no verificado' 
      };
    }

    // Verificar rol
    if (requiredRole && !hasRole(requiredRole)) {
      return { 
        hasAccess: false, 
        reason: 'insufficient_role',
        message: `Rol ${requiredRole} requerido` 
      };
    }

    // Verificar permiso
    if (requiredPermission && !canPerform(requiredPermission.action, requiredPermission.resource)) {
      return { 
        hasAccess: false, 
        reason: 'insufficient_permissions',
        message: 'Permisos insuficientes' 
      };
    }

    return { 
      hasAccess: true, 
      reason: 'authorized',
      message: 'Acceso autorizado' 
    };
  };

  return { checkAccess };
}

export default ProtectedRoute;