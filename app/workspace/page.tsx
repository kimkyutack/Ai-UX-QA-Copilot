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
            <h1>경험해보지 못한 색다른 UX 리뷰를 시작해 보세요</h1>
            <p>
              모델 연결, 분석 모드 선택, 근거 검토, 실행 초안 확인, 비교 리포트,
              협업 상태 관리, 공유 링크 생성까지 한 흐름 안에서 이어서 사용할 수
              있습니다.
            </p>
          </div>
          <div className={styles.heroMeta}>
            <article>
              <strong>분석 모드</strong>
              <p>
                같은 페이지도 SaaS, 이커머스, 포트폴리오, 채용, 문서 기준에 따라
                다르게 평가합니다.
              </p>
            </article>
            <article>
              <strong>비교와 실행</strong>
              <p>
                최근 분석 히스토리와 비교 리포트를 통해 무엇이 좋아졌는지 바로
                확인할 수 있습니다.
              </p>
            </article>
            <article>
              <strong>협업과 공유</strong>
              <p>
                이슈별 상태, 담당자, 팀 메모를 남기고 공유 페이지나 PDF로 결과를
                전달할 수 있습니다.
              </p>
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
