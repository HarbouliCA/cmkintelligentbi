'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to Your Dashboard
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Monitor your social media analytics and insights
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Facebook Analytics Card */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-white rounded-xl p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-purple-100 rounded-xl p-3">
                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    Analytics
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Facebook Insights</h3>
                <p className="text-gray-600 mb-6">
                  Track your Facebook page performance and engagement metrics
                </p>
                <Link
                  href="/facebook-analytics"
                  className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                  View Analytics
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Instagram Insights Card */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-white rounded-xl p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-pink-100 rounded-xl p-3">
                    <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                    Insights
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Instagram Metrics</h3>
                <p className="text-gray-600 mb-6">
                  Monitor your Instagram account growth and engagement
                </p>
                <Link
                  href="/instagram-insights"
                  className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-pink-700 rounded-xl shadow-sm hover:from-pink-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200"
                >
                  View Insights
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* User Management Card */}
            {session?.user?.role === 'ADMIN' && (
              <div className="bg-gradient-to-br from-gray-50 to-white p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-white rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gray-100 rounded-xl p-3">
                      <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      Admin
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-600 mb-6">
                    Manage user accounts and their permissions
                  </p>
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-sm hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Manage Users
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
