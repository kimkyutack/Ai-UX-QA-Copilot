import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./pricing.module.css";

const plans = [
  {
    label: "Starter",
    price: "무료",
    summary: "혼자 빠르게 검토",
    points: ["BYOK 분석", "프로젝트 히스토리", "공유 링크"],
  },
  {
    label: "Team",
    price: "준비 중",
    summary: "반복 점검과 협업",
    points: ["팀 상태 관리", "비교 리포트", "정기 점검"],
    featured: true,
  },
  {
    label: "Enterprise",
    price: "문의",
    summary: "조직 정책과 운영",
    points: ["도입 지원", "보안 요건 대응", "맞춤 운영 흐름"],
  },
];

const switches = [
  "직접 비용 통제",
  "팀 협업으로 확장",
  "조직 운영에 맞춤",
];

export default function PricingPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={`shell ${styles.shellWide}`}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Pricing</span>
            <h1>작게 시작하고, 필요한 순간만 넓히세요.</h1>
            <p>
              첫 리포트는 바로 만들어보고, 팀으로 운영할 준비가 되면 그때 확장할 수 있습니다.
            </p>
            <div className={styles.heroActions}>
              <Link href="/workspace" className={styles.primaryAction}>
                무료로 시작하기
              </Link>
              <Link href="/faq" className={styles.secondaryAction}>
                FAQ 보기
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualGlow} />
            <div className={styles.visualStage}>
              <div className={styles.visualTop}>
                <span>현재 단계</span>
                <strong>Starter</strong>
              </div>
              <div className={styles.visualMeter}>
                <div className={styles.visualFill} />
              </div>
              <div className={styles.visualCards}>
                {switches.map((item, index) => (
                  <article key={item} className={styles.visualCard}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item}</strong>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.planRail}>
          {plans.map((plan) => (
            <article
              key={plan.label}
              className={plan.featured ? styles.planFeatured : styles.planCard}
            >
              <div className={styles.planHead}>
                <span>{plan.label}</span>
                <strong>{plan.price}</strong>
              </div>
              <p>{plan.summary}</p>
              <ul className={styles.planPoints}>
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className={styles.storySection}>
          <article className={styles.storyCard}>
            <span className={styles.storyLabel}>개인</span>
            <h2>먼저 직접 써보며 제품에 맞는지 빠르게 확인합니다.</h2>
            <p>첫 분석, 첫 비교, 첫 공유까지 비용 부담 없이 확인할 수 있습니다.</p>
          </article>

          <article className={styles.storyCardAlt}>
            <span className={styles.storyLabel}>팀</span>
            <h2>같은 리포트를 함께 보고, 상태와 메모로 이어갑니다.</h2>
            <p>디자인, PM, 마케팅이 같은 화면에서 같은 근거를 기준으로 움직일 수 있습니다.</p>
          </article>
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span className={styles.eyebrow}>Start</span>
            <h2>가장 빠른 판단은 직접 한 번 돌려보는 것입니다.</h2>
          </div>
          <Link href="/workspace" className={styles.primaryAction}>
            워크스페이스 열기
          </Link>
        </section>
      </div>
    </main>
  );
}
