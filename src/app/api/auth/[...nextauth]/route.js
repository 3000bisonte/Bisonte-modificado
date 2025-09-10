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
	} catch {}
	return handler(request, ctx);
}

export async function POST(request, ctx) {
	return handler(request, ctx);
}