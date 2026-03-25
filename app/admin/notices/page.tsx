import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { noticeService } from "@/lib/services/notice";
import { toISOString } from "@/lib/cache";
import { AdminGlobalNoticesContent } from "./admin-global-notices-content";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminGlobalNoticesPage({ searchParams }: Props) {
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canCreate = await permissionService.checkUserPermission(userId, "notice:create");
  const canUpdate = await permissionService.checkUserPermission(userId, "notice:update");
  const canDelete = await permissionService.checkUserPermission(userId, "notice:delete");

  const result = await noticeService.findGlobal({ page, search });

  const t = await getTranslations("adminGlobalNotices");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <AdminGlobalNoticesContent
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      sidebarLabels={{
        backToHome: tSidebar("backToHome"),
        admin: tSidebar("admin"),
        boards: tSidebar("boards"),
        users: tSidebar("users"),
        roles: tSidebar("roles"),
        settings: tSidebar("settings"),
        globalNotices: tSidebar("globalNotices"),
      }}
      notices={result.data.map((notice) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        pinned: notice.pinned,
        createdAt: toISOString(notice.createdAt),
        updatedAt: toISOString(notice.updatedAt),
      }))}
      pagination={result.pagination}
      search={search ?? ""}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      labels={{
        title: t("title"),
        createNotice: t("createNotice"),
        noticeTitle: t("noticeTitle"),
        content: t("content"),
        pinned: t("pinned"),
        createdAt: t("createdAt"),
        actions: t("actions"),
        edit: t("edit"),
        delete: t("delete"),
        noNotices: t("noNotices"),
        noResults: t("noResults"),
        save: t("save"),
        cancel: t("cancel"),
        create: t("create"),
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        confirmDelete: t("confirmDelete"),
        titlePlaceholder: t("titlePlaceholder"),
        contentPlaceholder: t("contentPlaceholder"),
        searchPlaceholder: t("searchPlaceholder"),
        searchButton: t("searchButton"),
      }}
    />
  );
}
