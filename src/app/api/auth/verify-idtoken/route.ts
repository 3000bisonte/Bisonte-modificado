import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

const enabled = process.env.ENABLE_IDTOKEN_VERIFY_ENDPOINT === '1';
const clientId = process.env.GOOGLE_CLIENT_ID || '';
const client = clientId ? new OAuth2Client(clientId) : null;

export async function POST(req: Request) {
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'missing idToken' }, { status: 400 });
    }
    if (!client) {
      return NextResponse.json({ ok: false, error: 'server not configured' }, { status: 500 });
    }
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'invalid token' }, { status: 401 });
    }
    const { sub, email, email_verified, name, picture, iss, aud, exp, iat } = payload as any;
    return NextResponse.json({ ok: true, payload: { sub, email, email_verified, name, picture, iss, aud, exp, iat } });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify error' }, { status: 400 });
  }
}
