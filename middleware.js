import { NextResponse } from 'next/server';

// Enforce canonical host to avoid NextAuth OAuth state cookie mismatches
export function middleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;
	const ua = (request.headers.get('user-agent') || '').toLowerCase();
	const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);

	// Redirect apex domain to www
	if (host === 'bisonteapp.com') {
		url.hostname = 'www.bisonteapp.com';
		return NextResponse.redirect(url, 308);
	}

		// If webview lands on /login with OAuthCallback error, jump to bridge
		const explicitWv = url.searchParams.get('wv') === '1';
		if ((isWebViewUA || explicitWv) && url.pathname === '/login' && url.searchParams.get('error') === 'OAuthCallback') {
			url.pathname = '/auth/bridge';
			url.search = '';
			return NextResponse.redirect(url, 307);
		}

	return NextResponse.next();
}

export const config = {
	matcher: '/:path*',
};

