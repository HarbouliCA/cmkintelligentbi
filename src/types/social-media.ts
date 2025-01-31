// Social Media Platform Types
export type SocialMediaPlatform = 'facebook' | 'instagram';

// Facebook Types
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  connected: boolean;
}

export interface FacebookInsights {
  pageId: string;
  metric: string;
  value: number;
  endTime: string;
  title: string;
}

// Instagram Types
export interface InstagramAccount {
  id: string;
  username: string;
  connected: boolean;
}

export interface InstagramInsights {
  id: string;
  metric: string;
  value: number;
  endTime: string;
  title: string;
}

export interface InstagramMedia {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  insights?: {
    engagement: number;
    impressions: number;
    reach: number;
  };
}

// Common Types
export interface SocialMediaMetric {
  platform: SocialMediaPlatform;
  metric: string;
  value: number;
  timestamp: string;
  accountId: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
