import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./setup-form";
import { SetupContent } from "./setup-content";

export default async function SetupPage() {
  // Check if admin already exists - disable page entirely
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
    include: { users: true },
  });

  if (adminRole && adminRole.users.length > 0) {
    notFound();
  }

  const t = await getTranslations("setup");

  return (
    <SetupContent title={t("title")} description={t("description")}>
      <SetupForm />
    </SetupContent>
  );
}
