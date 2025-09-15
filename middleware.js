import { NextResponse } from 'next/server';

// Enforce canonical host to avoid NextAuth OAuth state cookie mismatches
export function middleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;
	const ua = (request.headers.get('user-agent') || '').toLowerCase();
	const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);

	// If user lands on API error endpoint, send to UI error page
	if (url.pathname.startsWith('/api/auth/error')) {
		const to = new URL('/auth/error', url);
		to.search = url.search; // preserve error code
		return NextResponse.redirect(to, 307);
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
			return NextResponse.redirect(url, 307);
		}

	return NextResponse.next();
}

export const config = {
	matcher: '/:path*',
};

