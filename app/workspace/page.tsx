import Link from "next/link";
import { UxCopilot } from "@/components/ux-copilot";
import styles from "./workspace.module.css";

export default function WorkspacePage() {
  return (
    <main className={styles.page}>
      <div className="shell">
        <header className={styles.topbar}>
          <div>
            <p className={styles.brand}>Audit Flow AI</p>
            <span className={styles.brandMeta}>분석 워크스페이스</span>
          </div>
          <nav className={styles.nav}>
            <Link href="/">소개로 돌아가기</Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.badge}>분석 워크스페이스</span>
            <h1>도메인을 입력하고 바로 UX QA 리포트를 생성해 보세요</h1>
            <p>
              모델 연결, 분석 상태 확인, 근거 검토, 결과 해석을 한 흐름 안에서
              이어서 사용할 수 있습니다.
            </p>
          </div>
          <div className={styles.heroMeta}>
            <article>
              <strong>명확성</strong>
              <p>첫 화면에서 무엇을 위한 페이지인지 바로 이해되는지 봅니다.</p>
            </article>
            <article>
              <strong>행동 유도</strong>
              <p>다음 행동이 자연스럽게 이어지도록 CTA와 흐름을 봅니다.</p>
            </article>
            <article>
              <strong>정보 계층</strong>
              <p>무엇이 먼저 보여야 하는지 시각적 우선순위를 점검합니다.</p>
            </article>
          </div>
        </section>

        <section className={styles.workspaceShell}>
          <UxCopilot />
        </section>
      </div>
    </main>
  );
}
