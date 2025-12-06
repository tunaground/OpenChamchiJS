import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { roleService } from "@/lib/services/role";
import { AdminRolesContent } from "./admin-roles-content";

export default async function AdminRolesPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canCreate = await permissionService.checkUserPermission(userId, "role:create");
  const canUpdate = await permissionService.checkUserPermission(userId, "role:update");
  const canDelete = await permissionService.checkUserPermission(userId, "role:delete");

  const [roles, permissions] = await Promise.all([
    roleService.findAll(userId),
    roleService.getAllPermissions(userId),
  ]);

  const t = await getTranslations("adminRoles");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <AdminRolesContent
      roles={roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
      }))}
      allPermissions={permissions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      }))}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      sidebarLabels={{
        admin: tSidebar("admin"),
        backToHome: tSidebar("backToHome"),
        boards: tSidebar("boards"),
        users: tSidebar("users"),
        roles: tSidebar("roles"),
        settings: tSidebar("settings"),
      }}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      labels={{
        title: t("title"),
        name: t("name"),
        description: t("description"),
        permissions: t("permissions"),
        actions: t("actions"),
        edit: t("edit"),
        editPermissions: t("editPermissions"),
        delete: t("delete"),
        noRoles: t("noRoles"),
        createRole: t("createRole"),
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        confirmDelete: t("confirmDelete"),
        cancel: t("cancel"),
        save: t("save"),
        create: t("create"),
        addPermission: t("addPermission"),
        removePermission: t("removePermission"),
        noPermissions: t("noPermissions"),
      }}
    />
  );
}
