'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PowerBIReport from '@/components/PowerBIReport';

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
  const { status } = useSession();
  const router = useRouter();
  const [embedConfig, setEmbedConfig] = useState<PowerBIEmbedConfiguration | null>(null);

  const fetchEmbedConfig = async () => {
    try {
      const response = await fetch('/api/admin/generateEmbedToken');
      const data = await response.json();
      
      console.log('API Response:', data);

      if (data.accessToken && data.embedUrl && data.reportId) {
        setEmbedConfig({
          type: 'report',
          tokenType: 'Embed',
          accessToken: data.accessToken,
          embedUrl: data.embedUrl,
          id: data.reportId,
          settings: {
            navContentPaneEnabled: true, // Changé à true
            filterPaneEnabled: true,     // Changé à true
          },
        });
      }
    } catch (error) {
      console.error('Error fetching embed configuration:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmbedConfig();
    } else if (status === 'unauthenticated') {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Power BI Dashboard
            </h2>
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