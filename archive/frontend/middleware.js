import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Check if user is authenticated for protected routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check admin role
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // API routes protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/protected/:path*'
  ]
};