import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/.netlify/functions';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    const upstream = await fetch(`${API_BASE}/password-recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const txt = await upstream.text();
    let data; try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
    return NextResponse.json(data || {}, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ error: 'upstream_error', message: e.message }, { status: 502 });
  }
}

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 }); }