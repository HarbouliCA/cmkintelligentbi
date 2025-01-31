import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { FacebookPage } from '@/types/social-media';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pages = await prisma.facebookPage.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        accessToken: true,
        pageId: true,
        createdAt: true,
        updatedAt: true
      },
    });

    const formattedPages: FacebookPage[] = pages.map((page) => ({
      id: page.id,
      name: page.name,
      access_token: page.accessToken,
      category: 'PAGE', 
      connected: true  
    }));

    return NextResponse.json(formattedPages);
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook pages' },
      { status: 500 }
    );
  }
}
