'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
