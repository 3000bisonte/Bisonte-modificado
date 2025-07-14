import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Configuración de conexión a la base de datos Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Consulta por correo
async function getUserByEmail(email) {
  try {
    const res = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    return res.rows[0] || null;
  } catch (error) {
    console.error("Error en getUserByEmail:", error);
    return null;
  }
}

// Asegura que el usuario de Google exista en la base de datos
async function ensureGoogleUser(email, name) {
  try {
    const res = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      await pool.query(
        "INSERT INTO usuarios (nombre, email) VALUES ($1, $2)",
        [name || null, email]
      );
    }
  } catch (error) {
    console.error("Error en ensureGoogleUser:", error);
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email", placeholder: "correo@ejemplo.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔍 Intentando autorizar:", credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Credenciales faltantes");
            return null; // ✅ Cambiar throw por return null
          }

          const user = await getUserByEmail(credentials.email);
          if (!user) {
            console.log("❌ Usuario no encontrado");
            return null; // ✅ Cambiar throw por return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            console.log("❌ Contraseña inválida");
            return null; // ✅ Cambiar throw por return null
          }

          console.log("✅ Usuario autorizado:", user.email);
          return {
            id: user.id.toString(), // ✅ Convertir a string
            name: user.nombre,
            email: user.email,
          };
        } catch (error) {
          console.error("❌ Error en authorize:", error);
          return null; // ✅ Retornar null en caso de error
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (account?.provider === "google" && user?.email) {
          await ensureGoogleUser(user.email, user.name);
          const dbUser = await getUserByEmail(user.email);
          if (dbUser) token.id = dbUser.id.toString();
        }
        if (user) {
          token.id = user.id.toString();
        }
        return token;
      } catch (error) {
        console.error("❌ Error en callback jwt:", error);
        return token; // ✅ Retornar token en lugar de throw
      }
    },
    
    async session({ session, token }) {
      try {
        if (token?.id) {
          session.user.id = token.id;
        }
        return session;
      } catch (error) {
        console.error("❌ Error en callback session:", error);
        return session; // ✅ Retornar session en lugar de throw
      }
    },
    
    async redirect({ url, baseUrl }) {
      // ✅ MEJORAR LÓGICA DE REDIRECT
      console.log("🔄 Redirect desde:", url, "baseUrl:", baseUrl);
      
      // Si viene de login exitoso, ir a home
      if (url.includes("callback") || url.includes("signin")) {
        return `${baseUrl}/home`;
      }
      
      // Si es URL absoluta del mismo dominio, permitir
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Si es URL relativa, combinar con base
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Por defecto, ir a home
      return `${baseUrl}/home`;
    },
  },

  // ✅ CONFIGURACIÓN DE PÁGINAS
  pages: {
    signIn: "/", // Página de login
    error: "/", // Redirigir errores al login
    signOut: "/", // Redirigir logout al home
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // ✅ CONFIGURACIÓN CRÍTICA
  secret: process.env.NEXTAUTH_SECRET,
  
  // ✅ AÑADIR DEBUG EN DESARROLLO
  debug: process.env.NODE_ENV === "development",
  
  // ✅ CONFIGURACIÓN DE EVENTOS
  events: {
    async signIn({ user, account, profile }) {
      console.log("✅ Usuario logueado:", user.email);
    },
    async signOut({ token }) {
      console.log("👋 Usuario deslogueado");
    },
    async error(error) {
      console.error("❌ Error en NextAuth:", error);
    },
  },
});

export { handler as GET, handler as POST };