import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/", // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { authOptions }; 

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
