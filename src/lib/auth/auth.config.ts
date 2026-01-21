import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { canAccessAdminPanel } from './permissions';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const canAccessAdmin = canAccessAdminPanel(role);
      
      const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');
      const isOnAdminLogin = nextUrl.pathname === '/admin/login';

      // 1. Admin Login Page Logic
      if (isOnAdminLogin) {
        if (isLoggedIn) {
            // If already logged in as someone who can access admin panel, go to dashboard
            if (canAccessAdmin) {
                return Response.redirect(new URL('/admin/dashboard', nextUrl));
            }
            // If logged in as regular user, redirect to home
            return Response.redirect(new URL('/', nextUrl));
        }
        return true; 
      }

      // 2. Admin Panel Logic (Protected Routes)
      if (isOnAdminPanel) {
        if (!isLoggedIn) {
            // Not logged in -> Redirect to Admin Login
            return Response.redirect(new URL('/admin/login', nextUrl));
        }
        if (!canAccessAdmin) {
            // Logged in but no permission -> Redirect to Home
            return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user }: { token: JWT, user?: User }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Providers are configured in auth.ts to avoid Edge Runtime issues
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
