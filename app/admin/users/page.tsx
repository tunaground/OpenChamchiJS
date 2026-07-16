import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { userService } from "@/lib/services/user";
import { boardService } from "@/lib/services/board";
import { AdminUsersContent } from "./admin-users-content";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const isAdmin = await roleService.isAdmin(userId);
  if (!isAdmin) {
    redirect("/admin/boards");
  }

  const result = await userService.findAll(userId, { page, search });
  const boards = await boardService.findAll();

  const t = await getTranslations("adminUsers");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <AdminUsersContent
      key={`${page}-${search ?? ""}`}
      users={result.data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roles: user.roles,
      }))}
      pagination={result.pagination}
      search={search ?? ""}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      sidebarLabels={{
        admin: tSidebar("admin"),
        backToHome: tSidebar("backToHome"),
        boards: tSidebar("boards"),
        users: tSidebar("users"),
        settings: tSidebar("settings"),
        globalNotices: tSidebar("globalNotices"),
      }}
      isAdmin={isAdmin}
      canDelete={isAdmin}
      boards={boards.map((board) => ({ id: board.id, name: board.name }))}
      labels={{
        title: t("title"),
        name: t("name"),
        email: t("email"),
        actions: t("actions"),
        delete: t("delete"),
        noUsers: t("noUsers"),
        noResults: t("noResults"),
        searchPlaceholder: t("searchPlaceholder"),
        searchButton: t("searchButton"),
        confirmDelete: t("confirmDelete"),
        cancel: t("cancel"),
        editRoles: t("editRoles"),
        rolesTitle: t("rolesTitle"),
        globalRoles: t("globalRoles"),
        boardRoles: t("boardRoles"),
        save: t("save"),
        saveError: t("saveError"),
      }}
    />
  );
}
