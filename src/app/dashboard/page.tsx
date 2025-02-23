'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PowerBIReport from '@/components/PowerBIReport';
import PowerBILogin from '@/components/PowerBILogin';

interface PowerBIEmbedConfiguration {
  type: 'report';
  tokenType: 'Embed';
  accessToken: string;
  embedUrl: string;
  id: string;
  settings: {
    navContentPaneEnabled: boolean;
    filterPaneEnabled: boolean;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [embedConfig, setEmbedConfig] = useState<PowerBIEmbedConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbedConfig = async () => {
    try {
      if (!session?.powerbiToken) {
        setError('Token Power BI non trouvé');
        return;
      }

      const response = await fetch('/api/admin/generateEmbedToken', {
        headers: {
          'Authorization': `Bearer ${session.powerbiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.accessToken && data.embedUrl && data.reportId) {
        setEmbedConfig({
          type: 'report',
          tokenType: 'Embed',
          accessToken: data.accessToken,
          embedUrl: data.embedUrl,
          id: data.reportId,
          settings: {
            navContentPaneEnabled: true,
            filterPaneEnabled: true,
          },
        });
        setError(null);
      }
    } catch (error: any) {
      console.error('Error fetching embed configuration:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement du rapport');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.powerbiToken) {
      fetchEmbedConfig();
    } else if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié avec Power BI
  if (status === 'authenticated' && !session?.powerbiToken) {
    return <PowerBILogin />;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Power BI Dashboard
            </h2>
            {error && (
              <div className="mt-4 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
          {embedConfig ? (
            <PowerBIReport embedConfig={embedConfig} />
          ) : (
            <div className="w-full h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}