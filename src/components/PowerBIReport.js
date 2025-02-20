'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const PowerBIReport = ({ embedConfig }) => {
  const reportRef = useRef(null);

  useEffect(() => {
    let embedAttempts = 0;
    const maxAttempts = 3;

    const embedReport = async () => {
      if (typeof window === 'undefined') return;

      if (!window.powerbi) {
        console.log('Waiting for Power BI SDK...');
        if (embedAttempts < maxAttempts) {
          embedAttempts++;
          setTimeout(embedReport, 1000);
        }
        return;
      }

      if (!reportRef.current || !embedConfig) {
        console.error('Missing required configuration:', { 
          reportContainer: !!reportRef.current, 
          embedConfig: !!embedConfig 
        });
        return;
      }

      try {
        console.log('Embedding report with config:', embedConfig);

        const report = window.powerbi.embed(reportRef.current, {
          type: 'report',
          tokenType: 'Embed',
          accessToken: embedConfig.accessToken,
          embedUrl: embedConfig.embedUrl,
          id: embedConfig.id,
          permissions: 'View',
          settings: {
            filterPaneEnabled: false,
            navContentPaneEnabled: false,
          }
        });

        report.on('loaded', () => {
          console.log('Report loaded successfully');
        });

        report.on('error', (event) => {
          console.error('Error loading report:', event.detail);
        });

        return () => {
          report.off('loaded');
          report.off('error');
          if (reportRef.current) {
            window.powerbi.reset(reportRef.current);
          }
        };
      } catch (error) {
        console.error('Error embedding report:', error);
      }
    };

    embedReport();
  }, [embedConfig]);

  return (
    <div
      ref={reportRef}
      style={{
        height: '600px',
        width: '100%',
        border: '1px solid #ccc',
        borderRadius: '8px',
        position: 'relative'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        Chargement du rapport...
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(PowerBIReport), { ssr: false });