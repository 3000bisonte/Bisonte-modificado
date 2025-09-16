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
			const res = NextResponse.redirect(url, 303);
			res.headers.set('X-Diag-Post-Converted', '1');
			return res;
		}
	}

	// If user lands on API/UI error endpoint with OAuthCallback, force bridge to home (drastic, unconditional)
	if (url.pathname.startsWith('/api/auth/error') || url.pathname.startsWith('/auth/error')) {
		const qs = url.search || '';
		if (/[?&]error=OAuthCallback(&|$)/i.test(qs)) {
			const bridge = new URL('/auth/bridge', url);
			bridge.search = '?to=%2Fhome';
			const res = NextResponse.redirect(bridge, 303);
			res.headers.set('X-Diag-Bridge-Error', '1');
			return res;
		}
		if (url.pathname.startsWith('/api/auth/error')) {
			const to = new URL('/auth/error', url);
			to.search = url.search; // preserve error code
			const res = NextResponse.redirect(to, 303);
			res.headers.set('X-Diag-Api-Error', '1');
			return res;
		}
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
		const res = NextResponse.redirect(url, 303);
		res.headers.set('X-Diag-Root-Bridge', '1');
		return res;
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
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;
        const protectedPaths = [
          "/remitente",
          "/home",
          "/cotizador",
          "/destinatario",
          "/pagos",
          "/profile",
        ];
        const isProtected = protectedPaths.some((path) => p === path || p.startsWith(path + "/"));
        return isProtected ? !!token : true;
      }
    }
  }
);

export const config = {
	matcher: [
		'/:path*', // Match all paths for main middleware
	],
};

