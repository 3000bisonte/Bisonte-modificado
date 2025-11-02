/**
 * 🛡️ API Route para generar tokens CSRF
 * Endpoint: GET /api/csrf
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET(request) {
  try {
    // Generar token CSRF único
    const token = generateCsrfToken();
    
    // En producción, aquí podrías guardar el token en Redis o base de datos
    // asociado a la sesión del usuario para validación posterior
    
    return NextResponse.json({ 
      csrfToken: token,
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hora
      success: true
    });
  } catch (error) {
    console.error('[CSRF API] Error generando token:', error);
    
    return NextResponse.json(
      { 
        error: 'Error generando token CSRF',
        success: false
      },
      { status: 500 }
    );
  }
}
