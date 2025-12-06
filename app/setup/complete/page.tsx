import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultData } from "@/lib/services/seed";

export default async function SetupCompletePage() {
  // Check if admin already exists - disable page entirely
  const existingAdminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
    include: { users: true },
  });

  if (existingAdminRole && existingAdminRole.users.length > 0) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/setup");
  }

  // Create all default permissions and roles
  const { adminRole } = await seedDefaultData();

  // Assign ADMIN role to current user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: session.user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      roleId: adminRole.id,
    },
  });

  redirect("/");
}
