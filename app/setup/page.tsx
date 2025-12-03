import { notFound } from "next/navigation";
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>초기 설정</h1>
        <p className={styles.description}>
          관리자 계정을 설정합니다. Google 계정으로 로그인하면 해당 계정이 관리자가 됩니다.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
