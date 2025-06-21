export { default } from "next-auth/middleware";

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
