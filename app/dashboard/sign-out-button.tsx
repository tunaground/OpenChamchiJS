"use client";

import { signOut } from "next-auth/react";
import styles from "./page.module.css";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={styles.button}
    >
      로그아웃
    </button>
  );
}
