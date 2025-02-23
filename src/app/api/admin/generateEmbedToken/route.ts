import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.powerbiToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const accessToken = session.powerbiToken;
    
    const POWERBI_API_URL = "https://api.powerbi.com/v1.0/myorg";
    const GROUP_ID = process.env.NEXT_PUBLIC_POWERBI_GROUP_ID;
    const REPORT_ID = process.env.NEXT_PUBLIC_POWERBI_REPORT_ID;

    const reportResponse = await axios.get(
      `${POWERBI_API_URL}/groups/${GROUP_ID}/reports/${REPORT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );

    const embedTokenResponse = await axios.post(
      `${POWERBI_API_URL}/groups/${GROUP_ID}/reports/${REPORT_ID}/GenerateToken`,
      {
        accessLevel: 'View',
        allowSaveAs: false
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );

    return NextResponse.json({
      accessToken: embedTokenResponse.data.token,
      embedUrl: reportResponse.data.embedUrl,
      reportId: REPORT_ID
    });

  } catch (error: any) {
    console.error('Erreur de génération du token:', error);
    
    return NextResponse.json(
      { 
        error: 'Échec de génération du token d\'intégration',
        details: error.response?.data || error.message
      }, 
      { status: error.response?.status || 500 }
    );
  }
}