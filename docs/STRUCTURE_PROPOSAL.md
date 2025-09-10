Propuesta de estructura limpia (Next.js App Router)

src/
  app/
    (rutas y páginas App Router)
    api/
      <feature>/route.ts           # handlers delgados
    (feature)/page.tsx
  domain/                          # modelos de dominio
  services/                        # reglas de negocio y acceso a BD/APIs
  lib/                             # logger, env, http helpers, rate-limit
  schemas/                         # validaciones Zod
  config/                          # configuración de integraciones

Prácticas:
- Solo TypeScript en handlers/páginas (sin duplicados .js).
- Handlers delgados: validación (Zod) + servicio.
- `lib/env.ts` para validar variables de entorno.
- `lib/http.ts` con `withValidation`, `withAuth`, `withRateLimit`, `handle`.
- Logs estructurados y Sentry.

Frontend legacy
- Mover `frontend/` fuera del monorepo o renombrar a `_legacy_frontend/` para evitar colisiones con App Router.
- Si se mantiene: agregar `"ignore": ["frontend/**"]` en herramientas que escanean el árbol (lint/test si corresponde).
