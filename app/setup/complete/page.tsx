import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/auth/roles";
import { invalidateCache, CACHE_TAGS } from "@/lib/cache";

export default async function SetupCompletePage() {
  // Check if admin already exists - disable page entirely
  const adminCount = await prisma.user.count({
    where: { roles: { has: ROLE.ADMIN } },
  });
  if (adminCount > 0) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/setup");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { roles: { push: ROLE.ADMIN } },
  });

  invalidateCache(CACHE_TAGS.userRoles(session.user.id));

  redirect("/");
}
