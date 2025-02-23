import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        url: `${process.env.AZURE_AD_LOGIN_URL}/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: "openid profile email offline_access https://analysis.windows.net/powerbi/api/Report.Read.All",
          prompt: "select_account"
        }
      },
      token: {
        url: `${process.env.AZURE_AD_LOGIN_URL}/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`
      },
      userinfo: {
        url: "https://graph.microsoft.com/v1.0/me"
      }
    })
  ],
  debug: true, // Activez le mode debug temporairement
  pages: {
    signIn: '/dashboard', // Rediriger directement vers le dashboard
    signOut: '/signin',
    error: '/signin' // En cas d'erreur, rediriger vers signin
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'azure-ad') {
        return true;
      }
      return false;
    },
    async jwt({ token, account }) {
      if (account?.provider === 'azure-ad') {
        token.accessToken = account.access_token;
        token.powerbiToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.powerbiToken = token.powerbiToken;
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };