import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { authOptions } from "../../../../lib/auth";

const handler = NextAuth(authOptions);

export async function GET(request, ctx) {
	try {
		const path = request.nextUrl?.pathname || "";
		const isGoogleCb = path.indexOf('/api/auth/callback/google') !== -1;
		const error = request.nextUrl.searchParams.get('error');
    const message = request.nextUrl.searchParams.get('message')?.toLowerCase() || '';
		const ua = (request.headers.get('user-agent') || '').toLowerCase();
		if (isGoogleCb && (error === 'OAuthCallback' || message.includes('pkce'))) {
			const url = new URL('/auth/bridge', request.url);
			url.search = '';
			return NextResponse.redirect(url, 303);
		}
		if (path.endsWith("/_log")) {
			return NextResponse.json({
				success: true,
				message: "Authentication logs endpoint",
				logs: [],
				timestamp: new Date().toISOString(),
			});
		}
		if (isGoogleCb) {
			try {
				const cookie = request.headers.get('cookie') || '';
				const q = Object.fromEntries(request.nextUrl.searchParams.entries());
				console.log('[OAuth callback] UA len:', ua.length, 'Cookie len:', cookie.length, 'Query:', q);
			} catch {
				// Silently ignore parsing errors
			}
		}
	} catch {
		// Silently ignore middleware errors
	}
	return handler(request, ctx);
}

export async function POST(request, ctx) {
	try {
		const path = request.nextUrl?.pathname || "";
		const isGoogleCb = path.indexOf('/api/auth/callback/google') !== -1;
		const error = request.nextUrl.searchParams.get('error');
		if (isGoogleCb && error === 'OAuthCallback') {
			const url = new URL('/auth/bridge', request.url);
			url.search = '';
			return NextResponse.redirect(url, 303);
		}
	} catch (middlewareError) {
		console.error('Middleware error:', middlewareError);
	}
	return handler(request, ctx);
}