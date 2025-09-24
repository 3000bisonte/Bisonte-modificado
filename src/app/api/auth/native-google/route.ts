import { validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/errorHandler';
import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "next-auth/react";

// This endpoint is a thin wrapper to accept an ID token from the mobile app
// and trigger NextAuth credentials sign-in server-side. However, since this
// is an App Router API route, we can't call signIn() server-side directly from here.
// Instead, the mobile app should call NextAuth's /api/auth/callback/credentials
// with proper form data: { csrfToken, idToken }.
// For convenience, we document the client flow below.

export async function POST(request: NextRequest) {
  return NextResponse.json({
    ok: false,
    message: "Usa /api/auth/callback/credentials con idToken (ver documentación).",
  }, { status: 400 });
}
