import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    powerbiToken?: string;
    accessToken?: string;
    user: {
      role?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    }
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
    powerbiToken?: string;
  }
}