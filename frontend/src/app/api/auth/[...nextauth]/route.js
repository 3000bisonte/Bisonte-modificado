import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Usuarios demo para pruebas
          const demoUsers = [
            {
              id: "1",
              email: "demo@bisonte.com",
              password: "demo123",
              name: "Usuario Demo",
              role: "user",
              esAdministrador: false,
              esRecolector: true
            },
            {
              id: "2", 
              email: "admin@bisonte.com",
              password: "admin123",
              name: "Administrador",
              role: "admin",
              esAdministrador: true,
              esRecolector: false
            },
            {
              id: "3",
              email: "user@bisonte.com", 
              password: "user123",
              name: "Usuario Normal",
              role: "user",
              esAdministrador: false,
              esRecolector: false
            }
          ];

          // Verificar usuarios demo
          const user = demoUsers.find(u => 
            u.email === credentials.email && u.password === credentials.password
          );

          if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }

          // Intentar autenticación con API de Netlify
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/.netlify/functions';
          
          const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.token && data.user) {
              return {
                id: data.user._id || data.user.id,
                email: data.user.email,
                name: data.user.name || data.user.nombre,
                role: data.user.role || data.user.rol,
                esAdministrador: data.user.esAdministrador || false,
                esRecolector: data.user.esRecolector || false,
                token: data.token
              };
            }
          }

          return null;
        } catch (error) {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.esAdministrador = user.esAdministrador;
        token.esRecolector = user.esRecolector;
        token.accessToken = user.token;
      }
      
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          esAdministrador: token.esAdministrador,
          esRecolector: token.esRecolector
        };
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      return true;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
