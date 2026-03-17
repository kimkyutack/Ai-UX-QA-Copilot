import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "../marketing.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={`shell ${styles.marketingShell}`}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Privacy</span>
          <h1>개인정보 처리방침</h1>
          <p>
            어떤 정보를 처리하고, 왜 필요한지, 얼마나 보관하는지 쉽게 확인할 수
            있도록 정리합니다.
          </p>
        </section>

        <div className={styles.layout}>
          <div className={styles.content}>
            <section className={styles.section}>
              <h2>현재 기준</h2>
              <ul>
                <li>API key는 저장하지 않습니다.</li>
                <li>분석 실행을 위해 필요한 요청 정보만 처리합니다.</li>
                <li>저장되는 리포트와 협업 데이터는 제품 기능 제공 목적에 한해 사용됩니다.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>정식 공개 시 포함될 내용</h2>
              <ul>
                <li>수집 항목과 처리 목적</li>
                <li>보관 기간과 삭제 요청 절차</li>
                <li>제3자 제공 여부와 문의 채널</li>
              </ul>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <section className={styles.sideCard}>
              <strong>지금 확인할 수 있는 것</strong>
              <p>현재 기준에서는 API key 비저장 원칙과 제품 기능 제공에 필요한 데이터 범위를 먼저 확인할 수 있습니다.</p>
            </section>
          </aside>
        </div>

        <footer className={styles.footer}>
          <span>Audit Flow AI</span>
          <div className={styles.footerLinks}>
            <Link href="/faq">FAQ</Link>
            <Link href="/">홈</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
