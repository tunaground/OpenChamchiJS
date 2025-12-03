"use client";

import { signIn } from "next-auth/react";

export function SetupForm() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/setup/complete" })}
      style={{
        padding: "0.75rem 1.5rem",
        background: "var(--foreground)",
        color: "var(--background)",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        cursor: "pointer",
      }}
    >
      Google로 관리자 계정 설정
    </button>
  );
}
