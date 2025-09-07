import { NextResponse } from 'next/server';

// Proxy to Netlify function (Option B). Removes direct DB credentials from Next.js layer.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/.netlify/functions';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }
    const upstream = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await upstream.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    return NextResponse.json(data || {}, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ error: 'upstream_error', message: e.message }, { status: 502 });
  }
}

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 }); }