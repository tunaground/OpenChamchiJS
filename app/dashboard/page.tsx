import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import styles from "./page.module.css";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.welcome}>
          {t("welcome", { name: session.user?.name || session.user?.email || "" })}
        </p>
        <div className={styles.info}>
          <p>{t("protectedMessage")}</p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
