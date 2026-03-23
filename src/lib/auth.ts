import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const identifierStr = credentials.identifier as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifierStr },
              { phone: identifierStr }
            ]
          },
          include: {
            category: true,
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
          location: user.location,
          userType: user.userType,
          colorTheme: user.category?.colorTheme || null,
          fontFamily: user.category?.fontFamily || null,
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
    async jwt({ token, user, trigger }: any) {
      // On initial sign-in, persist user fields into the token
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.avatar = (user as any).avatar;
        token.location = (user as any).location;
        token.userType = (user as any).userType;
        token.colorTheme = (user as any).colorTheme;
        token.fontFamily = (user as any).fontFamily;
      }
      // On manual update() call (e.g. after avatar upload) re-fetch from DB
      if (trigger === 'update' && token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              avatar: true,
              username: true,
              name: true,
              category: {
                select: {
                  colorTheme: true,
                  fontFamily: true,
                }
              }
            },
          });
          if (fresh) {
            token.avatar = fresh.avatar;
            token.username = fresh.username;
            if (fresh.name) token.name = fresh.name;
            token.colorTheme = fresh.category?.colorTheme;
            token.fontFamily = fresh.category?.fontFamily;
          }
        } catch { /* keep existing token if DB unreachable */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.avatar = token.avatar as string;
        (session.user as any).location = token.location as string;
        (session.user as any).userType = token.userType as string;
        (session.user as any).colorTheme = token.colorTheme as string;
        (session.user as any).fontFamily = token.fontFamily as string;
      }
      return session;
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
