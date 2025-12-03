"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>{session.user?.name || session.user?.email}</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={styles.button}
          >
            {tCommon("logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("title")}</h1>
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className={styles.button}
        >
          {t("googleButton")}
        </button>
      </div>
    </div>
  );
}
