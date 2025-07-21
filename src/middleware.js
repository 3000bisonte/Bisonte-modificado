import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const admins = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com",
      "bisonteoskar@gmail.com",
    ];
    const userEmail = req.nextauth.token?.email;

    if (req.nextUrl.pathname.startsWith("/admin") && (!userEmail || !admins.includes(userEmail))) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/signin",
      signOut: "/auth/signout",
      error: "/auth/error",
      verifyRequest: "/auth/verify-request",
      newUser: null,
    },
  }
);

export const config = {
  matcher: [
    "/remitente",
    "/home",
    "/cotizador",
    "/destinatario",
    "/pagos",
    "/profile",
  ],
};
