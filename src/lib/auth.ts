import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { isEmailVerificationSatisfied, resolveSafeRedirect } from '@/lib/auth-helpers';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const identifierStr = (credentials.identifier as string)?.toLowerCase();

        // Limit brute-force attempts per IP+identifier pair
        const ip = getClientIp(request);
        const { success } = rateLimit(`login:${ip}:${identifierStr}`, 10, 15 * 60 * 1000);
        if (!success) {
          throw new Error('Too many login attempts. Please try again later.');
        }

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

        // Block sign-in until the email is verified. Legacy accounts created
        // before verification existed have no token and are allowed through.
        if (!isEmailVerificationSatisfied(user)) {
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
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
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        if (!user.email) {
          return false;
        }

        const email = user.email.toLowerCase();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Generate unique username from name or email prefix
          let baseUsername = (user.name || email.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

          if (!baseUsername) {
            baseUsername = 'user';
          }

          let username = baseUsername;
          let isUnique = false;
          let suffix = 0;

          while (!isUnique) {
            const potentialUser = await prisma.user.findUnique({
              where: { username },
            });

            if (!potentialUser) {
              isUnique = true;
            } else {
              suffix++;
              username = `${baseUsername}${suffix}`;
            }
          }

          // Generate secure random hashed password
          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          // Create the new user. Google has already verified this email address,
          // so mark it verified immediately.
          await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: user.name || username,
              username,
              avatar: user.image || null,
              userType: 'INDIVIDUAL',
              isProfileCompleted: false,
              onboardingStep: 'ACCOUNT_CREATED',
              emailVerified: new Date(),
            },
          });
        } else if (!existingUser.emailVerified) {
          // A credentials signup that never verified is now proving ownership of
          // this address via Google — mark it verified and drop the pending token.
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              emailVerified: new Date(),
              emailVerificationToken: null,
              emailVerificationExpiry: null,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }: any) {
      // On initial sign-in, persist user fields into the token
      if (user) {
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email!.toLowerCase() },
            include: { category: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.username = dbUser.username;
            token.avatar = dbUser.avatar;
            token.location = dbUser.location;
            token.userType = dbUser.userType;
            token.colorTheme = dbUser.category?.colorTheme || null;
            token.fontFamily = dbUser.category?.fontFamily || null;
          }
        } else {
          token.id = user.id;
          token.username = (user as any).username;
          token.avatar = (user as any).avatar;
          token.location = (user as any).location;
          token.userType = (user as any).userType;
          token.colorTheme = (user as any).colorTheme;
          token.fontFamily = (user as any).fontFamily;
        }
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
    async redirect({ url, baseUrl }) {
      // Relative paths and same-origin absolute URLs only — never an external host.
      return resolveSafeRedirect(url, baseUrl);
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
