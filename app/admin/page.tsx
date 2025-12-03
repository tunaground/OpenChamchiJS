import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const permissions = await getUserPermissions(session!.user.id);

  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>관리자 페이지</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{userCount}</span>
            <span className={styles.statLabel}>사용자</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{roleCount}</span>
            <span className={styles.statLabel}>역할</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{permissionCount}</span>
            <span className={styles.statLabel}>권한</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>내 권한</h2>
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
