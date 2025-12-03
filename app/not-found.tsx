import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.message}>페이지를 찾을 수 없습니다.</p>
        <Link href="/" className={styles.link}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
