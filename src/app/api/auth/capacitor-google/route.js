import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { signIn } from 'next-auth/react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handle Google authentication from Capacitor app
 * POST /api/auth/capacitor-google
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { idToken, user } = body;

    if (!idToken || !user) {
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

    // Create or update user session
    // This integrates with your existing NextAuth setup
    const sessionToken = await createUserSession({
      id: user.uid,
      email: user.email,
      name: user.name,
      image: user.picture,
      provider: 'google-capacitor'
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.uid,
        email: user.email,
        name: user.name,
        image: user.picture
      },
      sessionToken
    });

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

/**
 * Create user session (integrate with your existing auth system)
 */
async function createUserSession(userData) {
  // This should integrate with your existing user management
  // For now, return a basic session token
  
  try {
    // You can integrate this with your existing user creation logic
    // from src/lib/auth.js or your database
    
    const sessionData = {
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      provider: userData.provider,
      createdAt: new Date().toISOString()
    };

    // Generate a session token (you should use proper JWT signing)
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    return sessionToken;

  } catch (error) {
    console.error('Failed to create user session:', error);
    throw new Error('Session creation failed');
  }
}