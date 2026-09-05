import type { NextAuthConfig } from "next-auth";

// Edge-safe configuration for middleware
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardPath = 
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/plans") ||
        nextUrl.pathname.startsWith("/notes") ||
        nextUrl.pathname.startsWith("/sources") ||
        nextUrl.pathname.startsWith("/calendar") ||
        nextUrl.pathname.startsWith("/practice") ||
        nextUrl.pathname.startsWith("/progress") ||
        nextUrl.pathname.startsWith("/settings");

      if (isDashboardPath) {
        if (isLoggedIn) return true;
        // In local development mode without session, allow access to prevent blocking
        if (process.env.NODE_ENV !== "production") return true;
        return false;
      }
      return true;
    },
  },
  providers: [], // Empty providers array for Edge compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET || "dev-secret-key-32-chars-long-min-entropy-needed-1234",
};
