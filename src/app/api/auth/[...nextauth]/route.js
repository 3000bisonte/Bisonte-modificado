import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";

const handler = NextAuth(authOptions);

export async function GET(request, ctx) {
	try {
		const path = request.nextUrl?.pathname || "";
		if (path.endsWith("/_log")) {
			return NextResponse.json({
				success: true,
				message: "Authentication logs endpoint",
				logs: [],
				timestamp: new Date().toISOString(),
			});
		}
		if (path.includes('/api/auth/callback/google')) {
			try {
				const ua = request.headers.get('user-agent') || '';
				const cookie = request.headers.get('cookie') || '';
				const q = Object.fromEntries(request.nextUrl.searchParams.entries());
				console.log('[OAuth callback] UA len:', ua.length, 'Cookie len:', cookie.length, 'Query:', q);
			} catch {}
		}
	} catch {}
	return handler(request, ctx);
}

export async function POST(request, ctx) {
	return handler(request, ctx);
}