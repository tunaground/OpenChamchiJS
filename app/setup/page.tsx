import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/auth/roles";
import { SetupForm } from "./setup-form";
import { SetupContent } from "./setup-content";

export default async function SetupPage() {
  // Check if admin already exists - disable page entirely
  const adminCount = await prisma.user.count({
    where: { roles: { has: ROLE.ADMIN } },
  });
  if (adminCount > 0) {
    notFound();
  }

  const t = await getTranslations("setup");

  return (
    <SetupContent title={t("title")} description={t("description")}>
      <SetupForm />
    </SetupContent>
  );
}
