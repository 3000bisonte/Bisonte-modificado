// Centralized environment validation using envalid
// Validates at import time to fail fast in dev, CI, and during build
import { cleanEnv, str, url, num, bool, email, makeValidator } from 'envalid'

// Custom validators
const commaSeparated = makeValidator<string[]>((input) => {
  if (typeof input !== 'string') return []
  return input.split(',').map((s) => s.trim()).filter(Boolean)
})

// Note: NEXT_PUBLIC_* vars are exposed to the client bundle by Next.js
// Keep secrets server-side only (non NEXT_PUBLIC_)
export const env = cleanEnv(process.env, {
  // Node/Build context
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  APP_VERSION: str({ default: 'dev' }),

  // Database (use one of the URLs depending on provider)
  DATABASE_URL: str({ desc: 'Primary database connection string (Prisma uses this)' }),

  // NextAuth
  NEXTAUTH_URL: url({ desc: 'Absolute URL to your site (https://app.example.com)' }),
  NEXTAUTH_SECRET: str({ desc: 'Used to encrypt NextAuth JWT/session' }),

  // Google OAuth (if enabled)
  GOOGLE_CLIENT_ID: str({ default: '', desc: 'Google OAuth client ID' }),
  GOOGLE_CLIENT_SECRET: str({ default: '', desc: 'Google OAuth client secret' }),

  // Email (Resend)
  RESEND_API_KEY: str({ default: '', desc: 'Resend API key for sending emails' }),
  EMAIL_FROM: email({ default: 'no-reply@bisonte.com', desc: 'Default From email address' }),

  // MercadoPago
  MP_ACCESS_TOKEN: str({ default: '', desc: 'MercadoPago Access Token (server-side secret)' }),
  MP_PUBLIC_KEY: str({ default: '', desc: 'MercadoPago Public Key (may be exposed to client if needed)' }),
  NEXT_PUBLIC_INIT_MERCADOPAGO: str({ default: '', desc: 'Public key/init value for MercadoPago frontend SDK' }),
  NEXT_PUBLIC_API_SERVER_URL: str({ default: '', desc: 'Optional separate API server base URL for clients' }),
  NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN: str({ default: '', desc: 'URL used by MercadoPago Brick Status Screen' }),
  NEXT_PUBLIC_API_URL: str({ default: '', desc: 'Legacy public API URL key (kept for compatibility)' }),
  FALLBACK_API_BASE_URL: str({ default: '', desc: 'SSR fallback when NEXT_PUBLIC_API_BASE_URL is not present' }),
  NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN: str({ default: 'false', desc: 'Toggle to show Google login button in UI' }),

  // Security / JWT (legacy helpers)
  JWT_SECRET: str({ default: '', desc: 'Legacy JWT secret for custom tokens (avoid default in prod)' }),
  TOKEN_SECRET: str({ default: '', desc: 'Legacy token secret used by some helpers' }),

  // CORS / URLs
  NEXT_PUBLIC_SITE_URL: url({ default: 'http://localhost:3000', desc: 'Public site URL for client code' }),
  NEXT_PUBLIC_API_BASE_URL: url({ default: 'http://localhost:3000/api', desc: 'Base URL for client to call APIs' }),
  ALLOWED_ORIGINS: commaSeparated({ default: [], desc: 'Comma-separated allowed origins for CORS' }),

  // Ads / Mobile (public-only)
  NEXT_PUBLIC_ADMOB_APP_ID: str({ default: '' }),
  NEXT_PUBLIC_ADMOB_REWARDED_ID: str({ default: '' }),
  NEXT_PUBLIC_ADMOB_BANNER_ID: str({ default: '' }),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: str({ default: '' }),
  NEXT_PUBLIC_ADSENSE_BANNER_SLOT: str({ default: '' }),
  NEXT_PUBLIC_ADSENSE_RECT_SLOT: str({ default: '' }),
  NEXT_PUBLIC_ADSENSE_RESP_SLOT: str({ default: '' }),

  // Misc
  RUNTIME_ENV: str({ default: 'local' }),
  BASE_URL: url({ default: 'http://localhost:3000/api', desc: 'Used by test scripts as the base API URL' }),
})

export type Env = typeof env

// Safe subset for client-side usage if needed in the future
export const publicEnv = {
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_BASE_URL: env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_INIT_MERCADOPAGO: env.NEXT_PUBLIC_INIT_MERCADOPAGO,
  NEXT_PUBLIC_API_SERVER_URL: env.NEXT_PUBLIC_API_SERVER_URL,
  NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN: env.NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN,
  NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN: env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN,
  NEXT_PUBLIC_ADMOB_APP_ID: env.NEXT_PUBLIC_ADMOB_APP_ID,
  NEXT_PUBLIC_ADMOB_REWARDED_ID: env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
  NEXT_PUBLIC_ADMOB_BANNER_ID: env.NEXT_PUBLIC_ADMOB_BANNER_ID,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_ADSENSE_BANNER_SLOT: env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT,
  NEXT_PUBLIC_ADSENSE_RECT_SLOT: env.NEXT_PUBLIC_ADSENSE_RECT_SLOT,
  NEXT_PUBLIC_ADSENSE_RESP_SLOT: env.NEXT_PUBLIC_ADSENSE_RESP_SLOT,
}
