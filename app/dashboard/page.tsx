import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import styles from "./page.module.css";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>대시보드</h1>
        <p className={styles.welcome}>
          환영합니다, <strong>{session.user?.name || session.user?.email}</strong>님!
        </p>
        <div className={styles.info}>
          <p>이 페이지는 로그인한 사용자만 접근할 수 있습니다.</p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
