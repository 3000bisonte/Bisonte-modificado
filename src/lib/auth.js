import 'server-only';

// Unified authentication system for NextAuth integration
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import prisma from "./prisma.js";
import {
  checkLoginRateLimit,
  logSecurityEvent,
  SecurityEvents,
  getClientIP,
  getClientUserAgent
} from "./security";
import { validateApiInput, loginSchema } from "./validation";

// Helper functions
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const isProd = process.env.NODE_ENV === 'production';
// Derive cookie domain/secure based on NEXTAUTH_URL to avoid forcing a wrong domain in prod
const NEXTAUTH_HOST = process.env.NEXTAUTH_URL ? (() => {
  try { return new URL(process.env.NEXTAUTH_URL).hostname; } catch { return ''; }
})() : '';
const NEXTAUTH_SCHEME = process.env.NEXTAUTH_URL ? (() => {
  try { return new URL(process.env.NEXTAUTH_URL).protocol; } catch { return 'http:'; }
})() : 'http:';
// Only set a domain when actually serving on *.bisonteapp.com
const cookieDomain = (isProd && NEXTAUTH_HOST.endsWith('bisonteapp.com')) ? '.bisonteapp.com' : undefined;
// Secure cookies only when running over https in prod
const useSecure = isProd && NEXTAUTH_SCHEME === 'https:';

