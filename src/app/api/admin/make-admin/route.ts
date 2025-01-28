import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    return NextResponse.json(
      { message: "User role updated to ADMIN", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json(
      { message: "Failed to update user role" },
      { status: 500 }
    );
  }
}
