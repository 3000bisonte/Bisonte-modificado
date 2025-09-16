import { NextResponse } from 'next/server';
import { withAuth } from "next-auth/middleware";

// Combined middleware: handles auth protection + WebView fixes + canonical host
function mainMiddleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;
	const ua = (request.headers.get('user-agent') || '').toLowerCase();
	const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);
	const method = request.method || 'GET';

	// CRITICAL: Handle POST→page conversions FIRST before any auth redirects
	if (method === 'POST') {
		const p = url.pathname;
		const isPageRoute = p === '/' || p === '/home' || p.startsWith('/auth/') || 
			p === '/remitente' || p === '/cotizador' || p === '/destinatario' || 
			p === '/pagos' || p === '/profile';
		if (isPageRoute) {
			console.log(`[405 Fix] Converting POST ${p} to GET via 303`);
			return NextResponse.redirect(url, 303);
		}
	}

	// If user lands on API error endpoint, send to UI error page
	if (url.pathname.startsWith('/api/auth/error')) {
		const qs = url.search || '';
		const explicitWv = url.searchParams.get('wv') === '1';
		// For WebView OAuth error, route through the bridge so we can finish inside the app
		if ((isWebViewUA || explicitWv) && /[?&]error=OAuthCallback(&|$)/i.test(qs)) {
			const bridge = new URL('/auth/bridge', url);
			bridge.search = '?to=%2Fhome';
			return NextResponse.redirect(bridge, 303);
		}
		const to = new URL('/auth/error', url);
		to.search = url.search; // preserve error code
		return NextResponse.redirect(to, 303);
	}

	// Force https and canonical www host for bisonteapp.com
	const isBisonteDomain = host.endsWith('bisonteapp.com');
	if (isBisonteDomain) {
		let changed = false;
		if (host === 'bisonteapp.com') {
			url.hostname = 'www.bisonteapp.com';
			changed = true;
		}
		if (url.protocol !== 'https:') {
			url.protocol = 'https:';
			changed = true;
		}
		if (changed) {
			return NextResponse.redirect(url, 308);
		}
	}

	// If webview lands on root with OAuthCallback error, jump to bridge
	const explicitWv = url.searchParams.get('wv') === '1';
	if ((isWebViewUA || explicitWv) && url.pathname === '/' && url.searchParams.get('error') === 'OAuthCallback') {
		url.pathname = '/auth/bridge';
		url.search = '';
		return NextResponse.redirect(url, 303);
	}

	return NextResponse.next();
}

// Auth-protected middleware wrapper
export default withAuth(
  async function authMiddleware(req) {
    // First run the main middleware logic
    const mainResponse = mainMiddleware(req);
    if (mainResponse && mainResponse.status !== 200) {
      return mainResponse; // Return redirects immediately
    }

    // Then handle auth-specific logic
    const admins = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com", 
      "bisonteoskar@gmail.com",
    ];
    const userEmail = req.nextauth.token?.email;

    if (req.nextUrl.pathname.startsWith("/admin") && (!userEmail || !admins.includes(userEmail))) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/",
      signOut: "/auth/signout", 
      error: "/auth/error",
      verifyRequest: "/auth/verify-request",
      newUser: null,
    },
  }
);

export const config = {
	matcher: [
		'/:path*', // Match all paths for main middleware
	],
};

