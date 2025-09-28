import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Test endpoint para verificar que los endpoints funcionan
 * GET /api/test-google-auth
 */
export async function GET(request) {
  console.log('TEST Google Auth endpoint - GET request received');
  
  return NextResponse.json({
    success: true,
    message: 'Google Auth test endpoint is working',
    timestamp: new Date().toISOString(),
    headers: {
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
    }
  });
}

/**
 * Test endpoint para verificar POST requests
 * POST /api/test-google-auth
 */
export async function POST(request) {
  try {
    console.log('TEST Google Auth endpoint - POST request received');
    
    const body = await request.json();
    console.log('TEST Google Auth - Body received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TEST Google Auth - POST error:', error);
    return NextResponse.json(
      { error: 'POST test failed', details: error.message },
      { status: 500 }
    );
  }
}