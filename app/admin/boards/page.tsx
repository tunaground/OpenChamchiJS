import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { BoardsContent } from "./boards-content";

export default async function AdminBoardsPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canWrite = await permissionService.checkUserPermission(userId, "board:write");
  const canEdit = await permissionService.checkUserPermission(userId, "board:edit");

  const boards = await boardService.findAllWithThreadCount(userId);

  const t = await getTranslations("adminBoards");

  return (
    <BoardsContent
      boards={boards.map((board) => ({
        id: board.id,
        name: board.name,
        deleted: board.deleted,
        threadCount: board.threadCount,
        threadsPerPage: board.threadsPerPage,
        responsesPerPage: board.responsesPerPage,
        maxResponsesPerThread: board.maxResponsesPerThread,
        blockForeignIp: board.blockForeignIp,
        showUserCount: board.showUserCount,
        createdAt: board.createdAt.toISOString(),
      }))}
      canWrite={canWrite}
      canEdit={canEdit}
      labels={{
        title: t("title"),
        createBoard: t("createBoard"),
        id: t("id"),
        name: t("name"),
        threads: t("threads"),
        status: t("status"),
        actions: t("actions"),
        active: t("active"),
        deleted: t("deleted"),
        edit: t("edit"),
        delete: t("delete"),
        restore: t("restore"),
        noBoards: t("noBoards"),
        confirmDelete: t("confirmDelete"),
        confirmRestore: t("confirmRestore"),
        settings: t("settings"),
        threadsPerPage: t("threadsPerPage"),
        responsesPerPage: t("responsesPerPage"),
        maxResponsesPerThread: t("maxResponsesPerThread"),
        blockForeignIp: t("blockForeignIp"),
        showUserCount: t("showUserCount"),
        save: t("save"),
        cancel: t("cancel"),
        create: t("create"),
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        yes: t("yes"),
        no: t("no"),
      }}
    />
  );
}
