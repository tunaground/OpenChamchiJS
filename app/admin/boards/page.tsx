import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { BoardsContent } from "./boards-content";

export default async function AdminBoardsPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canCreate = await permissionService.checkUserPermission(userId, "board:create");
  const canUpdate = await permissionService.checkUserPermission(userId, "board:update");

  const boards = await boardService.findAllWithThreadCount(userId);

  const t = await getTranslations("adminBoards");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <BoardsContent
      boards={boards.map((board) => ({
        id: board.id,
        name: board.name,
        defaultUsername: board.defaultUsername,
        deleted: board.deleted,
        threadCount: board.threadCount,
        threadsPerPage: board.threadsPerPage,
        responsesPerPage: board.responsesPerPage,
        maxResponsesPerThread: board.maxResponsesPerThread,
        blockForeignIp: board.blockForeignIp,
        showUserCount: board.showUserCount,
        uploadMaxSize: board.uploadMaxSize,
        uploadMimeTypes: board.uploadMimeTypes,
        createdAt: board.createdAt.toISOString(),
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
      labels={{
        title: t("title"),
        createBoard: t("createBoard"),
        id: t("id"),
        idPlaceholder: t("idPlaceholder"),
        name: t("name"),
        namePlaceholder: t("namePlaceholder"),
        defaultUsername: t("defaultUsername"),
        defaultUsernamePlaceholder: t("defaultUsernamePlaceholder"),
        threads: t("threads"),
        manageThreads: t("manageThreads"),
        manageNotices: t("manageNotices"),
        status: t("status"),
        actions: t("actions"),
        active: t("active"),
        deleted: t("deleted"),
        edit: t("edit"),
        delete: t("delete"),
        restore: t("restore"),
        notices: t("notices"),
        noBoards: t("noBoards"),
        confirmDelete: t("confirmDelete"),
        confirmRestore: t("confirmRestore"),
        settings: t("settings"),
        threadsPerPage: t("threadsPerPage"),
        responsesPerPage: t("responsesPerPage"),
        maxResponsesPerThread: t("maxResponsesPerThread"),
        blockForeignIp: t("blockForeignIp"),
        showUserCount: t("showUserCount"),
        uploadMaxSize: t("uploadMaxSize"),
        uploadMaxSizePlaceholder: t("uploadMaxSizePlaceholder"),
        uploadMimeTypes: t("uploadMimeTypes"),
        uploadMimeTypesPlaceholder: t("uploadMimeTypesPlaceholder"),
        save: t("save"),
        cancel: t("cancel"),
        create: t("create"),
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        yes: t("yes"),
        no: t("no"),
        required: t("required"),
      }}
    />
  );
}
