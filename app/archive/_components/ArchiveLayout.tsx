"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { ArchiveBoardListSidebar } from "./ArchiveBoardListSidebar";

interface ArchiveBoard {
  id: string;
  name: string;
}

interface ArchiveLayoutProps {
  title?: string;
  boards: ArchiveBoard[];
  children: React.ReactNode;
}

/** Archive pages share the app shell; the session comes from the client since these pages are static */
export function ArchiveLayout({ title, boards, children }: ArchiveLayoutProps) {
  const { status } = useSession();
  const t = useTranslations("common");

  return (
    <PageLayout
      title={title}
      sidebar={<ArchiveBoardListSidebar boards={boards} />}
      isLoggedIn={status === "authenticated"}
      canAccessAdmin={false}
      authLabels={{ login: t("login"), logout: t("logout") }}
    >
      {children}
    </PageLayout>
  );
}
