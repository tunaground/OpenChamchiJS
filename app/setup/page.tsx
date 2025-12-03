import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./setup-form";
import styles from "./page.module.css";

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
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.description}>{t("description")}</p>
        <SetupForm />
      </div>
    </div>
  );
}
