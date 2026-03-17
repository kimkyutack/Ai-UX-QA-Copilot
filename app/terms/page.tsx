import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "../marketing.module.css";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={`shell ${styles.marketingShell}`}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Terms</span>
          <h1>이용약관</h1>
          <p>
            계정 사용, 공유 기능, 협업 기능, 결제와 환불 조건을 쉽게 확인할 수
            있도록 정리합니다.
          </p>
        </section>

        <div className={styles.layout}>
          <div className={styles.content}>
            <section className={styles.section}>
              <h2>지금 확인할 수 있는 범위</h2>
              <ul>
                <li>분석 결과는 보조 도구이며 최종 판단은 사용자가 검토해야 합니다.</li>
                <li>현재 공개 범위에서는 제품 실험과 UX QA 워크플로우 검증을 중심으로 안내합니다.</li>
                <li>가격과 결제 조건은 정식 공개 시 더 구체적으로 안내됩니다.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>정식 공개 시 포함될 내용</h2>
              <ul>
                <li>계정 생성과 권한</li>
                <li>플랜과 결제/환불</li>
                <li>리포트 공유와 협업 데이터 취급</li>
              </ul>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <section className={styles.sideCard}>
              <strong>지금 확인할 수 있는 것</strong>
              <p>계정, 협업, 공유 기능에 대한 기본 원칙과 향후 문서화 범위를 먼저 확인할 수 있습니다.</p>
            </section>
          </aside>
        </div>

        <footer className={styles.footer}>
          <span>Audit Flow AI</span>
          <div className={styles.footerLinks}>
            <Link href="/pricing">가격</Link>
            <Link href="/">홈</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
