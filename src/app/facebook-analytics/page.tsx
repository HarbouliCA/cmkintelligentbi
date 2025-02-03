'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface FacebookData {
  name?: string;
  pages?: any[];
  error?: string;
}

export default function FacebookAnalyticsPage() {
  const { data: session, status } = useSession();
  const [facebookData, setFacebookData] = useState<FacebookData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debug log
    console.log('Session Data:', session);
    
    const fetchFacebookData = async () => {
      try {
        if (!session?.accessToken) {
          throw new Error('No Facebook access token available');
        }

        // First, get user data
        const userResponse = await fetch('https://graph.facebook.com/v22.0/me', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const userData = await userResponse.json();

        if (userData.error) {
          throw new Error(userData.error.message);
        }

        // Then, get pages data
        const pagesResponse = await fetch('https://graph.facebook.com/v22.0/me/accounts', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
          throw new Error(pagesData.error.message);
        }

        setFacebookData({
          name: userData.name,
          pages: pagesData.data || [],
        });
      } catch (error: any) {
        console.error('Facebook API Error:', error);
        setFacebookData({
          error: error.message || 'Failed to fetch Facebook data',
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchFacebookData();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Add debug section at the top of the component
  const renderDebugInfo = () => {
    const testFacebookToken = async () => {
      try {
        const response = await fetch('https://graph.facebook.com/v22.0/me?fields=id,name,email', {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        const data = await response.json();
        console.log('Facebook Test Response:', data);
        alert(data.error ? `Error: ${data.error.message}` : `Success! Connected as: ${data.name}`);
      } catch (error) {
        console.error('Test failed:', error);
        alert('Test failed: ' + (error as Error).message);
      }
    };

    return (
      <div className="bg-gray-100 p-4 mb-8 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <div className="space-y-2">
          <p><strong>Session Status:</strong> {status}</p>
          <p><strong>Access Token:</strong> {session?.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'Not found'}</p>
          <p><strong>User:</strong> {JSON.stringify(session?.user, null, 2)}</p>
          <button
            onClick={testFacebookToken}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Test Facebook Token
          </button>
          <details className="mt-2">
            <summary className="cursor-pointer">Full Session Data</summary>
            <pre className="mt-2 p-2 bg-gray-200 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Please sign in to view Facebook Analytics
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderDebugInfo()}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Loading Facebook data...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (facebookData.error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderDebugInfo()}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-red-600 sm:text-4xl">
              Error loading Facebook data
            </h2>
            <p className="mt-4 text-lg text-gray-500">{facebookData.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {renderDebugInfo()}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome, {facebookData.name}!
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Here are your Facebook Pages:
          </p>
        </div>

        <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-2 lg:max-w-none">
          {facebookData.pages?.map((page: any) => (
            <div
              key={page.id}
              className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white"
            >
              <div className="flex-1 p-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {page.name}
                </h3>
                <p className="mt-3 text-base text-gray-500">
                  Category: {page.category}
                </p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {page.access_token ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
