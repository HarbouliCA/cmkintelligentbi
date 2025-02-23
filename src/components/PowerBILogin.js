'use client';

import { signIn } from 'next-auth/react';

const PowerBILogin = () => {
  const handleLogin = () => {
    signIn('azure-ad', {
      callbackUrl: '/dashboard',
      redirect: true
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-2xl font-semibold mb-6">Accès au tableau de bord</h2>
      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L3 5v14l9 3 9-3V5l-9-3zm0 2.09L18 6v10.18L12 18.09V4.09z"/>
        </svg>
        Se connecter avec Power BI
      </button>
    </div>
  );
};

export default PowerBILogin;