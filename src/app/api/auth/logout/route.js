import { NextResponse } from 'next/server';

/**
 * API endpoint para limpiar completamente la sesión del usuario
 * Este endpoint complementa el signOut de NextAuth limpiando datos adicionales
 */
export function POST(_request) {
  try {
    // Crear respuesta con headers para limpiar cookies de sesión
    const response = NextResponse.json({ 
      success: true,
      message: 'Session cleared successfully',
      timestamp: new Date().toISOString()
    });

    // Limpiar cookies de NextAuth y sesión
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'bisonte_mobile_session',
      'google_auth_data',
      'firebase_auth_token',
      'capacitor_session'
    ];

    cookiesToClear.forEach(cookieName => {
      // Limpiar cookie del dominio actual
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
      });

      // Limpiar cookie segura también
      response.cookies.set(cookieName, '', {
        expires: new Date(0), 
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'none'
      });
    });

    // Headers adicionales para prevenir cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Session cleanup completed successfully
    
    return response;

  } catch (error) {
    console.error('API logout error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear session',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar el estado del endpoint
export function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/logout',
    method: 'POST',
    description: 'Clears user session and auth cookies',
    timestamp: new Date().toISOString()
  });
}