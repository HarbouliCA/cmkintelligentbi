'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import PowerBILogin from './PowerBILogin';

const PowerBIReport = ({ embedConfig }) => {
  const { data: session, status } = useSession();
  const reportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [powerbiInstance, setPowerbiInstance] = useState(null);

  // Vérifier si l'utilisateur est authentifié avec Power BI
  if (!session?.powerbiToken) {
    return <PowerBILogin />;
  }

   // Si en cours de chargement de la session
   if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  useEffect(() => {
    const loadPowerBI = async () => {
      try {
        const { models } = await import('powerbi-client');
        if (window.powerbi) {
          setPowerbiInstance({
            instance: window.powerbi,
            models: models
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement de Power BI:', err);
        setError(err);
      }
    };

    loadPowerBI();
  }, []);

  useEffect(() => {
    if (!powerbiInstance?.instance || !embedConfig || !reportRef.current) {
      return;
    }

    try {
      // Reset le conteneur
      powerbiInstance.instance.reset(reportRef.current);

      const config = {
        type: 'report',
        tokenType: powerbiInstance.models.TokenType.Embed,
        accessToken: embedConfig.accessToken,
        embedUrl: embedConfig.embedUrl,
        id: embedConfig.reportId,
        permissions: powerbiInstance.models.Permissions.All,
        settings: {
          filterPaneEnabled: true,
          navContentPaneEnabled: true,
          background: powerbiInstance.models.BackgroundType.Transparent,
          panes: {
            filters: {
              expanded: false,
              visible: true
            },
            pageNavigation: {
              visible: true
              // Suppression de la position qui causait l'erreur
            }
          }
        }
      };

      console.log('Configuration d\'intégration:', {
        type: config.type,
        id: config.id,
        embedUrl: config.embedUrl
      });

      const report = powerbiInstance.instance.embed(reportRef.current, config);

      report.on('loaded', async () => {
        try {
          const pages = await report.getPages();
          console.log('Pages disponibles:', pages);
          
          if (pages && pages.length > 0) {
            await pages[0].setActive();
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Erreur lors du chargement des pages:', err);
          setError(err);
        }
      });

      report.on('error', (event) => {
        console.error('Erreur de chargement du rapport:', event.detail);
        setError(event.detail);
        setIsLoading(false);
      });

      return () => {
        report.off('loaded');
        report.off('error');
        if (powerbiInstance?.instance) {
          powerbiInstance.instance.reset(reportRef.current);
        }
      };
    } catch (err) {
      console.error('Erreur lors de l\'intégration:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [powerbiInstance, embedConfig]);

  return (
    <div className="relative w-full h-[800px]">
      <div
        ref={reportRef}
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Chargement du rapport...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-red-600">
            Une erreur s'est produite lors du chargement du rapport.
            <br />
            {error.message || 'Veuillez réessayer plus tard.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(PowerBIReport), {
  ssr: false
});