import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import connectDB from '@/lib/db/mongoose';
import UserModel from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log(`[Auth API] Attempting login for: ${credentials?.email}`);
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth API] Missing credentials');
          throw new Error('Invalid credentials');
        }

        try {
          await connectDB();
          console.log('[Auth API] Connected to DB');
          const user = await UserModel.findOne({ email: credentials.email });

          if (!user) {
            console.log(`[Auth API] User not found: ${credentials.email}`);
            throw new Error('Invalid credentials');
          }

          if (!user.isActive) {
            console.log(`[Auth API] User is inactive: ${credentials.email}`);
            throw new Error('Invalid credentials');
          }

          const isValid = await user.comparePassword(credentials.password as string);
          if (!isValid) {
            console.log(`[Auth API] Invalid password for: ${credentials.email}`);
            throw new Error('Invalid credentials');
          }

          console.log(`[Auth API] Login successful for: ${credentials.email}, Role: ${user.role}`);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[Auth API] Error in authorize:', error);
          throw error;
        }
      }
    }),
  ],
});
