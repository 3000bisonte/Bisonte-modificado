# Deploy a Vercel

Requisitos
- Cuenta en Vercel y proyecto creado o permisos para crear uno.
- Base de datos PostgreSQL (DATABASE_URL) compatible con Prisma.

Variables de entorno mínimas (Production)
- DATABASE_URL = postgres://user:pass@host:port/db
- NEXTAUTH_URL = https://TU-DOMINIO.vercel.app
- NEXTAUTH_SECRET = (cadena aleatoria segura)
- NEXT_PUBLIC_SITE_URL = https://TU-DOMINIO.vercel.app
- NEXT_PUBLIC_API_BASE_URL = https://TU-DOMINIO.vercel.app/api

Opcionales según features
- RESEND_API_KEY, EMAIL_FROM
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- MP_ACCESS_TOKEN, MP_PUBLIC_KEY, NEXT_PUBLIC_INIT_MERCADOPAGO

Generar NEXTAUTH_SECRET localmente
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pasos con la CLI (opcional)
```powershell
# 1) Inicia sesión
vercel login

# 2) Linkea el proyecto (si no existe)
vercel link

# 3) Configura variables (Production)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_API_BASE_URL production

# 4) Deploy (preview)
vercel

# 5) Deploy a producción
vercel --prod
```

Notas
- La app usa Next.js App Router (Next 13.5) y Prisma (PostgreSQL).
- No se requiere vercel.json; la detección por defecto funciona.
- Asegura que DATABASE_URL sea de PostgreSQL (el schema Prisma así lo define).
