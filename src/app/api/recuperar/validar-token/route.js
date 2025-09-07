import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/.netlify/functions';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, token, newPassword } = body || {};
    if (!email || !token || !newPassword) {
      return NextResponse.json({ ok: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Validar código
    const validateRes = await fetch(`${API_BASE}/password-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: token, newPassword })
    });
    const validateJson = await validateRes.json();
    if (!validateRes.ok || !validateJson.reset) {
      return NextResponse.json({ ok: false, error: 'validacion_fallida', detalle: validateJson }, { status: 400 });
    }

    // 2. Reset real (idempotente: si ya se consumió code esta llamada lo actualiza de todos modos)
    const resetRes = await fetch(`${API_BASE}/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: token, newPassword })
    });
    const resetJson = await resetRes.json();
    if (!resetRes.ok || !resetJson.reset) {
      return NextResponse.json({ ok: false, error: 'reset_fallido', detalle: resetJson }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reset: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'upstream_error', message: e.message }, { status: 502 });
  }
}

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 }); }