  import NextAuth from 'next-auth';
  import Credentials from 'next-auth/providers/credentials';
  import { prisma } from '@/lib/prisma';
  import bcrypt from 'bcryptjs';

  export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
      Credentials({
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          });

          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
          };
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async jwt({ token, user }:any) {
        if (user) {
          token.id = user.id;
          token.username = (user as any).username;
          token.avatar = (user as any).avatar;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.username = token.username as string;
          session.user.avatar = token.avatar as string;
        }
        return session;
      },
    },
  });

  export const GET = handlers.GET;
  export const POST = handlers.POST;
