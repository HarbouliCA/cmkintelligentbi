import { NextResponse } from 'next/server';
import { FacebookAdsService } from '@/lib/services/facebook-ads';

export async function POST(request: Request) {
  try {
    const { accountId, dateStart, dateStop } = await request.json();

    if (!process.env.FACEBOOK_ADS_ACCESS_TOKEN || !process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('Missing required environment variables');
    }

    const facebookAdsService = new FacebookAdsService(
      process.env.FACEBOOK_ADS_ACCESS_TOKEN,
      process.env.AZURE_STORAGE_CONNECTION_STRING,
      'facebook-ads-data'
    );

    // Fetch insights from Facebook
    const insights = await facebookAdsService.fetchAdsInsights(accountId, dateStart, dateStop);

    // Save to Azure Blob Storage
    const blobUrl = await facebookAdsService.saveToBlob(insights, accountId, dateStart, dateStop);

    return NextResponse.json({
      success: true,
      blobUrl,
      insightsCount: insights.length,
    });
  } catch (error: any) {
    console.error('Error syncing Facebook Ads data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync Facebook Ads data' },
      { status: 500 }
    );
  }
}
