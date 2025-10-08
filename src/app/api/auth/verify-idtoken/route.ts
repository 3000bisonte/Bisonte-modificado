import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

const enabled = process.env.ENABLE_IDTOKEN_VERIFY_ENDPOINT === '1';
const clientId = process.env.GOOGLE_CLIENT_ID || '';
const client = clientId ? new OAuth2Client(clientId) : null;

interface GooglePayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export async function POST(req: Request) {
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  try {
    const body: unknown = await req.json();
    const { idToken } = body as { idToken?: unknown };
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'missing idToken' }, { status: 400 });
    }
    if (!client) {
      return NextResponse.json({ ok: false, error: 'server not configured' }, { status: 500 });
    }
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload() as GooglePayload | undefined;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'invalid token' }, { status: 401 });
    }
    const { sub, email, email_verified, name, picture, iss, aud, exp, iat } = payload;
    return NextResponse.json({ ok: true, payload: { sub, email, email_verified, name, picture, iss, aud, exp, iat } });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'verify error';
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
  }
}
