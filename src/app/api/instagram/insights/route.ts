import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { InstagramInsights, DateRange } from '@/types/social-media';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!accountId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const insights = await prisma.instagramInsights.findMany({
      where: {
        accountId: accountId,
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const formattedInsights: InstagramInsights[] = insights.map((insight) => ({
      id: insight.id,
      metric: 'followers',  
      value: insight.followers,  
      endTime: insight.timestamp.toISOString(),
      title: 'Followers Count'  
    }));

    return NextResponse.json(formattedInsights);
  } catch (error) {
    console.error('Error fetching Instagram insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram insights' },
      { status: 500 }
    );
  }
}
