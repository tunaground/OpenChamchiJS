import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
    include: { users: true },
  });

  const needsSetup = !adminRole || adminRole.users.length === 0;

  return NextResponse.json({ needsSetup });
}
