"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

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
