// Unified authentication system for NextAuth integration
import { headers } from 'next/headers';
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyPassword, hashPassword } from "./security";
import prisma from "../libs/prisma";

export const authOptions = {
  providers: [
    // Google OAuth provider (enabled only if env vars are present)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            checks: ["pkce"],
            authorization: {
              params: {
                // Force account chooser and consent
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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        // Find user in database
        const user = await prisma.usuarios.findUnique({
          where: {
            email: credentials.email.toLowerCase()
          }
        });

        if (!user || !user.password) {
          throw new Error("Credenciales inválidas");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const unlockTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Cuenta bloqueada. Intenta en ${unlockTime} minutos.`);
        }

        // Verify password
        const isValidPassword = await verifyPassword(credentials.password, user.password);

        if (!isValidPassword) {
          // Increment failed login attempts
          const failedLogins = user.failedLogins + 1;
          const shouldLock = failedLogins >= 5;
          
          await prisma.usuarios.update({
            where: { id: user.id },
            data: {
              failedLogins,
              lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 min lock
            }
          });

          throw new Error("Credenciales inválidas");
        }

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
      name: `__Secure-next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    // In some mobile WebViews, PKCE/nonce cookies can be dropped on redirects unless SameSite=None
    pkceCodeVerifier: {
      name: `__Secure-next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    nonce: {
      name: `__Secure-next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
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
      // Optional domain restriction for Google accounts
      if (account?.provider === "google") {
        try {
          const allowed = (process.env.ALLOWED_GOOGLE_DOMAINS || "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          if (allowed.length) {
            const email = (profile?.email || user?.email || "").toLowerCase();
            const domain = email.split("@")[1];
            if (!domain || !allowed.includes(domain)) {
              // Redirect to error page with a message
              return "/auth/error?error=AccessDenied";
            }
          }
        } catch (_) {}
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        try {
          // If Google login, upsert user in our DB and use DB id in token
          if (account?.provider === "google" && user?.email) {
            const dbUser = await prisma.usuarios.upsert({
              where: { email: user.email.toLowerCase() },
              update: {
                nombre: user.name || user.email,
                emailVerified: true,
              },
              create: {
                email: user.email.toLowerCase(),
                nombre: user.name || user.email,
                emailVerified: true,
                esAdministrador: false,
                esRecolector: false,
              },
            });
            token.userId = String(dbUser.id);
            token.role = dbUser.esAdministrador ? 'admin' : dbUser.esRecolector ? 'collector' : 'user';
            token.passwordVersion = dbUser.passwordVersion ?? 0;
            token.emailVerified = !!dbUser.emailVerified;
          } else {
            // Credentials flow keeps values from authorize
            token.userId = user.id;
            token.role = user.role;
            token.passwordVersion = user.passwordVersion;
            token.emailVerified = user.emailVerified;
          }
        } catch (e) {
          // If DB is unavailable, still allow login but keep provider id
          token.userId = user.id;
          token.role = user.role;
          token.passwordVersion = user.passwordVersion;
          token.emailVerified = user.emailVerified;
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
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const h = headers();
        const ua = (h.get('user-agent') || '').toLowerCase();
        const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);

        const parsed = new URL(url, baseUrl);

        // Normalize API error endpoint to UI error page; if OAuthCallback, force bridge to home (unconditional)
        if (parsed.pathname.startsWith('/api/auth/error')) {
          const qs = parsed.search || '';
          if (/[?&]error=OAuthCallback(&|$)/i.test(qs)) {
            return `${baseUrl}/auth/bridge?to=%2Fhome`;
          }
          return `${baseUrl}/auth/error${qs}`;
        }

        // If already targeting the internal bridge, just allow it through
        if (parsed.origin === baseUrl && parsed.pathname.startsWith('/auth/bridge')) {
          return parsed.toString();
        }

    // For WebView environments, always route through the bridge so we can notify the host app
  if (isWebViewUA) {
          // Determine a safe in-app target
          let targetPath = '/home';
          if (parsed.origin === baseUrl) {
            const p = parsed.pathname + parsed.search;
            if (p && p !== '/' && !p.startsWith('/api')) {
              // Avoid sending back to login or API paths
              targetPath = p.startsWith('/login') ? '/home' : p;
            }
          }
          // Return string URL (NextAuth issues a 302); 302/303 both convert POST to GET in practice for browsers
          return `${baseUrl}/auth/bridge?to=${encodeURIComponent(targetPath)}`;
        }

        // Non-WebView: allow same-origin URLs
        if (parsed.origin === baseUrl) {
          return parsed.toString();
        }
        // Allow localhost dev callbacks
        if (parsed.hostname === 'localhost' && (parsed.port === '3001' || parsed.port === '3000')) {
          return parsed.toString();
        }
  } catch {}
      // Fallback: send to home
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

  debug: process.env.NODE_ENV === "development"
  ,
  trustHost: true,
  useSecureCookies: true
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
