import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { prisma } from "@/lib/prisma";
import { AdminContent } from "./admin-content";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const permissions = await permissionService.getUserPermissions(session!.user.id);

  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();

  const t = await getTranslations("admin");

  return (
    <AdminContent
      title={t("title")}
      userCount={userCount}
      roleCount={roleCount}
      permissionCount={permissionCount}
      usersLabel={t("users")}
      rolesLabel={t("roles")}
      permissionsLabel={t("permissions")}
      myPermissionsLabel={t("myPermissions")}
      permissions={permissions}
    />
  );
}
