import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

type IconName = "layers" | "target" | "flow" | "shield";

const featureCards = [
  {
    icon: "layers" as const,
    title: "근거 기반 UX 분석",
    description:
      "페이지를 읽은 뒤 헤딩, 버튼, 링크, 본문 텍스트와 스크린샷 근거를 함께 보여줍니다.",
  },
  {
    icon: "target" as const,
    title: "실행 초안 생성",
    description:
      "히어로 카피, CTA 대안, 섹션 순서 제안까지 받아보고 바로 수정 작업으로 이어갈 수 있습니다.",
  },
  {
    icon: "flow" as const,
    title: "비교와 협업",
    description:
      "이전 분석과 비교하고, 상태와 담당자, 메모를 붙여 팀 안에서 같은 기준으로 리뷰할 수 있습니다.",
  },
  {
    icon: "shield" as const,
    title: "신뢰 가능한 운영 방식",
    description:
      "API key는 저장하지 않고 현재 탭에서만 유지되며, 결과와 함께 한계와 근거를 확인할 수 있습니다.",
  },
];

function SectionIcon({ name }: { name: IconName }) {
  switch (name) {
    case "layers":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 4 8 4-8 4-8-4 8-4Z" fill="none" />
          <path d="m4 12 8 4 8-4" fill="none" />
          <path d="m4 16 8 4 8-4" fill="none" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" fill="none" />
          <circle cx="12" cy="12" r="3" fill="none" />
          <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" fill="none" />
        </svg>
      );
    case "flow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="6" height="4" rx="1" fill="none" />
          <rect x="14" y="5" width="6" height="4" rx="1" fill="none" />
          <rect x="9" y="15" width="6" height="4" rx="1" fill="none" />
          <path d="M7 9v3h10V9M12 12v3" fill="none" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" fill="none" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" fill="none" />
        </svg>
      );
  }
}

export default function Home() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={`shell ${styles.landingShell}`}>
        <section className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <span className={styles.badge}>AI UX QA Copilot</span>
            <h1>분석 결과를 다음 작업으로 바로 연결하는 UX QA 서비스</h1>
            <p>
              페이지를 읽고, 근거를 정리하고, 실행 초안과 비교 리포트, 협업
              상태까지 한 흐름으로 제공합니다.
            </p>

            <div className={styles.heroActions}>
              <Link href="/workspace" className={styles.primaryAction}>
                워크스페이스 열기
              </Link>
              <Link href="/pricing" className={styles.secondaryAction}>
                가격 보기
              </Link>
            </div>

            <div className={styles.trustRow}>
              <span>실제 페이지 근거 기반</span>
              <span>멀티 에이전트 한국어 리포트</span>
              <span>비교·공유·협업까지 연결</span>
            </div>
          </div>

          <aside className={styles.heroVisual} aria-hidden="true">
            <div className={styles.visualWindow}>
              <div className={styles.visualTopbar}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.visualBody}>
                <div className={styles.visualHeroCard}>
                  <small>Latest report</small>
                  <strong>84</strong>
                  <p>지금 바로 손볼 3가지와 비교 리포트를 함께 확인합니다.</p>
                </div>
                <div className={styles.visualGrid}>
                  <div className={styles.visualMetric}>
                    <small>명확성</small>
                    <strong>88</strong>
                  </div>
                  <div className={styles.visualMetric}>
                    <small>전환</small>
                    <strong>82</strong>
                  </div>
                  <div className={styles.visualMetric}>
                    <small>접근성</small>
                    <strong>76</strong>
                  </div>
                  <div className={styles.visualMetric}>
                    <small>모바일</small>
                    <strong>81</strong>
                  </div>
                </div>
                <div className={styles.visualEvidence}>
                  <div className={styles.visualLineShort} />
                  <div className={styles.visualLineLong} />
                  <div className={styles.visualTags}>
                    <span>evidence</span>
                    <span>compare</span>
                    <span>share</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionHead}>
            <span>Product</span>
            <h2>리포트를 만든 뒤 무엇을 해야 할지 바로 보이도록 정리했습니다</h2>
          </div>

          <div className={styles.featureGrid}>
            {featureCards.map((item) => (
              <article key={item.title} className={styles.featureCard}>
                <span className={styles.iconBadge}>
                  <SectionIcon name={item.icon} />
                </span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <div>
              <span className={styles.badge}>Get started</span>
              <h2>분석은 워크스페이스에서 바로 시작할 수 있습니다</h2>
              <p>
                URL과 분석 모드를 선택하고, 리포트를 만들고, 비교하고, 공유해
                보세요.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/workspace" className={styles.primaryAction}>
                무료로 시작하기
              </Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <section id="privacy" className={styles.legalNote}>
            <strong>개인정보 처리방침</strong>
            <p>
              API key는 저장하지 않으며 현재 탭에서만 사용됩니다. 정식 공개 시
              수집 항목, 처리 목적, 보관 기간, 문의 채널을 별도 문서로 제공합니다.
            </p>
          </section>
          <section id="terms" className={styles.legalNote}>
            <strong>이용약관</strong>
            <p>
              계정 사용, 팀 협업, 공유 기능, 결제와 환불 정책을 포함한 이용
              조건은 정식 공개 시 별도 문서로 제공합니다.
            </p>
          </section>
        </footer>
      </div>
    </main>
  );
}
