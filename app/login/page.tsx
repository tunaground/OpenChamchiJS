"use client";

import { signIn } from "next-auth/react";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>로그인</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className={styles.button}
        >
          Google로 로그인
        </button>
      </div>
    </div>
  );
}
