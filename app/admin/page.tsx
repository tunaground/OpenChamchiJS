import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const permissions = await permissionService.getUserPermissions(session!.user.id);

  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();

  const t = await getTranslations("admin");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("title")}</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{userCount}</span>
            <span className={styles.statLabel}>{t("users")}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{roleCount}</span>
            <span className={styles.statLabel}>{t("roles")}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{permissionCount}</span>
            <span className={styles.statLabel}>{t("permissions")}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("myPermissions")}</h2>
          <div className={styles.permissions}>
            {permissions.map((permission) => (
              <span key={permission} className={styles.permission}>
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
