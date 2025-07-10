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

// Asegura que el usuario de Google exista en la base de datos
async function ensureGoogleUser(email, name) {
  const res = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
  if (res.rows.length === 0) {
    await pool.query(
      "INSERT INTO usuarios (nombre, email) VALUES ($1, $2)",
      [name || null, email]
    );
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          throw new Error("No user found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (account?.provider === "google" && user?.email) {
          await ensureGoogleUser(user.email, user.name);
          const dbUser = await getUserByEmail(user.email);
          if (dbUser) token.id = dbUser.id;
        }
        if (user) {
          token.id = user.id;
        }
        return token;
      } catch (error) {
        console.error("Error en callback jwt:", error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (token?.id) {
          session.user.id = token.id;
        }
        return session;
      } catch (error) {
        console.error("Error en callback session:", error);
        throw error;
      }
    },
    async redirect({ url, baseUrl }) {
      return "/home";
    },
  },

  // Puedes eliminar la línea signIn si no usas página personalizada
  pages: {
    error: "/auth/error",
    signOut: "/", // Redirige al home al cerrar sesión
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };