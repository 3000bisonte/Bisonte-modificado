'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Custom hook para manejar autenticación en componentes
 * Redirige automáticamente si no está autenticado
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Obtener nombre de usuario
  const getUserName = (): string => {
    if (session?.user?.name) {
      return session.user.name;
    }

    if (session?.user?.email) {
      return session.user.email.split('@')[0];
    }

    return 'Usuario';
  };

  // Verificar si es admin
  const isAdmin = (): boolean => {
    const ADMIN_EMAILS = [
      '3000bisonte@gmail.com',
      'bisonteangela@gmail.com',
      'bisonteoskar@gmail.com',
    ];
    return !!(session?.user?.email && ADMIN_EMAILS.includes(session.user.email));
  };

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    userName: getUserName(),
    userEmail: session?.user?.email || null,
    userImage: session?.user?.image || null,
    isAdmin: isAdmin(),
    userId: session?.user?.email ?? session?.user?.id ?? null,
  };
}
