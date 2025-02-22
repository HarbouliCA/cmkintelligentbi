import { NextResponse } from 'next/server';
import axios from 'axios';

const TENANT_ID = process.env.POWERBI_TENANT_ID;
const CLIENT_ID = process.env.POWERBI_CLIENT_ID;
const CLIENT_SECRET = process.env.POWERBI_CLIENT_SECRET;
const GROUP_ID = process.env.NEXT_PUBLIC_POWERBI_GROUP_ID;
const REPORT_ID = process.env.NEXT_PUBLIC_POWERBI_REPORT_ID;

export async function GET() {
  try {
    console.log('Generating embed token...');

    // 1. Get the access token from Azure AD
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID ?? '',
        client_secret: CLIENT_SECRET ?? '',
        scope: 'https://analysis.windows.net/powerbi/api/.default'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenResponse.data.access_token;

    // 2. Get the report details using the group endpoint
    const reportResponse = await axios.get(
      `https://api.powerbi.com/v1.0/myorg/groups/${GROUP_ID}/reports/${REPORT_ID}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 3. Generate the embed token using the group endpoint
    const embedTokenResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${GROUP_ID}/reports/${REPORT_ID}/GenerateToken`,
      { accessLevel: 'view' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Embed token and URL generated successfully:', {
      embedUrl: reportResponse.data.embedUrl,
      reportId: REPORT_ID
    });

    return NextResponse.json({
      accessToken: embedTokenResponse.data.token,
      embedUrl: reportResponse.data.embedUrl,
      reportId: REPORT_ID
    });
  } catch (error: any) {
    console.error('Error fetching Power BI Embed Token:', {
      statusCode: error.response?.status,
      errorInfo: error.response?.data,
      message: error.message
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate embed token',
        details: error.response?.data || error.message
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
