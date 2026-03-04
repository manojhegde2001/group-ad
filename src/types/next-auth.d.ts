// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      avatar: string | null;
      userType: string;
      colorTheme: string | null;
      fontFamily: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
    avatar: string | null;
    userType: string;
    colorTheme: string | null;
    fontFamily: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    avatar: string | null;
    userType: string;
    colorTheme: string | null;
    fontFamily: string | null;
  }
}
