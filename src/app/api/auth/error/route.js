import { NextResponse } from 'next/server';

export async function GET(request) {
	try {
		const url = new URL('/auth/bridge', request.url);
		url.search = '?to=%2Fhome';
		const res = NextResponse.redirect(url, 303);
		res.headers.set('Cache-Control','no-store');
		return res;
	} catch {
		const res = NextResponse.redirect(new URL('/home', request.url), 303);
		res.headers.set('Cache-Control','no-store');
		return res;
	}
}

export async function POST(request) {
		try {
			const url = new URL('/auth/bridge', request.url);
			url.search = '?to=%2Fhome';
			const res = NextResponse.redirect(url, 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		} catch {
			const res = NextResponse.redirect(new URL('/home', request.url), 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		}
}

export async function HEAD(request) {
		try {
			const url = new URL('/auth/bridge', request.url);
			url.search = '?to=%2Fhome';
			const res = NextResponse.redirect(url, 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		} catch {
			const res = NextResponse.redirect(new URL('/home', request.url), 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		}
}

export async function OPTIONS(request) {
		try {
			const url = new URL('/auth/bridge', request.url);
			url.search = '?to=%2Fhome';
			const res = NextResponse.redirect(url, 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		} catch {
			const res = NextResponse.redirect(new URL('/home', request.url), 303);
			res.headers.set('Cache-Control','no-store');
			return res;
		}
}

export async function PUT(request) { return POST(request); }
export async function PATCH(request) { return POST(request); }
export async function DELETE(request) { return POST(request); }

