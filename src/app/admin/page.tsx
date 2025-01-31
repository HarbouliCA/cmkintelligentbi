'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Manage Users
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-gray-600 mb-4">Configure system-wide settings</p>
          <button
            onClick={() => router.push('/admin/settings')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            View Settings
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600 mb-4">View system analytics and metrics</p>
          <button
            onClick={() => router.push('/admin/analytics')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
