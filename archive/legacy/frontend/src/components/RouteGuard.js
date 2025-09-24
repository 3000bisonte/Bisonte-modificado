"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Componente de protección de rutas simplificado con NextAuth
 */
export function RouteGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  const isAuthenticated = !!session?.user;
  const loading = status === 'loading';
  const user = session?.user;

  // Rutas que no requieren autenticación
  const publicRoutes = [
    '/',
    '/login',
    '/auth/google/callback',
    '/register',
    '/recuperar',
    '/contacto',
    '/about',
    '/home', // Temporalmente público para debugging
    '/politica-datos',
    '/terminos',
    '/cotizador',
    '/pagos',
    '/mercadopago',
    '/mercadopago/statusbrick',
    '/test-ads',
    '/no-conexion',
    '/diagnostic'
  ];

  // Rutas que requieren permisos de admin
  const adminRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/settings',
    '/admin/stats'
  ];

  useEffect(() => {
    const checkAuth = () => {
      // Si está cargando, esperar
      if (loading) {
        setAuthorized(false);
        return;
      }

      const isPublicRoute = publicRoutes.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      );

      const isAdminRoute = adminRoutes.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      );

      // Ruta pública - permitir acceso
      if (isPublicRoute) {
        setAuthorized(true);
        return;
      }

      // Usuario no autenticado - redirigir a login
      if (!isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
        return;
      }

      // Ruta admin pero usuario no es admin - redirigir a home
      if (isAdminRoute && user?.role !== 'admin' && !user?.esAdministrador) {
        router.push('/home?error=unauthorized');
        return;
      }

      // Usuario autenticado y autorizado
      setAuthorized(true);
    };

    checkAuth();
  }, [isAuthenticated, loading, user, pathname, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras autoriza
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return children;
}
