// app/api/auth/[...nextauth]/route.js o auth.js
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
  const res = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
  return res.rows[0];
}

// Configuración de NextAuth
const handler = NextAuth({
  providers: [
    // Login con Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // Login con email y contraseña
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email", placeholder: "correo@ejemplo.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          throw new Error("No user found");
        }

        // LOG para depuración
        console.log("Password recibido:", credentials.password);
        console.log("Hash en BD:", user.password);

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  // Opcional: callbacks para personalizar sesión o token
  callbacks: {
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },

  pages: {
    signIn: "/auth/signin", // Ruta personalizada para el login
    error: "/auth/error",   // Ruta para errores de autenticación
  },

  session: {
    strategy: "jwt", // Puedes cambiar a "database" si lo prefieres
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
