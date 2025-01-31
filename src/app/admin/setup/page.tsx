'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const makeAdmin = async () => {
    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'anass@cmk.com' }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Admin role assigned successfully! Please sign out and sign in again to see the changes.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Failed to assign admin role');
      }
    } catch (err) {
      setError('An error occurred while making the request');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Setup
          </h2>
        </div>
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div>
          <button
            onClick={makeAdmin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Make anass@cmk.com an Admin
          </button>
        </div>
      </div>
    </div>
  );
}
