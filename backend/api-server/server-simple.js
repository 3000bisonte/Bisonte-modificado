const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Health
app.get(['/api/health', '/health'], (req, res) => {
	res.json({ status: 'ok', time: new Date().toISOString() });
});

const handleConfig = (req, res) => {
	try {
		const origin = req.headers.origin || req.headers.referer || '';
		const isDevelopment = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('3000') || origin.includes('3001');

		const clientIds = {
			development: process.env.GOOGLE_CLIENT_ID_LOCAL || '831420252741-4191330gjs69hkm4jr55rig3d8ouas0f.apps.googleusercontent.com',
			production: process.env.GOOGLE_CLIENT_ID_PROD || '108242889910-n3ptem16orktkl0klv8onlttfl83r1ul.apps.googleusercontent.com',
		};

		const googleClientId = isDevelopment ? clientIds.development : clientIds.production;
		const redirectUri = isDevelopment
			? (origin ? origin.replace(/\/?$/, '') + '/auth/google/callback' : 'http://localhost:3000/auth/google/callback')
			: 'https://www.bisonteapp.com/auth/google/callback';

		res.setHeader('Cache-Control', 'public, max-age=300');
		const payload = {
			googleClientId,
			redirectUri,
			environment: isDevelopment ? 'development' : 'production',
			origin: origin || 'unknown',
			timestamp: new Date().toISOString(),
			success: true,
			version: '1.0.0',
		};
		console.log('[api-server] /api/config ->', { env: payload.environment, redirectUri });
		res.json(payload);
	} catch (error) {
		console.error('Config error:', error);
		res.status(500).json({ success: false, error: 'Internal error', message: error.message });
	}
};

app.get(['/api/config', '/api/public/config'], handleConfig);

app.use((req, res) => {
	// Don't interfere with API routes
	if (req.url.startsWith('/api/')) {
		return res.status(404).json({
			success: false,
			error: `Ruta no encontrada: ${req.url}`,
			available_auth_routes: [
				'/api/auth/signin/google',
				'/api/auth/callback/google', 
				'/api/auth/google',
				'/api/auth/session'
			]
		});
	}
	
	res.json({
		message: 'Bisonte API - Google OAuth Configuration',
		available_endpoints: [
			'/api/config', 
			'/api/public/config', 
			'/api/health',
			'/api/auth/signin/google',
			'/api/auth/callback/google',
			'/api/auth/google',
			'/api/auth/session'
		],
		timestamp: new Date().toISOString(),
		requestUrl: req.url,
		method: req.method,
	});
});

app.listen(PORT, () => {
	console.log(`[api-server] listening on :${PORT}`);
});
