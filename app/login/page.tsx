"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import styles from "./page.module.css";

export default function LoginPage() {
  const t = useTranslations("login");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("title")}</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className={styles.button}
        >
          {t("googleButton")}
        </button>
      </div>
    </div>
  );
}
