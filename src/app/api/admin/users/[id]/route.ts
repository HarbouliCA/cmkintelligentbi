import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get the user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    // Check if user exists
    if (!userToDelete) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if trying to delete self
    if (userToDelete.email === session.user.email) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Error deleting user", error: error.message },
      { status: 500 }
    );
  }
}
