import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    if (session.user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get the user ID from params
    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Prevent deleting yourself
    if (session.user?.id === userId) {
      return new NextResponse('Cannot delete your own account', { status: 400 });
    }

    // Delete the user and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related FacebookPages
      await tx.facebookPage.deleteMany({
        where: { userId },
      });

      // Delete related sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Delete related accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
