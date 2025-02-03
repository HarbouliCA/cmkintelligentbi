import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: User & {
      role?: string;
    }
  }
  interface User {
    id?: string;
    role?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'public_profile,email',
          display: 'popup'
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'facebook') {
        return true; // Always allow Facebook login
      }
      return true; // Default behavior for other providers
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
      }
      if (account && account.provider === 'facebook') {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        // @ts-ignore
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
};
