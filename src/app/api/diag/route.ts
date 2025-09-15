import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const cookie = request.headers.get('cookie') || '';
  const now = new Date().toISOString();

  const qp = Object.fromEntries(url.searchParams.entries());
  const opSet = url.searchParams.get('setcookie'); // 'none' | 'lax' | 'client' | '1' (legacy)
  const opClear = url.searchParams.get('clear'); // name or '1' (all)

  const res = NextResponse.json({
    ok: true,
    path: url.pathname,
    query: qp,
    host: request.headers.get('host'),
    protocol: url.protocol,
    method: request.method,
    ua,
    cookieLen: cookie.length,
    cookieHas: {
      diag_server_none: /diag_server_none=1/.test(cookie),
      diag_server_lax: /diag_server_lax=1/.test(cookie),
      diag_client: /diag_client=1/.test(cookie),
    },
    timestamp: now,
  });

  // Set cookies per requested type
  if (opSet) {
    const kind = opSet === '1' ? 'none' : opSet;
    if (kind === 'none' || kind === 'all') {
      res.cookies.set({
        name: 'diag_server_none',
        value: '1',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60 * 60,
      });
    }
    if (kind === 'lax' || kind === 'all') {
      res.cookies.set({
        name: 'diag_server_lax',
        value: '1',
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 60 * 60,
      });
    }
    if (kind === 'client' || kind === 'all') {
      // non-HttpOnly cookie so document.cookie can read it
      res.cookies.set({
        name: 'diag_client',
        value: '1',
        httpOnly: false,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60 * 60,
      });
    }
  }

  // Clear cookies
  if (opClear) {
    const names = opClear === '1' ? ['diag_server_none','diag_server_lax','diag_client'] : [opClear];
    for (const n of names) {
      res.cookies.set({
        name: n,
        value: '',
        httpOnly: n !== 'diag_client',
        sameSite: n === 'diag_server_lax' ? 'lax' : 'none',
        secure: true,
        path: '/',
        maxAge: 0,
      });
    }
  }

  return res;
}
