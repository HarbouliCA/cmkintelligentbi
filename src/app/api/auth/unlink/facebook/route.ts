import { getServerSession } from "next-auth/next";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user's Facebook account
    const facebookAccount = await prisma.account.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
        provider: "facebook",
      },
    });

    if (!facebookAccount) {
      return new NextResponse("No Facebook account found", { status: 404 });
    }

    // Remove Facebook account link from the user
    await prisma.account.delete({
      where: {
        id: facebookAccount.id,
      },
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error unlinking Facebook account:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to unlink Facebook account" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
