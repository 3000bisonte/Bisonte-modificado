import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      emailVerified?: boolean;
    } & DefaultSession["user"];
    oauth?: {
      provider?: string;
      scope?: string;
      accessTokenExpires?: number;
      hasRefreshToken?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    emailVerified?: boolean;
    passwordVersion?: number;
    oauth?: {
      provider?: string;
      tokenType?: string;
      scope?: string;
      accessTokenExpires?: number;
    };
    hasRefreshToken?: boolean;
    // refreshToken?: string; // keep server-side only if implemented
  }
}

export {};
