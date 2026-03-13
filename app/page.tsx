import Link from "next/link";
import styles from "./page.module.css";

type IconName =
  | "radar"
  | "layers"
  | "spark"
  | "flow"
  | "target"
  | "cursor"
  | "shield"
  | "mobile";

type CardItem = {
  icon: IconName;
  title: string;
  description: string;
};

type FlowItem = {
  step: string;
  title: string;
  description: string;
};

const proofPoints = [
  { icon: "radar" as const, label: "실제 페이지 근거 기반 분석" },
  { icon: "layers" as const, label: "멀티 에이전트 UX 리포트" },
  { icon: "spark" as const, label: "한국어 결과 요약" },
  { icon: "flow" as const, label: "반복 분석에 맞는 워크스페이스" },
];

const featureCards: CardItem[] = [
  {
    icon: "layers",
    title: "페이지 구조를 여러 층위로 읽습니다",
    description:
      "제목, 설명, 헤딩, 버튼, 링크, 본문 스니펫을 함께 읽어 단순 요약보다 맥락이 살아 있는 리포트를 만듭니다.",
  },
  {
    icon: "target",
    title: "문제마다 실제 근거를 함께 보여줍니다",
    description:
      "각 이슈는 페이지에서 수집한 문자열과 함께 표시되어 결과를 더 빠르게 검토하고 수정 방향을 잡을 수 있습니다.",
  },
  {
    icon: "flow",
    title: "분석부터 해석까지 흐름이 이어집니다",
    description:
      "설정, 분석, 근거 확인, 결과 해석이 한 번에 이어져 이후 히스토리와 비교 기능으로 확장하기 좋습니다.",
  },
];

const useCases: CardItem[] = [
  {
    icon: "spark",
    title: "랜딩 페이지의 첫인상이 충분히 명확한지 확인",
    description:
      "헤드라인, 서브카피, CTA 흐름이 자연스러운지 빠르게 점검해 첫 화면의 전달력을 개선할 수 있습니다.",
  },
  {
    icon: "cursor",
    title: "버튼과 링크 문구가 행동으로 이어질지 진단",
    description:
      "행동 유도 문구가 분산되어 있거나 설득 순서가 어색한 구간을 우선순위와 함께 정리합니다.",
  },
  {
    icon: "shield",
    title: "정보 구조와 탐색성이 자연스러운지 체크",
    description:
      "헤딩 구조, 라벨 명확성, 링크 문구, 스캔 가능성을 기준으로 접근성과 이해도를 함께 봅니다.",
  },
];

const executionFlow: FlowItem[] = [
  {
    step: "01",
    title: "페이지 수집",
    description:
      "기본 HTML을 읽고, 필요하면 렌더링된 결과까지 다시 수집해 더 정확한 텍스트 근거를 확보합니다.",
  },
  {
    step: "02",
    title: "전문 영역 분석",
    description:
      "명확성, 전환, 접근성, 모바일 관점의 에이전트가 각자 다른 문제를 나눠서 분석합니다.",
  },
  {
    step: "03",
    title: "리포트 정리",
    description:
      "중복 이슈를 정리하고 우선순위를 매겨 한 번에 읽기 쉬운 결과 카드로 묶어 제공합니다.",
  },
  {
    step: "04",
    title: "근거 확인",
    description:
      "결과 아래에서 원본 evidence와 분석 한계를 함께 확인하며 다음 액션을 결정할 수 있습니다.",
  },
];

