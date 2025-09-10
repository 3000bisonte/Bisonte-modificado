import { NextResponse } from 'next/server';

// Enforce canonical host to avoid NextAuth OAuth state cookie mismatches
export function middleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;

	// Redirect apex domain to www
	if (host === 'bisonteapp.com') {
		url.hostname = 'www.bisonteapp.com';
		return NextResponse.redirect(url, 308);
	}

	return NextResponse.next();
}

export const config = {
	matcher: '/:path*',
};

