'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/signin' });
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-500 hover:to-pink-500 transition-colors">
                    PLENYA BEAUTY
                  </h1>
                </Link>
              </div>
              <nav className="hidden sm:flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-purple-100 text-purple-900 shadow-sm'
                      : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  Dashboard
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin/users"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive('/admin/users')
                        ? 'bg-purple-100 text-purple-900 shadow-sm'
                        : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    User Management
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
                <span className="text-sm text-gray-600">
                  {session?.user?.email}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-purple-600">
                  {session?.user?.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md shadow-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} Plenya Beauty. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-500 hover:text-purple-600 transition-colors duration-150"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-purple-600 transition-colors duration-150"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
