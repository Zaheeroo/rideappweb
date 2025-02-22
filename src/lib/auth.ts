import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import { UserRole } from './constants';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please provide both email and password');
          }

          const email = credentials.email.toLowerCase().trim();

          // Special handling for admin role switching
          if (credentials.password === 'role-switch') {
            const { data: adminProfile } = await supabase
              .from('user_profiles')
              .select('id, role, email, full_name')
              .eq('email', email)
              .eq('role', UserRole.ADMIN)
              .single();

            if (!adminProfile) {
              throw new Error('Unauthorized role switch attempt');
            }

            return {
              id: adminProfile.id,
              email: adminProfile.email,
              name: adminProfile.full_name,
              role: credentials.role,
            };
          }

          // Parallel execution of auth and profile fetch
          const [authResult, profileResult] = await Promise.all([
            supabase.auth.signInWithPassword({
              email,
              password: credentials.password,
            }),
            supabase
              .from('user_profiles')
              .select('id, role, email, full_name')
              .eq('email', email)
              .single()
          ]);

          if (authResult.error) {
            console.error('Supabase auth error:', authResult.error.message);
            throw new Error(authResult.error.message);
          }

          if (!authResult.data?.user) {
            throw new Error('Authentication failed');
          }

          if (profileResult.error || !profileResult.data) {
            console.error('Profile error:', profileResult.error);
            throw new Error('Error fetching user profile');
          }

          const userProfile = profileResult.data;
          const requestedRole = credentials.role === 'Administrator' ? UserRole.ADMIN : credentials.role;

          // Simplified role validation
          if (
            userProfile.role === UserRole.ADMIN ||
            (userProfile.role === requestedRole && [UserRole.CUSTOMER, UserRole.DRIVER].includes(requestedRole))
          ) {
            return {
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.full_name,
              role: userProfile.role === UserRole.ADMIN ? requestedRole : userProfile.role,
            };
          }
          
          throw new Error(`Invalid role. You are registered as a ${userProfile.role}`);
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects
      if (url.startsWith('/')) {
        // Get the role from the URL parameters if available
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const roleParam = urlParams.get('role');

        // Handle role-based redirections
        switch (roleParam) {
          case 'driver':
          case UserRole.DRIVER:
            return `${baseUrl}/driver`;
          case 'Administrator':
          case UserRole.ADMIN:
            return `${baseUrl}/admin`;
          case UserRole.CUSTOMER:
          case 'customer':
            return `${baseUrl}/dashboard`;
          default:
            // If no specific role redirect is found, use the default URL
            return url.startsWith(baseUrl) ? url : baseUrl;
        }
      }
      
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 