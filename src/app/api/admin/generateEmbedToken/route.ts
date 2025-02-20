import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    console.log('Generating embed token...');
    
    // Request to generate the Power BI embed token
    const response = await axios.post(
      `https://login.microsoftonline.com/${process.env.POWERBI_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.POWERBI_CLIENT_ID || '',
        client_secret: process.env.POWERBI_CLIENT_SECRET || '',
        scope: 'https://analysis.windows.net/powerbi/api/.default',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const embedToken = response.data.access_token;
    
    // Construction de l'URL d'intégration avec les paramètres nécessaires
    const embedUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL;

    console.log('Token generated successfully:', {
      embedToken: embedToken.substring(0, 20) + '...',
      embedUrl,
      reportId: process.env.NEXT_PUBLIC_POWERBI_REPORT_ID
    });

    return NextResponse.json({
      accessToken: embedToken,
      embedUrl: embedUrl,
      reportId: process.env.NEXT_PUBLIC_POWERBI_REPORT_ID,
    });
  } catch (error) {
    console.error('Error fetching Power BI Embed Token:', error);
    return NextResponse.json({ error: 'Failed to generate embed token' }, { status: 500 });
  }
}