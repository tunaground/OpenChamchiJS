import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { userService } from "@/lib/services/user";
import { AdminUsersContent } from "./admin-users-content";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canUpdate = await permissionService.checkUserPermission(userId, "user:update");
  const canDelete = await permissionService.checkUserPermission(userId, "user:delete");

  const [result, roles] = await Promise.all([
    userService.findAll(userId, { page, search }),
    userService.getAllRoles(userId),
  ]);

  const t = await getTranslations("adminUsers");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <AdminUsersContent
      users={result.data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roles: user.roles,
      }))}
      allRoles={roles.map((role) => ({
        id: role.id,
        name: role.name,
      }))}
      pagination={result.pagination}
      search={search ?? ""}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      sidebarLabels={{
        admin: tSidebar("admin"),
        backToHome: tSidebar("backToHome"),
        boards: tSidebar("boards"),
        users: tSidebar("users"),
        roles: tSidebar("roles"),
        settings: tSidebar("settings"),
      }}
      canUpdate={canUpdate}
      canDelete={canDelete}
      labels={{
        title: t("title"),
        name: t("name"),
        email: t("email"),
        roles: t("roles"),
        actions: t("actions"),
        editRoles: t("editRoles"),
        delete: t("delete"),
        noUsers: t("noUsers"),
        noResults: t("noResults"),
        searchPlaceholder: t("searchPlaceholder"),
        searchButton: t("searchButton"),
        confirmDelete: t("confirmDelete"),
        cancel: t("cancel"),
        save: t("save"),
        addRole: t("addRole"),
        removeRole: t("removeRole"),
      }}
    />
  );
}
