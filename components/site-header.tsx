import Link from "next/link";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandBlock}>
          <div className={styles.brandMark}>AF</div>
          <div>
            <p className={styles.brand}>Audit Flow AI</p>
            <span className={styles.brandMeta}>AI UX QA SaaS</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/pricing">가격</Link>
          <Link href="/faq">FAQ</Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/workspace" className={styles.loginLink}>
            로그인
          </Link>
          <Link href="/workspace" className={styles.primaryButton}>
            무료로 시작하기
          </Link>
        </div>
      </div>
    </header>
  );
}
