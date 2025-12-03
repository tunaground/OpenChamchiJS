import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SetupCompletePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/setup");
  }

  // Check if admin already exists
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
    include: { users: true },
  });

  if (adminRole && adminRole.users.length > 0) {
    redirect("/dashboard");
  }

  // Ensure ADMIN role exists
  const role = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "관리자",
    },
  });

  // Ensure all:all permission exists and is assigned to ADMIN
  const permission = await prisma.permission.upsert({
    where: { name: "all:all" },
    update: {},
    create: {
      name: "all:all",
      description: "모든 권한",
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permission.id,
      },
    },
    update: {},
    create: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  // Assign ADMIN role to current user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: session.user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      roleId: role.id,
    },
  });

  redirect("/dashboard");
}
