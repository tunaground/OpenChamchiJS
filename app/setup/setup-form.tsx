"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export function SetupForm() {
  const t = useTranslations("setup");

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
      {t("googleButton")}
    </button>
  );
}
