import { NextResponse } from 'next/server';

export async function GET(request) {
	try {
		const url = new URL('/auth/bridge', request.url);
		url.search = '?to=%2Fhome';
		return NextResponse.redirect(url, 303);
	} catch {
		return NextResponse.redirect(new URL('/home', request.url), 303);
	}
}