export const authOptions = {
  providers: [
    // Google OAuth provider without PKCE (uses state + nonce only)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            checks: ["state", "nonce"],
            authorization: {
              params: {
                prompt: "consent select_account",
                access_type: "offline",
                response_type: "code",
              },
            },
            profile(profile) {
              return {
                id: profile.sub,
                email: profile.email,
                name: profile.name || profile.email,
                emailVerified: !!profile.email_verified,
                role: "user",
              };
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        idToken: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials, req) {
        // 🛡️ Get client information for security logging
        const clientIP = req ? getClientIP(req) : 'unknown';
        const userAgent = req ? getClientUserAgent(req) : 'unknown';

        // Path A: Native Google Sign-In via ID Token (no OAuth redirect, ideal para WebView)
        if (credentials?.idToken) {
          // 📋 Validate Google ID Token structure
          if (!credentials.idToken || typeof credentials.idToken !== 'string') {
            console.error('[Auth] Invalid Google ID Token format');
            throw new Error("Formato de token inválido");
          }

          if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
            throw new Error("Falta GOOGLE_CLIENT_ID para validar idToken");
          }
          
          try {
            // 🔍 Rate limiting for Google OAuth (more lenient than password login)
            await checkLoginRateLimit(clientIP);
            
            const audiences = [
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_ANDROID_CLIENT_ID,
              process.env.GOOGLE_IOS_CLIENT_ID,
            ].filter(Boolean);
            
            const ticket = await googleClient.verifyIdToken({
              idToken: credentials.idToken,
              audience: audiences.length ? audiences : undefined,
            });
            
            const payload = ticket.getPayload();
            if (!payload) throw new Error("ID token inválido");
            
            const email = (payload.email || "").toLowerCase();
            if (!email || payload.email_verified === false) {
              throw new Error("Email no verificado en Google");
            }
            
            const name = payload.name || email;
            
            // 📊 Enhanced security logging for OAuth success
            await logSecurityEvent(SecurityEvents.OAUTH_SUCCESS, {
              email,
              ip: clientIP,
              userAgent,
              success: true,
              provider: 'google'
            });
            
            // Use improved user management
            const { handleGoogleAuth } = await import('./userManager.js');
            const userResult = await handleGoogleAuth({
              email,
              name,
              picture: payload.picture,
              email_verified: payload.email_verified ?? true
            });
            
            return {
              id: userResult.id,
              email: userResult.email,
              name: userResult.name,
              role: userResult.role,
              passwordVersion: userResult.passwordVersion ?? 0,
              emailVerified: userResult.emailVerified,
            };
          } catch (e) {
            // 📊 Log OAuth failure
            await logSecurityEvent(SecurityEvents.OAUTH_FAILED, {
              ip: clientIP,
              userAgent,
              success: false,
              provider: 'google',
              error: e.message,
              metadata: { idTokenPresent: !!credentials.idToken }
            });
            
            console.warn('[credentials authorize] idToken verify failed:', e);
            throw new Error("No se pudo validar el ID token de Google");
          }
        }

        // Path B: Credenciales clásicas (email/password)
        // 📋 Validate login form data
        const validation = validateApiInput(loginSchema, {
          email: credentials?.email || "",
          password: credentials?.password || ""
        });
        
        if (!validation.success) {
          const errorMessages = validation.error.details.map(e => e.message).join(', ');
          throw new Error(`Datos inválidos: ${errorMessages}`);
        }

        const { email: normalizedEmail, password } = validation.data;

        // 🛡️ Enhanced rate limiting (IP + Email)
        try {
          await checkLoginRateLimit(clientIP, normalizedEmail);
        } catch (rateLimitError) {
          // 📊 Log rate limit exceeded
          await logSecurityEvent(SecurityEvents.RATE_LIMIT_EXCEEDED, {
            email: normalizedEmail,
            ip: clientIP,
            userAgent,
            success: false,
            error: rateLimitError.message
          });
          
          console.warn(`[Auth] Rate limit exceeded for ${email} from IP: ${clientIP}`);
          throw rateLimitError;
        }

        // Find user in database
        const user = await prisma.usuarios.findUnique({
          where: { email: normalizedEmail }
        });

        if (!user || !user.password) {
          // 📊 Log failed attempt for non-existent user
          await logSecurityEvent(SecurityEvents.LOGIN_FAILED, {
            email: normalizedEmail,
            ip: clientIP,
            userAgent,
            success: false,
            error: 'User not found or no password',
            metadata: { userExists: !!user, hasPassword: !!(user?.password) }
          });
          
          console.warn(`[Auth] Failed login attempt for non-existent user: ${normalizedEmail} from IP: ${clientIP}`);
          throw new Error("Credenciales inválidas");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const unlockTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          
          // 📊 Log blocked login attempt
          await logSecurityEvent(SecurityEvents.LOGIN_BLOCKED, {
            userId: user.id.toString(),
            email: normalizedEmail,
            ip: clientIP,
            userAgent,
            success: false,
            metadata: { unlockTime, lockedUntil: user.lockedUntil }
          });
          
          throw new Error(`Cuenta bloqueada. Intenta en ${unlockTime} minutos.`);
        }

        // Verify password
        const isValidPassword = await verifyPassword(credentials.password, user.password);

        if (!isValidPassword) {
          // Increment failed login attempts with progressive lockout
          const failedLogins = user.failedLogins + 1;
          const shouldLock = failedLogins >= 5;
          
          // Progressive lockout: 30 min after 5 attempts, 2 hours after 10
          const lockDuration = failedLogins >= 10 ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
          
          await prisma.usuarios.update({
            where: { id: user.id },
            data: {
              failedLogins,
              lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null
            }
          });

          // 📊 Enhanced security logging for failed password attempts
          const eventType = shouldLock ? SecurityEvents.ACCOUNT_LOCKED : SecurityEvents.LOGIN_FAILED;
          await logSecurityEvent(eventType, {
            userId: user.id.toString(),
            email: normalizedEmail,
            ip: clientIP,
            userAgent,
            success: false,
            attempts: failedLogins,
            error: 'Invalid password',
            metadata: { 
              shouldLock, 
              lockDuration: shouldLock ? lockDuration : null,
              previousFailedLogins: user.failedLogins 
            }
          });

          throw new Error("Credenciales inválidas");
        }

        // 📊 Enhanced security logging for successful login
        await logSecurityEvent(SecurityEvents.LOGIN_SUCCESS, {
          userId: user.id.toString(),
            email: normalizedEmail,
          ip: clientIP,
          userAgent,
          success: true,
          metadata: { 
            previousFailedLogins: user.failedLogins,
            wasLocked: !!(user.lockedUntil && user.lockedUntil > new Date())
          }
        });
        
        // Reset failed login attempts and update last login
        await prisma.usuarios.update({
          where: { id: user.id },
          data: {
            failedLogins: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          }
        });

        // Return user object for NextAuth
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.nombre || user.email,
          role: user.esAdministrador ? 'admin' : user.esRecolector ? 'collector' : 'user',
          passwordVersion: user.passwordVersion,
          emailVerified: user.emailVerified
        };
      }
    })
  ],

  cookies: {
    state: {
      name: isProd ? '__Secure-next-auth.state' : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax', // sent on top-level GET navigations
        path: '/',
        secure: useSecure,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Fixed: Always 'lax' for session cookies to work on same-origin login
        path: '/',
        secure: useSecure,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
    callbackUrl: {
      name: isProd ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Fixed: Use 'lax' for better compatibility with same-origin requests
        path: '/',
        secure: useSecure,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
    // In some mobile WebViews, PKCE/nonce cookies can be dropped on redirects unless SameSite=None (only needed for OAuth)
    pkceCodeVerifier: {
      name: isProd ? '__Secure-next-auth.pkce.code_verifier' : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Fixed: Use 'lax' for OAuth flows from same domain
        path: '/',
        secure: useSecure,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
    nonce: {
      name: isProd ? '__Secure-next-auth.nonce' : 'next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecure,
      },
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const resolvedEmail = (user?.email ?? profile?.email ?? '').trim().toLowerCase();
          if (!resolvedEmail) {
            throw new Error('Google OAuth no proporcionó email');
          }

          const { handleGoogleAuth } = await import('./userManager.js');
          const syncResult = await handleGoogleAuth({
            email: resolvedEmail,
            name: user?.name ?? profile?.name,
            picture: (user && (user.image || user.picture)) || profile?.picture,
            email_verified: user?.emailVerified ?? profile?.email_verified ?? true,
          });

          // Mutate user object so downstream callbacks receive DB data
          user.id = syncResult.id;
          user.email = syncResult.email;
          user.name = syncResult.name;
          user.role = syncResult.role;
          user.emailVerified = syncResult.emailVerified;
          user.passwordVersion = syncResult.passwordVersion ?? 0;
        } catch (error) {
          console.error('[NextAuth signIn] Error syncing Google user', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      // Initial sign in
      if (user) {
        // Credentials/idToken flow provides all needed fields
        token.userId = user.id;
        token.role = user.role;
        token.passwordVersion = typeof user.passwordVersion === 'number' ? user.passwordVersion : 0;
        token.emailVerified = user.emailVerified;
      }

      // If OAuth account is present (e.g., Google), capture limited metadata for diagnostics
      // Do NOT expose refresh_token in session; keep only on the token (server-side) if provided
      if (account) {
        token.oauth = {
          provider: account.provider,
          tokenType: account.token_type || undefined,
          scope: account.scope || undefined,
          accessTokenExpires: account.expires_at || undefined,
        };
        if (account.refresh_token) {
          token.hasRefreshToken = true; // boolean only
          // Store refresh_token internally if you plan to implement token refresh server-side:
          // token.refreshToken = account.refresh_token; // intentionally not copied to session
        }
      }

      // Check if password was changed (invalidate token)
      if (token.userId && token.passwordVersion !== undefined) {
        const currentUser = await prisma.usuarios.findUnique({
          where: { id: parseInt(token.userId) },
          select: { passwordVersion: true }
        });

        if (currentUser && currentUser.passwordVersion !== token.passwordVersion) {
          // Password was changed, invalidate token
          return {};
        }
      }

      // Update session trigger
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
        // Expose only safe OAuth metadata for diagnostics (no actual tokens)
        if (token.oauth) {
          session.oauth = {
            provider: token.oauth.provider,
            scope: token.oauth.scope,
            accessTokenExpires: token.oauth.accessTokenExpires,
            hasRefreshToken: !!token.hasRefreshToken,
          };
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const parsed = new URL(url, baseUrl);
        // Normaliza errores
        if (parsed.pathname.startsWith('/api/auth/error')) {
          const qs = parsed.search || '';
          if (/[?&]error=OAuthCallback(&|$)/i.test(qs)) {
            return `${baseUrl}/auth/bridge?to=%2Fhome`;
          }
          return `${baseUrl}/auth/error${qs}`;
        }
        // Permite el bridge
        if (parsed.origin === baseUrl && parsed.pathname.startsWith('/auth/bridge')) {
          return parsed.toString();
        }
        // Redirecciona WebView por bridge si viene con wv=1
        if (parsed.origin === baseUrl && parsed.searchParams.get('wv') === '1') {
          const p = parsed.pathname + parsed.search;
          const target = p && !p.startsWith('/api') ? p : '/home';
          return `${baseUrl}/auth/bridge?to=${encodeURIComponent(target)}`;
        }
        if (parsed.origin === baseUrl) return parsed.toString();
      } catch {}
      return `${baseUrl}/home`;
    }
  },

  pages: {
    signIn: "/",
    error: "/auth/error"
  },

  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`);
    },
    async error(message) {
      try {
        const m = typeof message === 'string' ? message : JSON.stringify(message);
        console.error('[NextAuth error]', m);
      } catch (e) {
        console.error('[NextAuth error]');
      }
    }
  },

  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  useSecureCookies: useSecure
};

/**
 * Create user account
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user
 */
export async function createUser({ email, password, nombre, celular, ciudad }) {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.usuarios.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      nombre,
      celular,
      ciudad,
      emailVerified: false
    }
  });

  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre
  };
}

/**
 * Update user password and increment version
 * @param {number} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserPassword(userId, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.usuarios.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      passwordVersion: {
        increment: 1
      },
      token: null,
      tokenFecha: null
    }
  });

  return true;
}

/**
 * Update user password by email and increment version
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserPasswordByEmail(email, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  
  const result = await prisma.usuarios.updateMany({
    where: { email: email.toLowerCase() },
    data: {
      password: hashedPassword,
      passwordVersion: {
        increment: 1
      },
      token: null,
      tokenFecha: null
    }
  });

  return result.count > 0;
}
