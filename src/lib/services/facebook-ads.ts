import { BlobServiceClient } from '@azure/storage-blob';

interface AdInsight {
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  cpc: number;
  cpm: number;
  ctr: number;
  date_start: string;
  date_stop: string;
  actions?: Array<{
    action_type: string;
    value: number;
  }>;
}

export class FacebookAdsService {
  private accessToken: string;
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(accessToken: string, azureConnectionString: string, containerName: string) {
    this.accessToken = accessToken;
    this.blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString);
    this.containerName = containerName;
  }

  async fetchAdsInsights(accountId: string, dateStart: string, dateStop: string): Promise<AdInsight[]> {
    try {
      const url = `https://graph.facebook.com/v18.0/act_${accountId}/insights`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        level: 'ad',
        fields: [
          'campaign_id',
          'campaign_name',
          'adset_id',
          'adset_name',
          'ad_id',
          'ad_name',
          'spend',
          'impressions',
          'clicks',
          'reach',
          'frequency',
          'cpc',
          'cpm',
          'ctr',
          'actions'
        ].join(','),
        time_range: JSON.stringify({
          since: dateStart,
          until: dateStop
        }),
        time_increment: '1'
      });

      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ads insights: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as AdInsight[];
    } catch (error) {
      console.error('Error fetching ads insights:', error);
      throw error;
    }
  }

  async saveToBlob(insights: AdInsight[], accountId: string, dateStart: string, dateStop: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists();

      const blobName = `facebook_ads/${accountId}/${dateStart}_${dateStop}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const data = JSON.stringify(insights, null, 2);
      await blockBlobClient.upload(data, data.length);

      return blockBlobClient.url;
    } catch (error) {
      console.error('Error saving to blob storage:', error);
      throw error;
    }
  }

  async getFromBlob(accountId: string, dateStart: string, dateStop: string): Promise<AdInsight[]> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobName = `facebook_ads/${accountId}/${dateStart}_${dateStop}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download(0);
      const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
      return JSON.parse(downloaded.toString()) as AdInsight[];
    } catch (error) {
      console.error('Error reading from blob storage:', error);
      throw error;
    }
  }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}