function SectionIcon({ name }: { name: IconName }) {
  switch (name) {
    case "radar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" />
          <circle cx="12" cy="12" r="4" fill="none" />
          <path d="M12 4v8l6 3" fill="none" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 4 8 4-8 4-8-4 8-4Z" fill="none" />
          <path d="m4 12 8 4 8-4" fill="none" />
          <path d="m4 16 8 4 8-4" fill="none" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m12 3 2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z"
            fill="none"
          />
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
    case "target":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" fill="none" />
          <circle cx="12" cy="12" r="3" fill="none" />
          <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" fill="none" />
        </svg>
      );
    case "cursor":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3v14l4-4 3 7 2-1-3-7h6L5 3Z" fill="none" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" fill="none" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" fill="none" />
        </svg>
      );
    case "mobile":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="3" width="10" height="18" rx="2" fill="none" />
          <path d="M11 18h2" fill="none" />
        </svg>
      );
  }
}

function IconBadge({ name }: { name: IconName }) {
  return (
    <span className={styles.iconBadge}>
      <SectionIcon name={name} />
    </span>
  );
}

function HeroVisual() {
  return (
    <div className={styles.visualBoard} aria-hidden="true">
      <div className={styles.visualWindow}>
        <div className={styles.visualTopbar}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.visualBody}>
          <div className={styles.visualSidebar}>
            <div className={styles.visualSidebarItem} />
            <div className={styles.visualSidebarItem} />
            <div className={styles.visualSidebarItem} />
          </div>
          <div className={styles.visualContent}>
            <div className={styles.visualScoreCard}>
              <small>Overall score</small>
              <strong>82</strong>
              <div className={styles.visualScoreBars}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.visualMiniGrid}>
              <div className={styles.visualMiniCard}>
                <div className={styles.visualMiniIcon}>
                  <SectionIcon name="spark" />
                </div>
                <p>명확성</p>
              </div>
              <div className={styles.visualMiniCard}>
                <div className={styles.visualMiniIcon}>
                  <SectionIcon name="cursor" />
                </div>
                <p>전환</p>
              </div>
              <div className={styles.visualMiniCard}>
                <div className={styles.visualMiniIcon}>
                  <SectionIcon name="shield" />
                </div>
                <p>접근성</p>
              </div>
              <div className={styles.visualMiniCard}>
                <div className={styles.visualMiniIcon}>
                  <SectionIcon name="mobile" />
                </div>
                <p>모바일</p>
              </div>
            </div>
            <div className={styles.visualEvidence}>
              <div className={styles.visualEvidenceLine} />
              <div className={styles.visualEvidenceLineLong} />
              <div className={styles.visualEvidenceTags}>
                <span>Get started</span>
                <span>Product overview</span>
                <span>Book demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      <div className="shell">
        <header className={styles.topbar}>
          <div>
            <p className={styles.brand}>Audit Flow AI</p>
            <span className={styles.brandMeta}>AI UX QA Copilot</span>
          </div>
          <nav className={styles.nav}>
            <a href="#overview">소개</a>
            <a href="#system">분석 방식</a>
            <Link href="/workspace">워크스페이스</Link>
          </nav>
        </header>

        <section className={styles.heroSection} id="overview">
          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.badge}>AI UX QA Copilot</span>
              <h1>페이지를 읽고 문제를 짚어 주는 UX 분석 워크스페이스</h1>
              <p>
                URL을 입력하면 페이지의 텍스트 구조를 수집하고, 여러 분석
                에이전트가 명확성, 접근성, 전환, 모바일 관점에서 문제를 정리해
                한국어 리포트로 보여줍니다.
              </p>
              <div className={styles.actions}>
                <Link href="/workspace" className={styles.primaryAction}>
                  워크스페이스 열기
                </Link>
                <a href="#system" className={styles.secondaryAction}>
                  분석 방식 보기
                </a>
              </div>
              <div className={styles.proofRow}>
                {proofPoints.map((item) => (
                  <span key={item.label}>
                    <SectionIcon name={item.icon} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <aside className={styles.heroPanel}>
              <div className={styles.panelIntro}>
                <span>Overview</span>
                <strong>
                  문제를 찾는 것에서 끝나지 않고, 바로 수정할 수 있게 정리합니다
                </strong>
                <p>
                  점수만 보여주는 대신 왜 문제가 되는지, 어떤 문구와 구조를
                  근거로 판단했는지, 무엇부터 고치면 좋은지를 한 화면에서 이어서
                  볼 수 있습니다.
                </p>
              </div>
              <HeroVisual />
            </aside>
          </div>
        </section>

        <section className={styles.signalSection}>
          <div className={styles.signalRail}>
            {proofPoints.map((item) => (
              <article key={item.label} className={styles.signalCard}>
                <IconBadge name={item.icon} />
                <strong>{item.label}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionHeading}>
            <span>Highlights</span>
            <h2>읽기 전에 구조가 먼저 보이도록 설계한 분석 경험</h2>
            <p>
              복잡한 설명보다, 어떤 정보를 모으고 어떤 식으로 정리해 보여주는지
              한눈에 이해할 수 있도록 섹션과 카드의 역할을 분명히 나눴습니다.
            </p>
          </div>
          <div className={styles.featureSplit}>
            <div className={styles.featureList}>
              {featureCards.map((item) => (
                <article key={item.title} className={styles.featureRow}>
                  <IconBadge name={item.icon} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.featureCanvas} aria-hidden="true">
              <div className={styles.canvasRing} />
              <div className={styles.canvasCardPrimary}>
                <div className={styles.canvasLabel}>Evidence</div>
                <strong>Get started</strong>
                <p>실제 버튼 문구와 헤딩 구조를 함께 참고합니다.</p>
              </div>
              <div className={styles.canvasCardSecondary}>
                <div className={styles.canvasMetric}>Accessibility 76</div>
                <div className={styles.canvasMetric}>Conversion 83</div>
                <div className={styles.canvasMetric}>Clarity 88</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.useCaseSection}>
          <div className={styles.sectionHeading}>
            <span>Use cases</span>
            <h2>이런 페이지를 점검할 때 특히 유용합니다</h2>
            <p>
              랜딩 페이지의 첫인상, CTA 문구, 정보 구조, 모바일 가독성처럼
              텍스트 기반으로 빠르게 진단할 수 있는 문제를 우선적으로
              찾아냅니다.
            </p>
          </div>
          <div className={styles.buyerGrid}>
            {useCases.map((item) => (
              <article key={item.title} className={styles.buyerCard}>
                <IconBadge name={item.icon} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.systemSection} id="system">
          <div className={styles.sectionHeading}>
            <span>How it works</span>
            <h2>수집부터 리포트 정리까지 단계가 분명한 분석 흐름</h2>
            <p>
              단순 요약이 아니라, 페이지를 읽고 역할별로 나눠 분석한 뒤 최종
              리포트로 정리하는 흐름을 기준으로 설계했습니다.
            </p>
          </div>
          <div className={styles.flowStack}>
            {executionFlow.map((item) => (
              <article key={item.step} className={styles.flowStepCard}>
                <div className={styles.flowNumber}>{item.step}</div>
                <div className={styles.flowContent}>
                  <div className={styles.flowHead}>
                    <h3>{item.title}</h3>
                    <IconBadge
                      name={
                        item.step === "01"
                          ? "radar"
                          : item.step === "02"
                            ? "layers"
                            : item.step === "03"
                              ? "spark"
                              : "target"
                      }
                    />
                  </div>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.previewSection}>
          <div className={styles.previewCopy}>
            <span className={styles.previewKicker}>Workspace preview</span>
            <h2>전용 워크스페이스에서 바로 시작할 수 있습니다</h2>
            <p>워크스페이스에서 분석 리포트를 확인해보세요.</p>
            <div className={styles.previewActions}>
              <Link href="/workspace" className={styles.primaryAction}>
                분석하러가기
              </Link>
            </div>
          </div>
          <div className={styles.previewFrame} aria-hidden="true">
            <div className={styles.previewSidebar}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewTop} />
              <div className={styles.previewGrid}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.previewReport} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
