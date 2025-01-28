'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/signin' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">CMK INTELLIGENT</h1>
              </div>
              <div className="hidden sm:ml-10 sm:flex">
                {session?.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin/users" 
                    className="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    User Management
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500">
                <div className="flex flex-col items-end">
                  <span>Role: {session?.user?.role}</span>
                  <span>Email: {session?.user?.email}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Welcome to CMK INTELLIGENT Dashboard</h2>
              <p className="text-gray-600">Select "User Management" from the navigation bar to manage users.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
