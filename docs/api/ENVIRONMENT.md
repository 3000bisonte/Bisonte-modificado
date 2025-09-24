# Entorno y validación

Validamos variables críticas con `envalid` en `src/lib/env.ts` y las verificamos en prebuild con `scripts/prebuild-env-check.js`. Si falta algo, el build falla con un mensaje claro para evitar errores silenciosos en producción.

Claves mínimas para levantar el proyecto:

- DATABASE_URL (Prisma)
- NEXTAUTH_URL (URL absoluta de la app)
- NEXTAUTH_SECRET (>=32 chars)
- RESEND_API_KEY y EMAIL_FROM (si envías correos)
- MP_ACCESS_TOKEN y MP_PUBLIC_KEY (si usas MercadoPago)

Variables públicas (prefijo NEXT_PUBLIC_) se exponen al cliente; no pongas secretos ahí.

Usa `.env.example` como plantilla para `.env.local` y replica las mismas claves en producción desde el panel del proveedor (Vercel/Netlify).

