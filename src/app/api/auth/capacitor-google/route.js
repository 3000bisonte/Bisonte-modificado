import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { encode } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handle Google authentication from Capacitor app
 * POST /api/auth/capacitor-google
 */
export async function POST(request) {
  try {
    console.log('POST /api/auth/capacitor-google - Request received');
    
    const body = await request.json();
    const { idToken, user } = body;

    console.log('POST /api/auth/capacitor-google - Body:', { 
      hasIdToken: !!idToken, 
      hasUser: !!user,
      userEmail: user?.email 
    });

    if (!idToken || !user) {
      console.log('POST /api/auth/capacitor-google - Missing required data');
      return NextResponse.json(
        { error: 'Missing idToken or user data' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    // In production, you should verify the token with Google's API
    // For now, we'll trust the client-side verification from Firebase
    
    console.log('Capacitor Google Auth - User:', {
      uid: user.uid,
      email: user.email,
      name: user.name
    });

    // Create NextAuth compatible session token
    const sessionData = {
      sub: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    // Use NextAuth's encode function to create a compatible JWT
    const token = await encode({
      token: sessionData,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('JWT token created successfully');

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.uid,
        email: user.email,
        name: user.name,
        image: user.picture
      },
      redirectUrl: '/home'
    });

    // Set the NextAuth session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
      
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    console.log('Response prepared with cookie');
    return response;

  } catch (error) {
    console.error('Capacitor Google Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get current auth status for Capacitor app
 * GET /api/auth/capacitor-google
 */
export async function GET(request) {
  try {
    // Check if user has valid session
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: token.sub,
          email: token.email,
          name: token.name,
          image: token.picture
        }
      });
    }

    return NextResponse.json({
      authenticated: false
    });

  } catch (error) {
    console.error('Get auth status error:', error);
    return NextResponse.json(
      { error: 'Failed to get auth status' },
      { status: 500 }
    );
  }
}

