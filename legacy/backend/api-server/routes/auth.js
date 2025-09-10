const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Configuración OAuth2
const getGoogleClient = (isDevelopment = false) => {
  // Only read from environment; never embed real fallback secrets in source.
  const clientId = isDevelopment 
    ? process.env.GOOGLE_CLIENT_ID_LOCAL || process.env.GOOGLE_CLIENT_ID
    : process.env.GOOGLE_CLIENT_ID_PROD || process.env.GOOGLE_CLIENT_ID;

  const clientSecret = isDevelopment
    ? process.env.GOOGLE_CLIENT_SECRET_LOCAL || process.env.GOOGLE_CLIENT_SECRET
    : process.env.GOOGLE_CLIENT_SECRET_PROD || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[auth] Google OAuth client env vars missing');
  }
  return new OAuth2Client(clientId || 'missing-client-id', clientSecret || 'missing-client-secret');
};

// Detectar entorno
const isDevEnvironment = (req) => {
  const origin = req.headers.origin || req.headers.referer || '';
  return origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('3000') || origin.includes('3001');
};

// GET /api/auth/signin/google - Iniciar flujo OAuth
router.get('/signin/google', (req, res) => {
  try {
    const isDev = isDevEnvironment(req);
    const client = getGoogleClient(isDev);
    
    const origin = req.headers.origin || req.headers.referer || '';
    const callbackUrl = req.query.callbackUrl || `${origin}/home`;
    
    const redirectUri = isDev
      ? `${origin}/api/auth/callback/google`
      : 'https://bisonte-modificado.vercel.app/api/auth/callback/google';

    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
      state: Buffer.from(JSON.stringify({ callbackUrl, origin })).toString('base64'),
      redirect_uri: redirectUri
    });

    console.log('[auth] GET /signin/google -> redirecting to:', authorizeUrl);
    
    // Para WebView, devolver la URL en lugar de redirect directo
    if (req.headers['user-agent'] && /wv|WebView/i.test(req.headers['user-agent'])) {
      res.json({
        success: true,
        authUrl: authorizeUrl,
        message: 'Redirect to this URL for OAuth',
        isWebView: true
      });
    } else {
      res.redirect(authorizeUrl);
    }
    
  } catch (error) {
    console.error('[auth] Error in /signin/google:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Google OAuth',
      message: error.message
    });
  }
});

// GET /api/auth/callback/google - Callback OAuth
router.get('/callback/google', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('[auth] OAuth error:', error);
      return res.redirect(`/login?error=oauth_error&details=${error}`);
    }

    if (!code) {
      console.error('[auth] No authorization code received');
      return res.redirect('/login?error=no_code');
    }

    const isDev = isDevEnvironment(req);
    const client = getGoogleClient(isDev);
    
    const origin = req.headers.origin || req.headers.referer || '';
    const redirectUri = isDev
      ? `${origin}/api/auth/callback/google`
      : 'https://bisonte-modificado.vercel.app/api/auth/callback/google';

    // Intercambiar código por tokens
    const { tokens } = await client.getTokens({
      code,
      redirect_uri: redirectUri
    });

    // Verificar ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: client._clientId
    });

    const payload = ticket.getPayload();
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified
    };

    // Generar JWT interno
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name,
        provider: 'google'
      }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    // Extraer callbackUrl del state
    let callbackUrl = '/home';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        callbackUrl = stateData.callbackUrl || '/home';
      }
    } catch (e) {
      console.warn('[auth] Could not parse state:', e.message);
    }

    console.log('[auth] OAuth successful for user:', user.email);

    // Redirect con tokens como query params (para WebView)
    const finalUrl = `${callbackUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}&success=true`;
    res.redirect(finalUrl);

  } catch (error) {
    console.error('[auth] Error in /callback/google:', error);
    res.redirect(`/login?error=oauth_callback_error&message=${encodeURIComponent(error.message)}`);
  }
});

// POST /api/auth/google - Verificar ID token (para mobile)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    const isDev = isDevEnvironment(req);
    const client = getGoogleClient(isDev);

    // Verificar el ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: client._clientId
    });

    const payload = ticket.getPayload();
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified
    };

    // Generar JWT interno
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name,
        provider: 'google'
      }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    console.log('[auth] ID token verified for user:', user.email);

    res.json({
      success: true,
      token,
      user,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('[auth] Error verifying ID token:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid ID token',
      message: error.message
    });
  }
});

// GET /api/auth/session - Verificar sesión actual
router.get('/session', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret);
    
    res.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        provider: decoded.provider
      }
    });

  } catch (error) {
    console.error('[auth] Session verification error:', error);
    res.json({ authenticated: false, error: 'Invalid token' });
  }
});

module.exports = router;
