'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
  followers_count?: number;
  fan_count?: number;
  posts?: any[];
  insights?: {
    page_impressions?: number;
    page_engaged_users?: number;
    page_post_engagements?: number;
  };
}

interface FacebookData {
  name?: string;
  pages?: FacebookPage[];
  error?: string;
}

export default function FacebookAnalyticsPage() {
  const { data: session, status } = useSession();
  const [facebookData, setFacebookData] = useState<FacebookData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacebookData = async () => {
      try {
        if (!session?.accessToken) {
          throw new Error('No Facebook access token available');
        }

        // Get user data
        const userResponse = await fetch('https://graph.facebook.com/v22.0/me', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const userData = await userResponse.json();

        if (userData.error) {
          throw new Error(userData.error.message);
        }

        // Get pages data
        const pagesResponse = await fetch('https://graph.facebook.com/v22.0/me/accounts', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
          throw new Error(pagesData.error.message);
        }

        // Fetch additional data for each page
        const pagesWithData = await Promise.all(
          pagesData.data.map(async (page: FacebookPage) => {
            // Get page insights
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v22.0/${page.id}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day`,
              {
                headers: {
                  Authorization: `Bearer ${page.access_token}`,
                },
              }
            );
            const insightsData = await insightsResponse.json();

            // Get recent posts
            const postsResponse = await fetch(
              `https://graph.facebook.com/v22.0/${page.id}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=5`,
              {
                headers: {
                  Authorization: `Bearer ${page.access_token}`,
                },
              }
            );
            const postsData = await postsResponse.json();

            // Get page details including followers
            const pageDetailsResponse = await fetch(
              `https://graph.facebook.com/v22.0/${page.id}?fields=followers_count,fan_count`,
              {
                headers: {
                  Authorization: `Bearer ${page.access_token}`,
                },
              }
            );
            const pageDetails = await pageDetailsResponse.json();

            return {
              ...page,
              followers_count: pageDetails.followers_count,
              fan_count: pageDetails.fan_count,
              posts: postsData.data,
              insights: {
                page_impressions: insightsData.data?.[0]?.values?.[0]?.value || 0,
                page_engaged_users: insightsData.data?.[1]?.values?.[0]?.value || 0,
                page_post_engagements: insightsData.data?.[2]?.values?.[0]?.value || 0,
              },
            };
          })
        );

        setFacebookData({
          name: userData.name,
          pages: pagesWithData,
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
            Your Facebook Pages Analytics
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {facebookData.pages?.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Page Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {page.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Category: {page.category}
                </p>
              </div>

              {/* Page Stats */}
              <div className="px-6 py-5 grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500">Followers</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {page.followers_count?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500">Page Likes</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {page.fan_count?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500">Daily Impressions</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {page.insights?.page_impressions?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500">Daily Engagements</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {page.insights?.page_post_engagements?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="px-6 py-5 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Posts
                </h4>
                <div className="space-y-4">
                  {page.posts?.map((post: any) => (
                    <div
                      key={post.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <p className="text-gray-900">{post.message || 'No message'}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(post.created_time).toLocaleDateString()}</span>
                        <span>• {post.likes?.summary?.total_count || 0} likes</span>
                        <span>• {post.comments?.summary?.total_count || 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
