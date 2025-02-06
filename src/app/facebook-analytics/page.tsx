'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUsers, FaThumbsUp, FaComments, FaShare } from 'react-icons/fa';

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
  followers_count?: number;
  fan_count?: number;
  posts?: Array<{
    id: string;
    message?: string;
    created_time: string;
    likes?: {
      summary: {
        total_count: number;
      };
    };
    comments?: {
      summary: {
        total_count: number;
      };
    };
    shares?: {
      count: number;
    };
  }>;
  insights?: {
    page_impressions?: number;
    page_engaged_users?: number;
    page_post_engagements?: number;
    page_views_total?: number;
    page_actions_post_reactions_total?: number;
  };
}

interface FacebookData {
  name?: string;
  pages?: FacebookPage[];
  error?: string;
}

export default function FacebookAnalyticsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const [facebookData, setFacebookData] = useState<FacebookData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error in URL parameters
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Facebook login failed. Please try again.');
      // Clear the error from URL without triggering a refresh
      window.history.replaceState({}, '', '/facebook-analytics');
    }
  }, [searchParams]);

  const handleConnectFacebook = async () => {
    try {
      await signIn('facebook', {
        callbackUrl: '/facebook-analytics',
        redirect: true,
      });
    } catch (error) {
      console.error('Error connecting to Facebook:', error);
      setError('Failed to connect to Facebook. Please try again.');
    }
  };

  const handleUnlinkFacebook = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/unlink/facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unlink Facebook account');
      }

      // Clear Facebook data
      setFacebookData({});
      
      // Sign out from the current session to clear the Facebook token
      await signOut({ redirect: false });
      
      // Update the session
      await updateSession();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error unlinking Facebook:', error);
      setError('Failed to unlink Facebook account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchFacebookData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!session?.accessToken) {
          setLoading(false);
          return;
        }

        // Get user data
        const userResponse = await fetch('https://graph.facebook.com/v18.0/me', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const userData = await userResponse.json();

        if (userData.error) {
          throw new Error(userData.error.message);
        }

        // Get pages data with additional fields
        const pagesResponse = await fetch(
          'https://graph.facebook.com/v18.0/me/accounts?fields=name,category,access_token,followers_count,fan_count',
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
          throw new Error(pagesData.error.message);
        }

        // Fetch additional data for each page
        const pagesWithData = await Promise.all(
          pagesData.data.map(async (page: FacebookPage) => {
            try {
              // Get page insights with more metrics
              const insightsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${page.id}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_views_total,page_actions_post_reactions_total&period=day`,
                {
                  headers: {
                    Authorization: `Bearer ${page.access_token}`,
                  },
                }
              );
              const insightsData = await insightsResponse.json();

              // Get recent posts with engagement data
              const postsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=5`,
                {
                  headers: {
                    Authorization: `Bearer ${page.access_token}`,
                  },
                }
              );
              const postsData = await postsResponse.json();

              return {
                ...page,
                insights: {
                  page_impressions: insightsData.data?.[0]?.values?.[0]?.value || 0,
                  page_engaged_users: insightsData.data?.[1]?.values?.[0]?.value || 0,
                  page_post_engagements: insightsData.data?.[2]?.values?.[0]?.value || 0,
                  page_views_total: insightsData.data?.[3]?.values?.[0]?.value || 0,
                  page_actions_post_reactions_total: insightsData.data?.[4]?.values?.[0]?.value || 0,
                },
                posts: postsData.data || [],
              };
            } catch (error) {
              console.error(`Error fetching data for page ${page.id}:`, error);
              return page;
            }
          })
        );

        setFacebookData({
          name: userData.name,
          pages: pagesWithData,
        });
      } catch (error: any) {
        console.error('Error fetching Facebook data:', error);
        setError(error.message || 'Failed to fetch Facebook data');
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

  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-gray-900">Facebook Analytics</h1>
            {session?.accessToken && (
              <button
                onClick={handleUnlinkFacebook}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Unlink Facebook
              </button>
            )}
          </div>

          {!session?.accessToken ? (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connect your Facebook Account
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your Facebook account to view analytics for your pages.
              </p>
              <button
                onClick={handleConnectFacebook}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Connect Facebook
              </button>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Facebook data...</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Connected as: {facebookData.name}
                </h2>
              </div>

              {facebookData.pages?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No Facebook pages found.</p>
                </div>
              ) : (
                <div className="grid gap-8">
                  {facebookData.pages?.map((page) => (
                    <div
                      key={page.id}
                      className="bg-white rounded-lg shadow-lg overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {page.name}
                            </h3>
                            <p className="text-sm text-gray-500">{page.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Followers</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {page.followers_count?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FaUsers className="text-purple-500 text-xl" />
                              <span className="text-sm text-gray-500">Page Views</span>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900">
                              {page.insights?.page_views_total?.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FaThumbsUp className="text-blue-500 text-xl" />
                              <span className="text-sm text-gray-500">Reactions</span>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900">
                              {page.insights?.page_actions_post_reactions_total?.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FaComments className="text-green-500 text-xl" />
                              <span className="text-sm text-gray-500">Engaged Users</span>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900">
                              {page.insights?.page_engaged_users?.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FaShare className="text-yellow-500 text-xl" />
                              <span className="text-sm text-gray-500">Impressions</span>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900">
                              {page.insights?.page_impressions?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h4>
                          <div className="space-y-4">
                            {page.posts?.map((post) => (
                              <div
                                key={post.id}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <p className="text-gray-900 mb-2">{post.message || 'No message'}</p>
                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                  <span>{new Date(post.created_time).toLocaleDateString()}</span>
                                  <span className="flex items-center">
                                    <FaThumbsUp className="text-blue-500 mr-1" />
                                    {post.likes?.summary?.total_count || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <FaComments className="text-green-500 mr-1" />
                                    {post.comments?.summary?.total_count || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <FaShare className="text-yellow-500 mr-1" />
                                    {post.shares?.count || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
