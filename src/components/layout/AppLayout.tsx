import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isPowerBILoaded, setIsPowerBILoaded] = useState(false);

  useEffect(() => {
    const checkPowerBI = () => {
      if (typeof window !== 'undefined' && window.powerbi) {
        console.log('Power BI SDK is now available');
        setIsPowerBILoaded(true);
        return true;
      }
      return false;
    };

    if (!checkPowerBI()) {
      const interval = setInterval(() => {
        if (checkPowerBI()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Script
        src="https://cdn.jsdelivr.net/npm/powerbi-client/dist/powerbi.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Power BI script loaded successfully');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('powerbiLoaded'));
          }
        }}
        onError={(e) => {
          console.error('Error loading Power BI script:', e);
        }}
      />

      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center">
                <img
                  className="h-10 w-auto"
                  src="/vercel.svg"
                  alt="PLENYA BEAUTY"
                />
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link 
                  href="/dashboard" 
                  className="text-white hover:text-gray-200 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users" 
                  className="text-white hover:text-gray-200 font-medium"
                >
                  User Management
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <span className="text-sm text-gray-200">
                  TaniaRegidot@PLENYABEAUTYCMK.onmicrosoft.com
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded">
                  ADMIN
                </span>
              </div>
              <Link 
                href="/signout" 
                className="text-white hover:text-gray-200 font-medium ml-8"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="py-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;