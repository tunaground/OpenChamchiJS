"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import styles from "./page.module.css";

export function SignOutButton() {
  const t = useTranslations("common");

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={styles.button}
    >
      {t("logout")}
    </button>
  );
}
