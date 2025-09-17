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

export async function POST(request) {
	try {
		const url = new URL('/auth/bridge', request.url);
		url.search = '?to=%2Fhome';
		return NextResponse.redirect(url, 303);
	} catch {
		return NextResponse.redirect(new URL('/home', request.url), 303);
	}
}

export async function HEAD(request) {
	try {
		const url = new URL('/auth/bridge', request.url);
		url.search = '?to=%2Fhome';
		const res = NextResponse.redirect(url, 303);
		return res;
	} catch {
		return NextResponse.redirect(new URL('/home', request.url), 303);
	}
}

export async function OPTIONS(request) {
	try {
		const url = new URL('/auth/bridge', request.url);
		url.search = '?to=%2Fhome';
		return NextResponse.redirect(url, 303);
	} catch {
		return NextResponse.redirect(new URL('/home', request.url), 303);
	}
}

export async function PUT(request) { return POST(request); }
export async function PATCH(request) { return POST(request); }
export async function DELETE(request) { return POST(request); }

