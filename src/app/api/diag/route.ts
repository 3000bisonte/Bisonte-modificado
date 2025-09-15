import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const cookie = request.headers.get('cookie') || '';
  const now = new Date().toISOString();

  const res = NextResponse.json({
    ok: true,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    host: request.headers.get('host'),
    protocol: url.protocol,
    method: request.method,
    ua,
    cookieLen: cookie.length,
    cookieHasDiag: /diag_server=1/.test(cookie),
    timestamp: now,
  });

  if (url.searchParams.get('setcookie') === '1') {
    res.cookies.set({
      name: 'diag_server',
      value: '1',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 60 * 60,
    });
  }

  if (url.searchParams.get('clear') === '1') {
    res.cookies.set({
      name: 'diag_server',
      value: '',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 0,
    });
  }

  return res;
}
