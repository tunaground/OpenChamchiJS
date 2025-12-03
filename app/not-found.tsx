import Link from "next/link";
import { getTranslations } from "next-intl/server";
import styles from "./not-found.module.css";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.code}>{t("code")}</h1>
        <p className={styles.message}>{t("message")}</p>
        <Link href="/" className={styles.link}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
