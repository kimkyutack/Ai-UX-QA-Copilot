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
            <span className={styles.brandMeta}>Workspace</span>
          </div>
          <nav className={styles.nav}>
            <Link href="/">소개로 돌아가기</Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.badge}>Workspace</span>
            <h1>URL을 입력하고 바로 UX QA 리포트를 생성해 보세요</h1>
            <p>
              모델 연결, 분석 상태 확인, 근거 검토, 결과 해석을 한 흐름 안에서
              이어서 사용할 수 있습니다.
            </p>
          </div>
          <div className={styles.heroMeta}>
            <article>
              <strong>1. 연결 설정</strong>
              <p>프로바이더와 모델을 선택하고 API key를 저장합니다.</p>
            </article>
            <article>
              <strong>2. URL 분석</strong>
              <p>페이지를 수집하고 에이전트가 문제를 정리합니다.</p>
            </article>
            <article>
              <strong>3. 결과 확인</strong>
              <p>근거, 이슈, 권장 수정안을 바로 읽을 수 있습니다.</p>
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
