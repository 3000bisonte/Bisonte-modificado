import { NextResponse } from 'next/server';

// Enforce canonical host to avoid NextAuth OAuth state cookie mismatches
export function middleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;
	const ua = (request.headers.get('user-agent') || '').toLowerCase();
	const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);
	const method = request.method || 'GET';

	// In some in-app browsers, a POST ends up on a page route (/, /home, /auth/*) causing 405.
	// Force method switch by issuing a 303 to the same URL for these page routes only.
	if (method === 'POST') {
		const p = url.pathname;
		const isPageRoute = p === '/' || p === '/home' || p.startsWith('/auth/');
		if (isPageRoute) {
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

export const config = {
	matcher: '/:path*',
};

