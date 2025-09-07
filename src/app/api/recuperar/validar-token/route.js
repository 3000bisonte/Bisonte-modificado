import { NextResponse } from 'next/server';

// Placeholder proxy until Netlify implements token validation endpoint.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/.netlify/functions';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.email || !body.token || !body.newPassword) {
      return NextResponse.json({ ok: false, error: 'Datos incompletos' }, { status: 400 });
    }
    // Forward to future /password-validate (not yet implemented) for now simulate success
    return NextResponse.json({ ok: true, message: 'Simulado (implementar en Netlify)' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'upstream_error', message: e.message }, { status: 502 });
  }
}

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 }); }